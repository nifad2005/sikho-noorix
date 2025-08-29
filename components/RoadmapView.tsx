
import React from 'react';
import { RoadmapModule, RoadmapTopic } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface RoadmapViewProps {
  roadmap: RoadmapModule[];
  activeTopic: RoadmapTopic | null;
  onSelectTopic: (topic: RoadmapTopic) => void;
  prefetchingTopics: Set<string>;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, activeTopic, onSelectTopic, prefetchingTopics }) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3">Your Learning Roadmap</h2>
      {roadmap.length === 0 ? (
        <p className="text-slate-500">No roadmap generated yet.</p>
      ) : (
        <div className="space-y-6">
          {roadmap.map((module, moduleIndex) => (
            <div key={moduleIndex}>
              <h3 className="text-lg font-semibold text-indigo-700 mb-3">{module.title}</h3>
              <ul className="space-y-2">
                {module.topics.map((topic, topicIndex) => {
                  const isActive = activeTopic?.title === topic.title;
                  const isPrefetching = prefetchingTopics.has(topic.title) && !isActive;
                  return (
                    <li key={topicIndex}>
                      <button
                        onClick={() => onSelectTopic(topic)}
                        className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-800 shadow-inner'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <CheckCircleIcon
                            className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                              topic.completed ? 'text-green-500' : 'text-slate-300'
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{topic.title}</span>
                            <span className={`text-xs ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                              {topic.description}
                            </span>
                          </div>
                        </div>
                        {isPrefetching ? (
                          <div className="h-5 w-5 flex items-center justify-center" aria-label="Loading content">
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <ChevronRightIcon className={`h-5 w-5 text-slate-400 transition-transform ${isActive ? 'transform translate-x-1' : ''}`} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoadmapView;
