import type { ReactNode } from 'react';

/**
 * 修复流式内容中 ### 前无换行导致渲染为纯文本的问题
 */
export const fixMarkdownHeadings = (text: string): string =>
  text.replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2');

// 极简主义阅读模式（类 Notion / 苹果风），标题加左侧色条装饰
export const markdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="text-2xl font-bold text-zinc-900 mt-8 mb-4 tracking-tight pl-4 border-l-4 border-zinc-900">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="text-xl font-semibold text-zinc-900 mt-7 mb-4 tracking-tight pl-3 border-l-[3px] border-zinc-400">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="text-[17px] font-semibold text-zinc-800 mt-6 mb-3 tracking-tight pl-3 border-l-2 border-zinc-300">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: ReactNode }) =>
    <h4 className="text-base font-medium text-zinc-800 mt-5 mb-2 tracking-tight">{children}</h4>,
  h5: ({ children }: { children?: ReactNode }) =>
    <h5 className="text-sm font-medium text-zinc-500 mt-4 mb-2 tracking-tight uppercase">{children}</h5>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) =>
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{children}</a>,
  p: ({ children }: { children?: ReactNode }) =>
    <p className="text-zinc-600 leading-[1.8] mb-4 text-[15px] font-normal">{children}</p>,
  ul: ({ children }: { children?: ReactNode }) =>
    <ul className="space-y-2 mb-4 ml-5 text-zinc-600 font-normal">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) =>
    <ol className="space-y-2 mb-4 list-decimal list-outside ml-5 text-zinc-600 font-normal">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) =>
    <li className="text-zinc-600 text-[15px] leading-[1.8] mb-1">{children}</li>,
  strong: ({ children }: { children?: ReactNode }) =>
    <strong className="font-semibold text-zinc-900">{children}</strong>,
  blockquote: ({ children }: { children?: ReactNode }) =>
    <blockquote className="pl-4 py-2 my-4 border-l-2 border-zinc-200 text-zinc-500 text-[15px] leading-relaxed italic bg-transparent">{children}</blockquote>,
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto my-6 border border-zinc-100 rounded-xl">
      <table className="w-full text-[14px] text-left border-collapse m-0">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) =>
    <thead className="bg-zinc-50/50 border-b border-zinc-100 text-zinc-500">{children}</thead>,
  tbody: ({ children }: { children?: ReactNode }) =>
    <tbody className="divide-y divide-zinc-50">{children}</tbody>,
  th: ({ children }: { children?: ReactNode }) =>
    <th className="px-4 py-3 font-medium whitespace-nowrap">{children}</th>,
  td: ({ children }: { children?: ReactNode }) =>
    <td className="px-4 py-3 text-zinc-600 align-top leading-relaxed break-words">{children}</td>,
  pre: ({ children }: { children?: ReactNode }) =>
    <pre className="overflow-x-auto bg-zinc-50 border border-zinc-100 text-zinc-700 p-4 rounded-2xl text-[14px] leading-[1.8] my-4 custom-scrollbar break-words whitespace-pre-wrap font-sans">{children}</pre>,
  code: ({ inline, children }: { inline?: boolean; children?: ReactNode }) => {
    if (inline) {
      return <code className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 rounded-md text-[13.5px] font-mono break-all">{children}</code>;
    }
    return <code className="font-sans text-[14px] break-words whitespace-pre-wrap text-zinc-700">{children}</code>;
  },
};