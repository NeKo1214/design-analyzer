export interface FileWithPreview extends File {
  preview: string;
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