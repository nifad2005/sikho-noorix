import React from 'react';

const escapeHtml = (unsafe: string): string => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

const toHtml = (text: string): string => {
    if (!text) return '';
    let html = escapeHtml(text);
    
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    
    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    
    // Inline code: `text`
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-200 text-slate-800 rounded px-1 py-0.5 font-mono text-sm">$1</code>');

    // Lists (simple bullet points)
    html = html.replace(/^\s*([*-])\s/gm, '&bull; ');

    // Newlines to <br>
    html = html.replace(/\n/g, '<br />');
    
    return html;
};

interface MarkdownRendererProps {
    content: string;
    as?: 'div' | 'span';
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, as = 'div', className }) => {
    const Component = as;
    return <Component className={className} dangerouslySetInnerHTML={{ __html: toHtml(content) }} />;
};

export default MarkdownRenderer;
