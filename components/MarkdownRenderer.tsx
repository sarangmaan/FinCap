import React from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Rocket, AlertOctagon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  mode?: 'dark' | 'light';
}

const TableRenderer: React.FC<{ rows: string[]; mode: 'dark' | 'light' }> = ({ rows, mode }) => {
  if (rows.length < 2) return null;

  const headers = rows[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
  const dataRows = rows.slice(2).map(r => r.split('|').filter(c => c.trim() !== '').map(c => c.trim()));

  const borderColor = mode === 'light' ? 'border-slate-300' : 'border-slate-700';
  const headerBg = mode === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-900/80 text-slate-400';
  const rowHover = mode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-700/30';
  const cellText = mode === 'light' ? 'text-slate-700' : 'text-slate-300';

  return (
    <div className={`overflow-x-auto my-8 border ${borderColor} rounded-lg shadow-sm`}>
      <table className={`w-full text-sm text-left border-collapse ${cellText}`}>
        <thead className={`text-xs uppercase ${headerBg}`}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`px-6 py-4 font-bold tracking-wider border ${borderColor}`}>
                <InlineText text={h} mode={mode} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={mode === 'light' ? 'bg-white' : 'bg-slate-800/20'}>
          {dataRows.map((row, i) => (
            <tr key={i} className={`${rowHover} transition-colors`}>
              {row.map((cell, j) => (
                <td key={j} className={`px-6 py-4 whitespace-pre-wrap leading-relaxed border ${borderColor}`}>
                   <InlineText text={cell} mode={mode} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InlineText: React.FC<{ text: string; mode: 'dark' | 'light' }> = ({ text, mode }) => {
  if (!text) return null;
  
  const sanitizedText = text.replace(/\[\[\[.*?\]\]\]/g, '').trim();
  if (!sanitizedText) return null;

  const parts = sanitizedText.split(/(\*\*[\s\S]*?\*\*|__[ \s\S]*?__|\*[\s\S]*?\*|_[\s\S]*?_)/g);
  
  const boldClass = mode === 'light' ? 'text-slate-900 font-black' : 'text-white font-black';
  const italicClass = mode === 'light' ? 'text-slate-600 italic font-medium' : 'text-slate-100 italic font-medium';

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        const trimmed = part.trim();
        
        if ((trimmed.startsWith('**') && trimmed.endsWith('**')) || (trimmed.startsWith('__') && trimmed.endsWith('__'))) {
          const content = trimmed.slice(2, -2).trim();
          return <strong key={i} className={boldClass}>{content}</strong>;
        }
        
        if ((trimmed.startsWith('*') && trimmed.endsWith('*')) || (trimmed.startsWith('_') && trimmed.endsWith('_'))) {
          const content = trimmed.slice(1, -1).trim();
          return <em key={i} className={italicClass}>{content}</em>;
        }
        
        return part.replace(/\*\*|__|[*_]/g, '');
      })}
    </>
  );
};

const VerdictBadge: React.FC<{ verdict: string }> = ({ verdict }) => {
  const match = verdict.match(/\[\[\[(.*?)\]\]\]/);
  const v = (match ? match[1] : verdict).replace(/\[\[\[|\]\]\]|\*\*|__|[*_]/g, '').trim();
  
  if (!v) return null;

  let styles = 'bg-slate-700 text-white';
  let icon = <CheckCircle2 className="w-6 h-6" />;

  const normalized = v.toLowerCase();
  if (normalized.includes('strong buy')) {
    styles = 'bg-emerald-600 text-white shadow-lg border border-emerald-500';
    icon = <Rocket className="w-6 h-6" />;
  } else if (normalized.includes('buy')) {
    styles = 'bg-emerald-500 text-white border border-emerald-400';
    icon = <TrendingUp className="w-6 h-6" />;
  } else if (normalized.includes('hold') || normalized.includes('observing')) {
    styles = 'bg-sky-500 text-white border border-sky-400';
    icon = <CheckCircle2 className="w-6 h-6" />;
  } else if (normalized.includes('caution')) {
    styles = 'bg-amber-500 text-white border border-amber-400';
    icon = <AlertTriangle className="w-6 h-6" />;
  } else if (normalized.includes('strong sell')) {
    styles = 'bg-rose-600 text-white shadow-lg border border-rose-500';
    icon = <AlertOctagon className="w-6 h-6" />;
  } else if (normalized.includes('sell')) {
    styles = 'bg-rose-500 text-white border border-rose-400';
    icon = <TrendingDown className="w-6 h-6" />;
  }

  return (
    <div className="my-8 flex justify-center print:my-4">
      <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-xl font-black text-xl uppercase tracking-tighter shadow-md ${styles}`}>
        {icon}
        {v}
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, mode = 'dark' }) => {
  const lines = content.split('\n');
  const elements: { type: 'text' | 'table' | 'verdict' | 'header' | 'list' | 'numlist'; level?: number; content: string | string[] }[] = [];
  let tableBuffer: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
       if (tableBuffer.length > 0) {
          elements.push({ type: 'table', content: [...tableBuffer] });
          tableBuffer = [];
       }
       elements.push({ type: 'text', content: '' });
       return;
    }

    if (trimmed.startsWith('|')) {
      tableBuffer.push(line);
    } else {
      if (tableBuffer.length > 0) {
        elements.push({ type: 'table', content: [...tableBuffer] });
        tableBuffer = [];
      }
      
      const verdictMatch = trimmed.match(/\[\[\[(.*?)\]\]\]/);
      if (verdictMatch) {
         elements.push({ type: 'verdict', content: verdictMatch[0] });
      } 
      else if (trimmed.match(/^#+\s/)) {
          const levelMatch = trimmed.match(/^(#+)/);
          const level = levelMatch ? levelMatch[0].length : 1;
          elements.push({ type: 'header', level: Math.min(level, 3), content: trimmed.replace(/^#+\s*/, '') });
      }
      else if (trimmed.match(/^[-*]\s/)) {
          elements.push({ type: 'list', content: trimmed.replace(/^[-*]\s*/, '') });
      }
      else if (trimmed.match(/^\d+\.\s/)) {
          elements.push({ type: 'numlist', content: trimmed.replace(/^\d+\.\s*/, '') });
      }
      else {
         elements.push({ type: 'text', content: line });
      }
    }
  });
  
  if (tableBuffer.length > 0) {
    elements.push({ type: 'table', content: [...tableBuffer] });
  }

  const textColor = mode === 'light' ? 'text-slate-700' : 'text-slate-300';
  const headerColor = mode === 'light' ? 'text-slate-900' : 'text-white';
  const subHeaderColor = mode === 'light' ? 'text-sky-700' : 'text-sky-400';
  const listBulletColor = mode === 'light' ? 'text-emerald-600' : 'text-emerald-500';

  return (
    <div className={`space-y-3 leading-relaxed ${textColor}`}>
      {elements.map((el, index) => {
        if (el.type === 'table') {
          return <TableRenderer key={index} rows={el.content as string[]} mode={mode} />;
        }
        
        if (el.type === 'verdict') {
           return <VerdictBadge key={index} verdict={el.content as string} />;
        }

        if (el.type === 'header') {
            const content = el.content as string;
            if (el.level === 1) return <h1 key={index} className={`text-2xl font-black mb-4 mt-8 uppercase tracking-tight ${headerColor}`}><InlineText text={content} mode={mode} /></h1>;
            if (el.level === 2) return <h2 key={index} className={`text-xl font-bold mt-8 mb-4 border-b pb-2 ${mode === 'light' ? 'border-slate-200' : 'border-slate-700'} ${headerColor}`}><InlineText text={content} mode={mode} /></h2>;
            return <h3 key={index} className={`text-lg font-bold mt-6 mb-2 ${subHeaderColor}`}><InlineText text={content} mode={mode} /></h3>;
        }

        if (el.type === 'list') {
            return (
                <div key={index} className="flex items-start ml-4 my-1">
                  <span className={`${listBulletColor} mr-3 font-bold`}>•</span>
                  <span><InlineText text={el.content as string} mode={mode} /></span>
                </div>
            );
        }

        if (el.type === 'numlist') {
            return (
                <div key={index} className="flex items-start ml-4 my-1">
                  <span className={`${subHeaderColor} mr-3 font-bold`}>{index + 1}.</span>
                  <span><InlineText text={el.content as string} mode={mode} /></span>
                </div>
            );
        }

        if (el.content === '') return <div key={index} className="h-2"></div>;
        return <div key={index} className="mb-2"><InlineText text={el.content as string} mode={mode} /></div>;
      })}
    </div>
  );
};

export default MarkdownRenderer;