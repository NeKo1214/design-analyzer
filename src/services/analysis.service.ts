import type { TabKey, TabContents, FileWithPreview, MarketMode } from '../types';
import { buildExpertPrompts } from '../constants/prompts.config';
import { fileToBase64 } from '../utils/file.utils';

interface RunAnalysisOptions {
  apiKey: string;
  finalBaseUrl: string;
  finalModel: string;
  base64Images: string[];
  isMulti: boolean;
  marketMode: MarketMode;
  setTabContents: React.Dispatch<React.SetStateAction<TabContents>>;
  signal?: AbortSignal;
}

const streamSSE = async (
  url: string,
  apiKey: string,
  body: object,
  onDelta: (text: string) => void,
  signal?: AbortSignal // #1
): Promise<string> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
    body: JSON.stringify(body),
    signal, // #1: 传入 signal
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  if (reader) {
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // #1: 检测中止信号
        if (signal?.aborted) {
          reader.cancel();
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                onDelta(fullText);
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  return fullText;
};

// #6: 单 Tab 最多重试 1 次
const fetchWithRetry = async (
  fn: () => Promise<string>,
  maxRetries = 1
): Promise<string> => {
  let lastError: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      // #1: 若是主动中止，不重试直接抛出
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      lastError = err;
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // 指数退避
      }
    }
  }
  throw lastError;
};

export const runAnalysis = async (opts: RunAnalysisOptions): Promise<[string, string, string, string]> => {
  const { apiKey, finalBaseUrl, finalModel, base64Images, isMulti, marketMode, setTabContents, signal } = opts;
  const prompts = buildExpertPrompts(isMulti, marketMode);
  const url = `${finalBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  const baseUserContent: object[] = [];
  base64Images.forEach((base64, index) => {
    if (isMulti) baseUserContent.push({ type: 'text', text: `这是 图${index + 1}:` });
    baseUserContent.push({ type: 'image_url', image_url: { url: base64 } });
  });

  const fetchExpert = (key: TabKey): Promise<string> =>
    fetchWithRetry(() => { // #6: 包裹重试
      const userText = `【第一步：页面类型识别（内部推演，不输出）】\n请先在内部判断该页面属于哪种类型：电商/工具产品/内容资讯/金融数据/社交/SaaS/引导落地页/空状态页/其他。\n基于识别到的页面类型，自动切换对应行业的最高标准来展开后续分析（例如：电商对标 Amazon/淘宝，SaaS 对标 Notion/Linear，金融对标 Bloomberg/Robinhood）。\n\n【第二步：核心痛点推演（内部推演，不输出）】\n确定最严重的 3 个问题，以及要引用的专业理论依据。\n\n【第三步：输出报告】\n必须以 \`===TAB_${key.toUpperCase()}===\` 作为输出的第一行，然后严格按照 system prompt 中的 Markdown 骨架填充内容，语言极其专业、犀利、一针见血！`;
      const content = [{ type: 'text', text: userText }, ...baseUserContent];
      return streamSSE(url, apiKey, {
        model: finalModel,
        messages: [
          { role: 'system', content: prompts[key] },
          { role: 'user', content },
        ],
        temperature: 0.3,
        stream: true,
      }, (text) => {
        setTabContents(prev => ({ ...prev, [key]: text }));
      }, signal); // #1
    });

  const results = await Promise.all([
    fetchExpert('overview'),
    new Promise<void>(r => setTimeout(r, 200)).then(() => fetchExpert('business')),
    new Promise<void>(r => setTimeout(r, 400)).then(() => fetchExpert('ux')),
    new Promise<void>(r => setTimeout(r, 600)).then(() => fetchExpert('ui')),
  ]);

  return results as [string, string, string, string];
};

interface RunRewriteOptions {
  apiKey: string;
  finalBaseUrl: string;
  finalModel: string;
  activeTab: TabKey;
  currentContent: string;
  rewriteInput: string;
  displayFiles: FileWithPreview[];
  isMulti: boolean; // #3: 传入多图模式标志
  setTabContents: React.Dispatch<React.SetStateAction<TabContents>>;
}

const TAB_NAME_MAP: Record<TabKey, string> = {
  overview: '综合总览', business: '产品层面', ux: '交互层面', ui: '设计层面',
};

export const runRewrite = async (opts: RunRewriteOptions): Promise<string> => {
  const { apiKey, finalBaseUrl, finalModel, activeTab, currentContent, rewriteInput, displayFiles, isMulti, setTabContents } = opts;
  const url = `${finalBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  // #3: 多图模式附加铁律约束
  const multiRule = isMulti
    ? '\n\n【多图分析铁律】每一项分析必须明确标注「图1」或「图2」，禁止模糊叙述，禁止混图描述！输出格式与原始报告保持一致。'
    : '';

  const prompt = `你现在是一位专注在【${TAB_NAME_MAP[activeTab]}】领域的资深设计专家。${multiRule}
我刚刚对页面进行了一次完整的分析，你在该维度给我的原始分析内容是：
"""
${currentContent}
"""

现在用户对这段内容提出了一个新的追问/修改要求：
【${rewriteInput}】

请严格遵循用户的要求，**重新写一份只针对这个维度**的分析报告，彻底替换掉原来的内容。
要求：
1. 语言依然要【一针见血】、【毒舌且专业】。
2. 绝对不允许输出任何你不需要重新回答的其他维度。
3. 必须直接开始输出新的 Markdown 正文，不允许有任何废话。`;

  const content: object[] = [{ type: 'text', text: prompt }];
  for (const f of displayFiles) {
    try {
      const base64 = await fileToBase64(f);
      content.push({ type: 'image_url', image_url: { url: base64 } });
    } catch { /* 容错 */ }
  }

  return streamSSE(url, apiKey, {
    model: finalModel,
    messages: [{ role: 'user', content }],
    temperature: 0.7,
    stream: true,
  }, (text) => {
    setTabContents(prev => ({ ...prev, [activeTab]: text }));
  });
};