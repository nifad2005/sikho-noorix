import React from 'react';
import { GlossaryTerm } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface InteractiveTextProps {
  text: string;
  glossary: GlossaryTerm[];
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, glossary }) => {
    if (!glossary || glossary.length === 0) {
        return <MarkdownRenderer content={text} className="text-slate-700 leading-relaxed" />;
    }

    // Create a regex that finds any of the glossary terms, ignoring case.
    // The `\b` ensures we match whole words only. `gi` for global, case-insensitive.
    // We also sort by length descending to match longer terms first (e.g., "React Hook" before "React").
    const sortedGlossary = [...glossary].sort((a, b) => b.term.length - a.term.length);
    const termsRegex = new RegExp(`\\b(${sortedGlossary.map(g => g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    const parts = text.split(termsRegex);

    return (
        <div className="text-slate-700 leading-relaxed">
            {parts.map((part, index) => {
                // Every odd-indexed part is a matched term
                if (index % 2 === 1) {
                    const termData = sortedGlossary.find(g => g.term.toLowerCase() === part.toLowerCase());
                    if (termData) {
                        return <GlossaryTermComponent key={index} term={part} definition={termData.definition} />;
                    }
                }
                // Even-indexed parts (and unmatched odd parts) are the text between matches
                return <MarkdownRenderer key={index} as="span" content={part} />;
            })}
        </div>
    );
};

const GlossaryTermComponent: React.FC<{ term: string; definition: string }> = ({ term, definition }) => {
    return (
        <span className="relative group inline-block">
            <span className="font-semibold text-indigo-600 border-b-2 border-indigo-200 border-dashed cursor-help">
                {term}
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                {definition}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
            </span>
        </span>
    );
};

export default InteractiveText;
