import React, { useState } from 'react';
import { Copy, Download, FileText, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const OutputPanel = ({ transcript, mom, activeTab, onTabChange }) => {
  const [copyFeedback, setCopyFeedback] = useState('');

  const convertInlineMarkdown = (text) => {
    if (!text) return '';

    return text
      .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/<[^>]+>/g, '');
  };

  const stripMarkdown = (markdownText) => {
    if (!markdownText) return '';

    const lines = markdownText.replace(/\r\n/g, '\n').split('\n');
    const output = [];
    let inCodeBlock = false;

    lines.forEach((line) => {
      const trimmedLine = line.replace(/[ \t]+$/g, '');
      const trimmedStart = trimmedLine.trimStart();

      if (/^```/.test(trimmedStart)) {
        inCodeBlock = !inCodeBlock;
        if (!inCodeBlock) {
          output.push('');
        }
        return;
      }

      if (inCodeBlock) {
        output.push(trimmedLine.replace(/^\s{0,3}/, ''));
        return;
      }

      if (!trimmedStart) {
        if (output[output.length - 1] !== '') {
          output.push('');
        }
        return;
      }

      const headingMatch = trimmedStart.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const headingText = convertInlineMarkdown(headingMatch[2]);
        output.push('');
        output.push(headingText);
        output.push('');
        return;
      }

      const blockquoteMatch = trimmedStart.match(/^>\s?(.*)$/);
      if (blockquoteMatch) {
        output.push(`> ${convertInlineMarkdown(blockquoteMatch[1])}`.trimEnd());
        return;
      }

      const unorderedMatch = trimmedStart.match(/^([-*+])\s+(.*)$/);
      if (unorderedMatch) {
        output.push(`- ${convertInlineMarkdown(unorderedMatch[2])}`.trimEnd());
        return;
      }

      const orderedMatch = trimmedStart.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        output.push(`${orderedMatch[1]}. ${convertInlineMarkdown(orderedMatch[2])}`.trimEnd());
        return;
      }

      const tableCells = trimmedStart.includes('|')
        ? trimmedStart.split('|').map((cell) => cell.trim()).filter(Boolean)
        : null;

      if (tableCells && tableCells.length > 1) {
        output.push(tableCells.map((cell) => convertInlineMarkdown(cell)).join(' | '));
        return;
      }

      output.push(convertInlineMarkdown(trimmedLine));
    });

    return output
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleCopy = (text, source) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(source);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleDownload = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => onTabChange('transcript')}
          className={`px-4 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'transcript'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Transcript
        </button>
        <button
          onClick={() => onTabChange('mom')}
          className={`px-4 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'mom'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Minutes of Meeting
        </button>
      </div>

      {/* Content Area */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="flex gap-2 p-4 border-b border-slate-700">
              <button
                onClick={() => handleCopy(transcript, 'transcript')}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-sm transition-all"
              >
                <Copy className="w-4 h-4" />
                {copyFeedback === 'transcript' ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => handleDownload(transcript, 'transcript.txt', 'text/plain')}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words">
                {transcript}
              </pre>
            </div>
          </div>
        )}

        {/* MOM Tab */}
        {activeTab === 'mom' && (
          <div className="space-y-4">
            <div className="flex gap-2 p-4 border-b border-slate-700 flex-wrap">
              <button
                onClick={() => handleCopy(mom, 'mom')}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-sm transition-all"
              >
                <Copy className="w-4 h-4" />
                {copyFeedback === 'mom' ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => handleDownload(mom, 'MOM.md', 'text/markdown')}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                Download MD
              </button>
              <button
                onClick={() => handleDownload(stripMarkdown(mom), 'MOM.txt', 'text/plain')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Download TXT
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-purple-400 mt-6 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-blue-400 mt-5 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold text-slate-300 mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-slate-300 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-slate-300 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-slate-300 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-300">{children}</li>,
                  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                  code: ({ children }) => (
                    <code className="bg-slate-800 text-orange-400 px-2 py-1 rounded text-sm font-mono">{children}</code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-500 pl-4 italic text-slate-400 my-3">{children}</blockquote>
                  ),
                }}
              >
                {mom}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;
