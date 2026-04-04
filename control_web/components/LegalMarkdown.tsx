'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function LegalMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (p) => <h1 className="font-landing text-2xl font-bold text-white tracking-tight mt-10 mb-4 first:mt-0" {...p} />,
        h2: (p) => <h2 className="font-landing text-lg font-semibold text-white mt-8 mb-3" {...p} />,
        h3: (p) => <h3 className="text-base font-semibold text-neutral-200 mt-6 mb-2" {...p} />,
        p: (p) => <p className="text-neutral-400 leading-relaxed mb-4" {...p} />,
        ul: (p) => <ul className="list-disc pl-5 space-y-2 text-neutral-400 mb-4" {...p} />,
        ol: (p) => <ol className="list-decimal pl-5 space-y-2 text-neutral-400 mb-4" {...p} />,
        li: (p) => <li className="leading-relaxed" {...p} />,
        a: (p) => (
          <a className="text-neutral-200 underline underline-offset-2 hover:text-white" target="_blank" rel="noopener noreferrer" {...p} />
        ),
        strong: (p) => <strong className="font-semibold text-neutral-200" {...p} />,
        hr: () => <hr className="border-white/10 my-10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
