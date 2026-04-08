import { useState, useEffect } from 'react';
import { Settings, BarChart2, Clock, X } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useIndexedDB } from './hooks/useIndexedDB';
import { useAnalysis } from './hooks/useAnalysis';
import { SettingsPanel } from './components/SettingsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { FileUpload } from './components/FileUpload';
import { ResultsPanel } from './components/ResultsPanel';
import { parseTabContent, fileToBase64 } from './utils/file.utils';
import type { FileWithPreview, AnalyzeMode, HistoryItem } from './types';

function App() {
  const storage = useLocalStorage();
  const { history, addHistory, deleteHistory, clearAllHistory } = useIndexedDB();

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [analyzeMode, setAnalyzeMode] = useState<AnalyzeMode>('single');
  const [allFiles, setAllFiles] = useState<FileWithPreview[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const displayFiles = analyzeMode === 'single' && allFiles.length > 0 ? [allFiles[0]] : allFiles;

  // ESC 关闭 Lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxImage(null); };
    if (lightboxImage) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxImage]);

  const saveHistory = async (title: string, markdown: string) => {
    const base64Images: string[] = [];
    for (const f of allFiles) {
      try { base64Images.push(await fileToBase64(f)); } catch { /* skip */ }
    }
    await addHistory({ id: Date.now().toString(), title, markdown, images: base64Images, timestamp: Date.now() });
  };

  const analysis = useAnalysis({
    apiKey: storage.apiKey,
    baseUrl: storage.baseUrl,
    model: storage.model,
    customBaseUrl: storage.customBaseUrl,
    customModelId: storage.customModelId,
    onSaveHistory: saveHistory,
  });

  const loadHistoryItem = (item: HistoryItem) => {
    analysis.setTabContents(parseTabContent(item.markdown));
    analysis.setActiveTab('overview');
    if (item.images && item.images.length > 0) {
      const files = item.images.map((img, i) => {
        const f = new File([], `history-image-${i}.png`, { type: 'image/png' });
        (f as FileWithPreview).preview = img;
        return f as FileWithPreview;
      });
      setAllFiles(files);
    }
    setShowHistory(false);
  };

  const handleDownload = () => {
    const { tabContents } = analysis;
    const text = [
      '# 🌟 综合总览\n', tabContents.overview,
      '# 📦 产品功能\n', tabContents.business,
      '# 👆 交互体验\n', tabContents.ux,
      '# 🎨 设计样式\n', tabContents.ui,
    ].filter(Boolean).join('\n\n');
    if (!text.trim()) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `竞品设计分析报告_${Date.now()}.md`;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] font-sans selection:bg-zinc-200">
      {/* 顶部导航 */}
      <header className="bg-white/70 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="w-full px-6 lg:px-10 py-4 flex justify-between items-center max-w-[2000px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Design Analyzer</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${showHistory ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
              <Clock className="w-4 h-4" />查看历史
              {history.length > 0 && <span className="text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">{history.length}</span>}
            </button>
            <button onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${showSettings ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
              <Settings className="w-4 h-4" />配置 API
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[2000px] mx-auto px-6 lg:px-10 py-8 lg:py-10 flex flex-col gap-8">
        {/* 设置面板 */}
        {showSettings && (
          <SettingsPanel {...storage} onClose={() => setShowSettings(false)} />
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start w-full">
          {/* 左侧工作台 */}
          <div className="w-full lg:w-[300px] xl:w-[340px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-[90px] z-10 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar pb-6 px-3 -mx-3">
            {/* 分析模式切换 */}
            <div className="bg-zinc-100/80 p-1 rounded-2xl flex items-center shadow-inner shrink-0">
              {(['single', 'multiple'] as AnalyzeMode[]).map(mode => (
                <button key={mode} onClick={() => setAnalyzeMode(mode)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${analyzeMode === mode ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  {mode === 'single' ? '单图深度分析' : '多图竞品对比'}
                </button>
              ))}
            </div>

            <FileUpload analyzeMode={analyzeMode} allFiles={allFiles} setAllFiles={setAllFiles} onLightbox={setLightboxImage} />

            {/* 分析按钮 */}
            <button onClick={() => analysis.handleAnalyze(displayFiles, analyzeMode)}
              disabled={allFiles.length === 0 || analysis.isAnalyzing}
              className="bg-zinc-900 text-white rounded-full font-medium tracking-wide transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed w-full py-4 text-base shadow-lg shadow-zinc-900/20 flex justify-center items-center gap-3 shrink-0">
              {analysis.isAnalyzing ? (
                <><span className="inline-block w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></span><span>分析中...</span></>
              ) : (
                <><BarChart2 className="w-5 h-5" /><span>生成{allFiles.length > 1 ? '对比分析' : '分析'}报告</span></>
              )}
            </button>
          </div>

          {/* 右侧结果区 */}
          <ResultsPanel
            tabContents={analysis.tabContents}
            activeTab={analysis.activeTab}
            setActiveTab={analysis.setActiveTab}
            isAnalyzing={analysis.isAnalyzing}
            isCopied={analysis.isCopied}
            rewriteInput={analysis.rewriteInput}
            setRewriteInput={analysis.setRewriteInput}
            isRewriting={analysis.isRewriting}
            onCopy={analysis.handleCopy}
            onDownload={handleDownload}
            onRewrite={() => analysis.handleRewrite(displayFiles)}
            displayFiles={displayFiles}
            onLightbox={setLightboxImage}
          />
        </div>
      </main>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors" onClick={e => { e.stopPropagation(); setLightboxImage(null); }}>
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxImage} alt="Enlarged design" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* 历史记录面板 */}
      {showHistory && (
        <HistoryPanel history={history} onLoad={loadHistoryItem} onDelete={deleteHistory} onClearAll={clearAllHistory} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}

export default App;