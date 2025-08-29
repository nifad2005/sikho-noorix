import React, { useState, useRef } from 'react';
import { RoadmapTopic, LearningContent, ChatMessage } from '../types';
import PracticeSection from './PracticeSection';
import DoubtSolver from './DoubtSolver';
import Spinner from './Spinner';
import InteractiveText from './InteractiveText';
import MarkdownRenderer from './MarkdownRenderer';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';


interface LearningViewProps {
  topic: RoadmapTopic | null;
  content: LearningContent | null;
  practiceExamples: string[];
  isGeneratingExamples: boolean;
  onGenerateMoreExamples: () => void;
  isLoading: boolean;
  onMarkComplete: () => void;
  doubtMessages: ChatMessage[];
  onAskDoubt: (doubt: string, context: string | null) => void;
  isDoubtLoading: boolean;
}

type ActiveTab = 'learn' | 'practice';

const LearningView: React.FC<LearningViewProps> = ({
  topic,
  content,
  practiceExamples,
  isGeneratingExamples,
  onGenerateMoreExamples,
  isLoading,
  onMarkComplete,
  doubtMessages,
  onAskDoubt,
  isDoubtLoading
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('learn');
  const [doubtInput, setDoubtInput] = useState('');
  const [doubtContext, setDoubtContext] = useState<string | null>(null);
  const [selectionPopover, setSelectionPopover] = useState<{ x: number, y: number, text: string } | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const viewContainerRef = useRef<HTMLDivElement>(null);

  const handleTextSelection = () => {
    if (selectionPopover) {
        setSelectionPopover(null);
        return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
        const text = selection.toString().trim();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer) && viewContainerRef.current) {
             const containerRect = viewContainerRef.current.getBoundingClientRect();
             setSelectionPopover({
                x: (rect.left - containerRect.left) + rect.width / 2,
                y: rect.top - containerRect.top,
                text: text,
            });
        }
    }
  };
  
  const handleAskDoubtWrapper = (doubt: string) => {
    if (doubt.trim() || doubtContext) {
        onAskDoubt(doubt, doubtContext);
        setDoubtInput('');
        setDoubtContext(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white p-8">
        <div className="flex flex-col items-center">
          <Spinner />
          <p className="mt-4 text-slate-600 font-medium">Loading content for "{topic?.title}"...</p>
        </div>
      </div>
    );
  }

  if (!topic || !content) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center bg-white p-8">
        <LightBulbIcon className="h-16 w-16 text-slate-400 mb-4" />
        <h3 className="text-2xl font-bold text-slate-800">Select a Topic</h3>
        <p className="mt-2 text-slate-500">Choose a topic from your roadmap on the left to begin learning.</p>
      </div>
    );
  }
  
  return (
    <div ref={viewContainerRef} className="relative w-full h-full bg-white overflow-hidden flex flex-col">
       {selectionPopover && (
          <div
              style={{ top: `${selectionPopover.y}px`, left: `${selectionPopover.x}px` }}
              className="absolute -translate-x-1/2 -translate-y-full mt-[-8px] z-20"
              onMouseDown={(e) => e.stopPropagation()}
          >
              <button
                  onClick={() => {
                      setDoubtContext(selectionPopover.text);
                      setSelectionPopover(null);
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white text-sm font-semibold rounded-full shadow-lg flex items-center space-x-2 hover:bg-slate-700 transition-colors"
              >
                   <SparklesIcon className="h-4 w-4 text-indigo-400" />
                   <span>Ask about this</span>
              </button>
          </div>
      )}

      <div className="p-6 border-b border-slate-200 flex-shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{topic.title}</h2>
          <p className="mt-1 text-slate-500">{topic.description}</p>
        </div>
        {!topic.completed && (
           <button
             onClick={onMarkComplete}
             className="flex-shrink-0 ml-4 px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
           >
             <CheckCircleIcon className="h-5 w-5" />
             <span>Mark as Complete</span>
           </button>
        )}
      </div>

      <div className="flex-grow flex flex-row min-h-0">
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="px-6 border-b border-slate-200 flex-shrink-0">
            <div className="flex space-x-4">
              <TabButton name="Learn" active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} />
              <TabButton name="Practice" active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} />
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6" ref={contentRef} onMouseUp={handleTextSelection}>
            {activeTab === 'learn' && (
              <div key="learn-tab" className="prose prose-lg max-w-none prose-indigo fade-in-content">
                <h3 className="text-xl font-semibold text-slate-800 border-b pb-2 mb-4">Explanation</h3>
                 <InteractiveText text={content.explanation} glossary={content.glossary} />
                
                <h3 className="text-xl font-semibold text-slate-800 border-b pb-2 my-6">Examples</h3>
                <ul className="space-y-4">
                  {content.examples.map((example, index) => (
                    <li key={index} className="p-4 bg-slate-50 border-l-4 border-indigo-500 rounded-r-lg">
                      <MarkdownRenderer content={example} className="text-slate-700" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === 'practice' && (
              <div key="practice-tab" className="fade-in-content">
                 <PracticeSection
                    practiceExamples={practiceExamples}
                    onGenerateMoreExamples={onGenerateMoreExamples}
                    isGeneratingExamples={isGeneratingExamples}
                 />
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex w-1/3 border-l border-slate-200 flex-col">
          <DoubtSolver 
            messages={doubtMessages}
            onAsk={handleAskDoubtWrapper}
            isLoading={isDoubtLoading}
            inputValue={doubtInput}
            onInputChange={setDoubtInput}
            context={doubtContext}
            onClearContext={() => setDoubtContext(null)}
          />
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ name: string; active: boolean; onClick: () => void }> = ({ name, active, onClick }) => (
    <button
      onClick={onClick}
      className={`py-3 px-1 text-lg font-semibold transition-colors duration-200 border-b-2 ${
        active
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {name}
    </button>
);


export default LearningView;