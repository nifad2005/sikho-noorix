import React from 'react';
import Spinner from './Spinner';
import { SparklesIcon } from './icons/SparklesIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface PracticeSectionProps {
  practiceExamples: string[];
  onGenerateMoreExamples: () => void;
  isGeneratingExamples: boolean;
}

const PracticeSection: React.FC<PracticeSectionProps> = ({ practiceExamples, onGenerateMoreExamples, isGeneratingExamples }) => {
  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-800 mb-6">Practice with Examples</h3>
      
      {practiceExamples.length === 0 && !isGeneratingExamples ? (
        <div className="text-center p-8 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No practice examples available for this topic yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {practiceExamples.map((example, index) => (
            <div key={index} className="p-4 bg-slate-50 border-l-4 border-indigo-500 rounded-r-lg fade-in-content" style={{animationDelay: `${index * 100}ms`}}>
              <MarkdownRenderer content={example} className="text-slate-700" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <button
            onClick={onGenerateMoreExamples}
            disabled={isGeneratingExamples}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto transition-all"
          >
            {isGeneratingExamples ? (
                <>
                    <Spinner />
                    <span className="ml-2">Generating...</span>
                </>
            ) : (
                <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    <span>Generate more examples</span>
                </>
            )}
          </button>
      </div>
    </div>
  );
};

export default PracticeSection;