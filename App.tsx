

import React, { useState, useCallback } from 'react';
import { LearningMaterial, RoadmapModule, LearningContent, ChatMessage, RoadmapTopic } from './types';
import { generateRoadmap, generateLearningContent, generatePracticeExamples, answerDoubt } from './services/geminiService';
import Header from './components/Header';
import MaterialInput from './components/MaterialInput';
import RoadmapView from './components/RoadmapView';
import LearningView from './components/LearningView';
import Spinner from './components/Spinner';

type AppState = 'INPUT' | 'GENERATING' | 'LEARNING' | 'ERROR';

export default function App() {
  const [appState, setAppState] = useState<AppState>('INPUT');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [learningMaterials, setLearningMaterials] = useState<LearningMaterial[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapModule[]>([]);
  const [activeTopic, setActiveTopic] = useState<RoadmapTopic | null>(null);
  const [learningContent, setLearningContent] = useState<LearningContent | null>(null);
  const [practiceExamples, setPracticeExamples] = useState<string[]>([]);
  const [isContentLoading, setIsContentLoading] = useState<boolean>(false);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState<boolean>(false);
  const [doubtMessages, setDoubtMessages] = useState<ChatMessage[]>([]);
  const [isDoubtLoading, setIsDoubtLoading] = useState<boolean>(false);

  // Caching and pre-fetching state
  const [learningContentCache, setLearningContentCache] = useState<Map<string, LearningContent>>(new Map());
  const [practiceExamplesCache, setPracticeExamplesCache] = useState<Map<string, string[]>>(new Map());
  const [prefetchingTopics, setPrefetchingTopics] = useState<Set<string>>(new Set());

  const prefetchTopicContent = useCallback(async (topic: RoadmapTopic) => {
    if (learningContentCache.has(topic.title) || practiceExamplesCache.has(topic.title) || prefetchingTopics.has(topic.title)) {
        return;
    }
    
    try {
        setPrefetchingTopics(prev => new Set(prev).add(topic.title));
        const [content, initialExamples] = await Promise.all([
            generateLearningContent(topic.title, learningMaterials),
            generatePracticeExamples(topic.title, learningMaterials, [])
        ]);
        setLearningContentCache(prev => new Map(prev).set(topic.title, content));
        setPracticeExamplesCache(prev => new Map(prev).set(topic.title, initialExamples));
    } catch (error) {
        console.error(`Failed to prefetch content for ${topic.title}:`, error);
    } finally {
        setPrefetchingTopics(prev => {
            const newSet = new Set(prev);
            newSet.delete(topic.title);
            return newSet;
        });
    }
  }, [learningMaterials, learningContentCache, practiceExamplesCache, prefetchingTopics]);

  const handleStartLearning = useCallback(async (materials: LearningMaterial[]) => {
    setLearningMaterials(materials);
    setAppState('GENERATING');
    setErrorMessage('');
    try {
      const generatedRoadmap = await generateRoadmap(materials);
      setRoadmap(generatedRoadmap);
      setAppState('LEARNING');
      
      const firstTopic = generatedRoadmap[0]?.topics[0];
      if (firstTopic) {
        prefetchTopicContent(firstTopic);
      }
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred while generating the roadmap.');
      setAppState('ERROR');
    }
  }, [prefetchTopicContent]);

  const findNextTopic = (currentTopic: RoadmapTopic, roadmapData: RoadmapModule[]): RoadmapTopic | null => {
      let currentModuleIndex = -1;
      let currentTopicIndex = -1;

      for (let i = 0; i < roadmapData.length; i++) {
          const topicIndex = roadmapData[i].topics.findIndex(t => t.title === currentTopic.title);
          if (topicIndex !== -1) {
              currentModuleIndex = i;
              currentTopicIndex = topicIndex;
              break;
          }
      }

      if (currentModuleIndex === -1) return null;

      if (currentTopicIndex < roadmapData[currentModuleIndex].topics.length - 1) {
          return roadmapData[currentModuleIndex].topics[currentTopicIndex + 1];
      }

      if (currentModuleIndex < roadmapData.length - 1) {
          if (roadmapData[currentModuleIndex + 1].topics.length > 0) {
              return roadmapData[currentModuleIndex + 1].topics[0];
          }
      }

      return null;
  };
  
  const handleSelectTopic = useCallback(async (topic: RoadmapTopic) => {
    if (activeTopic?.title === topic.title) return;

    const requestedTopicTitle = topic.title;

    setActiveTopic(topic);
    setLearningContent(null);
    setPracticeExamples([]);
    setDoubtMessages([]);

    if (learningContentCache.has(requestedTopicTitle) && practiceExamplesCache.has(requestedTopicTitle)) {
        setIsContentLoading(false);
        setLearningContent(learningContentCache.get(requestedTopicTitle)!);
        setPracticeExamples(practiceExamplesCache.get(requestedTopicTitle)!);
    } else {
        setIsContentLoading(true);
        try {
          const [content, initialExamples] = await Promise.all([
            generateLearningContent(requestedTopicTitle, learningMaterials),
            generatePracticeExamples(requestedTopicTitle, learningMaterials)
          ]);
          
          setActiveTopic(currentActiveTopic => {
              if (currentActiveTopic?.title === requestedTopicTitle) {
                  setLearningContent(content);
                  setPracticeExamples(initialExamples);
                  setLearningContentCache(prev => new Map(prev).set(requestedTopicTitle, content));
                  setPracticeExamplesCache(prev => new Map(prev).set(requestedTopicTitle, initialExamples));
                  setIsContentLoading(false);
              }
              return currentActiveTopic;
          });

        } catch (error) {
            setActiveTopic(currentActiveTopic => {
                if (currentActiveTopic?.title === requestedTopicTitle) {
                    console.error("Failed to load topic content:", error);
                    setLearningContent({ explanation: `Failed to load content for ${requestedTopicTitle}. Please try again.`, examples: [], glossary: [] });
                    setIsContentLoading(false);
                }
                return currentActiveTopic;
            });
        }
    }
    
    const nextTopic = findNextTopic(topic, roadmap);
    if (nextTopic) {
        prefetchTopicContent(nextTopic);
    }
  }, [activeTopic, learningMaterials, roadmap, learningContentCache, practiceExamplesCache, prefetchTopicContent]);

  const handleGenerateMoreExamples = async () => {
    if (!activeTopic) return;

    setIsGeneratingExamples(true);
    try {
        const newExamples = await generatePracticeExamples(activeTopic.title, learningMaterials, practiceExamples);
        const allExamples = [...practiceExamples, ...newExamples];
        setPracticeExamples(allExamples);
        setPracticeExamplesCache(prev => new Map(prev).set(activeTopic.title, allExamples));
    } catch (error) {
        console.error("Failed to generate more examples:", error);
        // Optionally, show a toast or a small error message to the user
    } finally {
        setIsGeneratingExamples(false);
    }
  };

  const handleMarkTopicComplete = (moduleIndex: number, topicIndex: number) => {
    setRoadmap(prevRoadmap => {
      const newRoadmap = [...prevRoadmap];
      newRoadmap[moduleIndex].topics[topicIndex].completed = true;
      return newRoadmap;
    });
  };

  const handleAskDoubt = async (doubt: string, context: string | null) => {
      const userQuestion = doubt || (context ? `Can you explain this?: "${context}"` : '');
      if (!userQuestion) return;

      const newMessages: ChatMessage[] = [...doubtMessages, { role: 'user', text: userQuestion }];
      setDoubtMessages(newMessages);
      setIsDoubtLoading(true);

      try {
          const answer = await answerDoubt(doubt, newMessages, learningMaterials, activeTopic?.title || 'general concepts', context);
          setDoubtMessages(prev => [...prev, { role: 'model', text: answer }]);
      } catch (error) {
          console.error("Failed to get answer for doubt:", error);
          setDoubtMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error trying to answer your question." }]);
      } finally {
          setIsDoubtLoading(false);
      }
  };

  const handleReset = () => {
    setAppState('INPUT');
    setLearningMaterials([]);
    setRoadmap([]);
    setActiveTopic(null);
    setLearningContent(null);
    setPracticeExamples([]);
    setDoubtMessages([]);
    setErrorMessage('');
    setLearningContentCache(new Map());
    setPracticeExamplesCache(new Map());
    setPrefetchingTopics(new Set());
  };

  const renderContent = () => {
    switch (appState) {
      case 'GENERATING':
        return (
          <div className="flex flex-col items-center justify-center h-screen -mt-20">
            <Spinner />
            <p className="text-xl text-slate-600 mt-4 font-medium">Crafting your personalized learning path...</p>
            <p className="text-slate-500 mt-2">This may take a moment. Great things are worth the wait!</p>
          </div>
        );
      case 'LEARNING':
        return (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
            <aside className="w-full lg:w-1/3 xl:w-1/4 lg:h-full lg:overflow-y-auto bg-white border-r border-slate-200 p-4">
              <RoadmapView 
                roadmap={roadmap} 
                activeTopic={activeTopic} 
                onSelectTopic={handleSelectTopic}
                prefetchingTopics={prefetchingTopics}
              />
            </aside>
            <main className="w-full lg:w-2/3 xl:w-3/4 lg:h-full lg:overflow-y-auto">
              <LearningView
                topic={activeTopic}
                content={learningContent}
                practiceExamples={practiceExamples}
                isGeneratingExamples={isGeneratingExamples}
                onGenerateMoreExamples={handleGenerateMoreExamples}
                isLoading={isContentLoading}
                onMarkComplete={() => {
                  if (!activeTopic) return;
                  const moduleIndex = roadmap.findIndex(m => m.topics.some(t => t.title === activeTopic.title));
                  const topicIndex = roadmap[moduleIndex]?.topics.findIndex(t => t.title === activeTopic.title);
                  if(moduleIndex !== -1 && topicIndex !== -1) {
                    handleMarkTopicComplete(moduleIndex, topicIndex);
                  }
                }}
                doubtMessages={doubtMessages}
                onAskDoubt={handleAskDoubt}
                isDoubtLoading={isDoubtLoading}
              />
            </main>
          </div>
        );
      case 'ERROR':
        return (
          <div className="flex flex-col items-center justify-center text-center h-screen -mt-20">
             <h2 className="text-2xl font-bold text-red-600 mb-4">Generation Failed</h2>
             <p className="text-slate-600 max-w-md mb-6">{errorMessage}</p>
             <button
               onClick={handleReset}
               className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
             >
               Try Again
             </button>
           </div>
        );
      case 'INPUT':
      default:
        return <MaterialInput onStartLearning={handleStartLearning} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header onReset={handleReset} showReset={appState !== 'INPUT'}/>
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
}