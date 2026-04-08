import { useState, useCallback } from 'react';
import type { TabContents, TabKey, FileWithPreview, AnalyzeMode } from '../types';
import { fileToBase64 } from '../utils/file.utils';
import { runAnalysis, runRewrite } from '../services/analysis.service';

interface UseAnalysisOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  customBaseUrl: string;
  customModelId: string;
  onSaveHistory: (title: string, markdown: string) => void;
}

export const useAnalysis = (options: UseAnalysisOptions) => {
  const [tabContents, setTabContents] = useState<TabContents>({ overview: '', business: '', ux: '', ui: '' });
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [rewriteInput, setRewriteInput] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  const { apiKey, baseUrl, model, customBaseUrl, customModelId, onSaveHistory } = options;

  const handleAnalyze = useCallback(async (displayFiles: FileWithPreview[], analyzeMode: AnalyzeMode) => {
    if (!apiKey) { alert('请先点击右上角设置您的 API Key'); return; }
    if (displayFiles.length === 0) { alert('请至少上传一张图片'); return; }

    setIsAnalyzing(true);
    setTabContents({ overview: '', business: '', ux: '', ui: '' });
    setActiveTab('overview');

    try {
      const finalBaseUrl = customBaseUrl.trim() || baseUrl;
      const finalModel = customModelId.trim() || model;

      const base64Images: string[] = [];
      for (const f of displayFiles) {
        base64Images.push(await fileToBase64(f));
      }

      const isMulti = analyzeMode === 'multiple' && displayFiles.length > 1;
      const results = await runAnalysis({ apiKey, finalBaseUrl, finalModel, base64Images, isMulti, setTabContents });

      const finalMarkdown = `===TAB_OVERVIEW===\n${results[0]}\n\n===TAB_BUSINESS===\n${results[1]}\n\n===TAB_UX===\n${results[2]}\n\n===TAB_UI===\n${results[3]}\n\n`;
      onSaveHistory(`多维专家分析 - ${new Date().toLocaleString('zh-CN')}`, finalMarkdown);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '未知网络错误';
      setTabContents(prev => ({ ...prev, overview: `❌ 分析失败：\n${msg}\n\n🔍 **排查建议**：\n1. 检查 API Key 是否正确\n2. 检查网络连接` }));
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiKey, baseUrl, model, customBaseUrl, customModelId, onSaveHistory]);

  const handleRewrite = useCallback(async (displayFiles: FileWithPreview[]) => {
    if (!rewriteInput.trim() || !apiKey) return;
    setIsRewriting(true);
    try {
      const finalBaseUrl = customBaseUrl.trim() || baseUrl;
      const finalModel = customModelId.trim() || model;
      const newContent = await runRewrite({ apiKey, finalBaseUrl, finalModel, activeTab, currentContent: tabContents[activeTab], rewriteInput, displayFiles, setTabContents });
      const newTabs = { ...tabContents, [activeTab]: newContent };
      const fullText = `===TAB_OVERVIEW===\n${newTabs.overview}\n\n===TAB_BUSINESS===\n${newTabs.business}\n\n===TAB_UX===\n${newTabs.ux}\n\n===TAB_UI===\n${newTabs.ui}`;
      onSaveHistory(`修改后分析 - ${new Date().toLocaleString('zh-CN')}`, fullText);
      setRewriteInput('');
    } catch (err) {
      alert('重新分析失败，请检查网络或 API Key');
    } finally {
      setIsRewriting(false);
    }
  }, [apiKey, baseUrl, model, customBaseUrl, customModelId, activeTab, tabContents, rewriteInput, onSaveHistory]);

  const handleCopy = useCallback(async () => {
    const text = `===TAB_OVERVIEW===\n\n${tabContents.overview}\n\n===TAB_BUSINESS===\n\n${tabContents.business}\n\n===TAB_UX===\n\n${tabContents.ux}\n\n===TAB_UI===\n\n${tabContents.ui}`;
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [tabContents]);

  return {
    tabContents, setTabContents,
    activeTab, setActiveTab,
    isAnalyzing,
    isCopied,
    rewriteInput, setRewriteInput,
    isRewriting,
    handleAnalyze, handleRewrite, handleCopy,
  };
};