import { useState, useEffect } from 'react';
import { Copy, Download, Check, Printer, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownErrorBoundary } from './ErrorBoundary';
import { markdownComponents, fixMarkdownHeadings } from './MarkdownComponents';
import { useDebounce } from '../hooks/useDebounce';
import type { TabContents, TabKey, FileWithPreview } from '../types';

interface ResultsPanelProps {
  tabContents: TabContents;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isAnalyzing: boolean;
  isCopied: boolean;
  rewriteInput: string;
  setRewriteInput: (v: string) => void;
  isRewriting: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onRewrite: () => void;
  displayFiles: FileWithPreview[];
  onLightbox: (src: string) => void;
}

const TAB_LABELS: Record<TabKey, string> = {
  overview: '综合总览', business: '产品功能', ux: '交互体验', ui: '设计样式',
};

export const ResultsPanel = (props: ResultsPanelProps) => {
  const { tabContents, activeTab, setActiveTab, isAnalyzing, isCopied, rewriteInput, setRewriteInput, isRewriting, onCopy, onDownload, onRewrite, displayFiles, onLightbox } = props;
  const hasResult = !!(tabContents.overview || tabContents.business || tabContents.ux || tabContents.ui);
  const hasError = tabContents.overview.includes('❌ 分析失败');

  // 对当前 tab 内容做 150ms 防抖，减少流式输出时 ReactMarkdown 高频重渲染导致的 removeChild 报错
  const debouncedContent = useDebounce(tabContents[activeTab], 150);

  // 右侧图库当前展示的图片索引
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 图片数量变化时重置索引（避免越界）
  useEffect(() => {
    setActiveImageIndex(0);
  }, [displayFiles.length]);

  // 键盘左右方向键切换图片
  useEffect(() => {
    if (displayFiles.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setActiveImageIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setActiveImageIndex(i => Math.min(displayFiles.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [displayFiles.length]);

  return (
    <div className="flex-1 w-full flex flex-col xl:flex-row gap-6 lg:gap-10 items-start min-w-0">
      {/* 中侧：沉浸阅读区 */}
      <div className="flex-1 w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 min-h-[600px] flex flex-col p-8 lg:p-12 min-w-0">
        <div className="flex items-center justify-between mb-10 border-b border-zinc-100 pb-6">
          <h2 className="text-2xl font-bold tracking-tight">分析报告</h2>
          {(!isAnalyzing && hasResult && !hasError) && (
            <div className="flex items-center gap-3">
              <button onClick={onCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition-colors">
                {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {isCopied ? '已复制' : '复制内容'}
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors shadow-sm">
                <Printer className="w-4 h-4" />生成 PDF
              </button>
              <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-sm">
                <Download className="w-4 h-4" />导出 MD
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-[820px] flex flex-col flex-1">
            {(!hasResult && !isAnalyzing) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-20">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                  <ImageIcon className="w-8 h-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-medium text-zinc-600 mb-2">等待分析</h3>
                <p className="text-sm">上传图片后，AI 将在这里输出专业的洞察</p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-800 py-20 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-zinc-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-zinc-900 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">正在进行多维度专家级拆解</p>
                  <p className="text-sm text-zinc-400 mt-1 animate-pulse">产品功能 / 交互体验 / 设计样式 并发解析中...</p>
                </div>
              </div>
            ) : (
              <div className="w-full text-zinc-800 animate-in fade-in duration-500">
                {hasError ? (
                  <div className="whitespace-pre-wrap text-red-500 bg-red-50 p-6 rounded-2xl border border-red-100">{tabContents.overview}</div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {hasResult && (
                      <div className="flex bg-zinc-100/80 p-1.5 rounded-2xl shadow-inner overflow-x-auto custom-scrollbar shrink-0">
                        {(Object.keys(TAB_LABELS) as TabKey[]).map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            {TAB_LABELS[tab]}
                          </button>
                        ))}
                      </div>
                    )}

                    <div key={activeTab} className="w-full bg-white rounded-3xl border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300">
                      <div className="px-8 py-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-zinc-900"></div>
                          <span className="text-sm font-bold text-zinc-800 tracking-wide uppercase">
                            {activeTab === 'overview' ? 'OVERVIEW' : activeTab === 'business' ? 'BUSINESS' : activeTab === 'ux' ? 'UX' : 'UI'} REPORT
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 font-medium font-mono">AI EXPERT ANALYSIS</div>
                      </div>
                      <div className="p-8 md:p-12 w-full break-words max-w-full">
                        <MarkdownErrorBoundary>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
                            {fixMarkdownHeadings(debouncedContent)}
                          </ReactMarkdown>
                        </MarkdownErrorBoundary>
                      </div>
                    </div>

                    {tabContents[activeTab] && (
                      <div className="mt-8 pt-6 border-t border-zinc-100 animate-in fade-in duration-500 delay-300">
                        <label className="block text-xs font-semibold text-zinc-500 mb-2">
                          对当前【{TAB_LABELS[activeTab]}】的分析结果有其他要求？
                        </label>
                        <div className="relative flex items-end gap-3">
                          <textarea value={rewriteInput} onChange={e => setRewriteInput(e.target.value)}
                            placeholder="例如：帮我详细展开一下颜色搭配的建议..."
                            disabled={isRewriting}
                            className="w-full resize-none min-h-[44px] max-h-[120px] px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all disabled:opacity-50"
                            rows={1}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onRewrite(); } }} />
                          <button onClick={onRewrite} disabled={!rewriteInput.trim() || isRewriting}
                            className="shrink-0 h-[44px] px-4 bg-zinc-900 text-white rounded-xl text-sm font-medium transition-all hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center min-w-[80px]">
                            {isRewriting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : '重新生成'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：图库停靠栏 */}
      {(!isAnalyzing && hasResult && !hasError && displayFiles.length > 0) && (
        <div className="w-full xl:w-[320px] 2xl:w-[380px] shrink-0 flex flex-col gap-4 xl:sticky xl:top-[90px] xl:max-h-[calc(100vh-120px)] pb-10">
          {/* 标题 */}
          <div className="text-sm font-semibold text-zinc-800 pb-3 border-b border-zinc-200/60 flex items-center justify-between pt-2">
            <span>对照参考图库</span>
            {displayFiles.length > 1 && (
              <span className="text-xs font-normal text-zinc-400">{activeImageIndex + 1} / {displayFiles.length}</span>
            )}
          </div>

          {/* Tab 切换栏（仅 2 张图时显示） */}
          {displayFiles.length === 2 && (
            <div className="flex bg-zinc-100/80 p-1 rounded-xl shadow-inner gap-1">
              {displayFiles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    activeImageIndex === index
                      ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  图 {index + 1}
                </button>
              ))}
            </div>
          )}

          {/* 主图展示区 */}
          <div className="relative group rounded-2xl overflow-hidden border border-[#eeeeee] bg-white p-2 shadow-sm">
            <img
              key={activeImageIndex}
              src={displayFiles[activeImageIndex]?.preview}
              alt={`图 ${activeImageIndex + 1}`}
              onClick={() => onLightbox(displayFiles[activeImageIndex]?.preview)}
              className="w-full object-contain rounded-xl cursor-zoom-in transition-opacity duration-300 animate-in fade-in"
            />
            {/* 放大提示 */}
            <div className="absolute inset-2 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                🔍 点击放大
              </div>
            </div>
            {/* 左右切换箭头（多图时显示） */}
            {displayFiles.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setActiveImageIndex(i => Math.max(0, i - 1)); }}
                  disabled={activeImageIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center text-zinc-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setActiveImageIndex(i => Math.min(displayFiles.length - 1, i + 1)); }}
                  disabled={activeImageIndex === displayFiles.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center text-zinc-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* 底部缩略图区域 */}
          {displayFiles.length === 2 && (
            /* 2 张：横向滚动条 */
            <div className="flex gap-2 overflow-x-auto p-1 custom-scrollbar">
              {displayFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    activeImageIndex === index
                      ? 'border-zinc-900 shadow-md scale-105'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={file.preview} alt={`缩略图 ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {displayFiles.length >= 3 && (
            /* 3 张及以上：网格布局，超出可横向滚动 */
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-zinc-400 font-medium">点击缩略图切换查看</p>
              <div className="grid grid-cols-4 gap-2 custom-scrollbar pb-1 p-1 overflow-visible">
                {displayFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      activeImageIndex === index
                        ? 'border-zinc-900 shadow-md scale-105'
                        : 'border-[#eeeeee] opacity-60 hover:opacity-90 hover:border-zinc-300'
                    }`}
                  >
                    <img src={file.preview} alt={`缩略图 ${index + 1}`} className="w-full h-full object-cover" />
                    {/* 序号角标 */}
                    <div className={`absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none transition-colors ${
                      activeImageIndex === index ? 'bg-zinc-900 text-white' : 'bg-black/40 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};