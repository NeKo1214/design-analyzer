// #11: 用组合代替继承，避免强行扩展 File 对象的类型不安全问题
export interface FileWithPreview {
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  desc: string;
  defaultUrl: string;
  keyLink: string;
}

export interface TabContents {
  overview: string;
  business: string;
  ux: string;
  ui: string;
}

export type TabKey = keyof TabContents;

export type AnalyzeMode = 'single' | 'multiple';

// 对标市场方向：cn=国内本土化，global=国际化，auto=AI自动识别
export type MarketMode = 'cn' | 'global' | 'auto';

export interface HistoryItem {
  id: string;
  title: string;
  markdown: string;
  images: string[];
  timestamp: number;
}

export interface AnalysisConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  customBaseUrl: string;
  customModelId: string;
}