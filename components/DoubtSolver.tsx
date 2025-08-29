import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface DoubtSolverProps {
  messages: ChatMessage[];
  onAsk: (doubt: string) => void;
  isLoading: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  context: string | null;
  onClearContext: () => void;
}

const DoubtSolver: React.FC<DoubtSolverProps> = ({ messages, onAsk, isLoading, inputValue, onInputChange, context, onClearContext }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (inputValue || context) {
      inputRef.current?.focus();
    }
  }, [inputValue, context]);
  
  const handleSend = () => {
    if ((inputValue.trim() || context) && !isLoading) {
      onAsk(inputValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                <SparklesIcon className="h-6 w-6 text-indigo-500"/>
                <span>Ask a Doubt</span>
            </h3>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-slate-500 mt-4">
                <p>Have a question? Highlight text from the lesson or type your query below.</p>
              </div>
            )}
            {messages.map((msg, index) => (
                <div key={index} className={`flex my-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
                        {msg.role === 'model' ? (
                            <MarkdownRenderer content={msg.text} className="text-sm break-words" />
                        ) : (
                            <p className="text-sm break-words">{msg.text}</p>
                        )}
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex my-2 justify-start">
                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-slate-200 text-slate-800">
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        
        <div className="flex-shrink-0 border-t border-slate-200 bg-white">
            {context && (
                <div className="p-3 border-b border-slate-200 bg-indigo-50">
                    <div className="flex justify-between items-start">
                        <div className="text-xs text-slate-600 overflow-hidden">
                            <span className="font-semibold text-indigo-700">Context:</span>
                            <p className="mt-1 italic line-clamp-2">"{context}"</p>
                        </div>
                        <button onClick={onClearContext} className="p-1 rounded-full hover:bg-slate-200 flex-shrink-0 ml-2">
                            <XCircleIcon className="h-5 w-5 text-slate-500"/>
                        </button>
                    </div>
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center space-x-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question about the context..."
                        disabled={isLoading}
                        className="w-full px-4 py-2 border border-slate-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800"
                    />
                    <button onClick={handleSend} disabled={isLoading || (!inputValue.trim() && !context)} className="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 disabled:bg-slate-400">
                        Ask
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DoubtSolver;