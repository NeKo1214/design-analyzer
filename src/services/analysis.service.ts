import type { TabKey, TabContents, FileWithPreview } from '../types';
import { buildExpertPrompts } from '../constants/prompts.config';
import { fileToBase64 } from '../utils/file.utils';

interface RunAnalysisOptions {
  apiKey: string;
  finalBaseUrl: string;
  finalModel: string;
  base64Images: string[];
  isMulti: boolean;
  setTabContents: React.Dispatch<React.SetStateAction<TabContents>>;
}

const streamSSE = async (
  url: string,
  apiKey: string,
  body: object,
  onDelta: (text: string) => void
): Promise<string> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
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
  }
  return fullText;
};

export const runAnalysis = async (opts: RunAnalysisOptions): Promise<[string, string, string, string]> => {
  const { apiKey, finalBaseUrl, finalModel, base64Images, isMulti, setTabContents } = opts;
  const prompts = buildExpertPrompts(isMulti);
  const url = `${finalBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  const baseUserContent: object[] = [];
  base64Images.forEach((base64, index) => {
    if (isMulti) baseUserContent.push({ type: 'text', text: `这是 图${index + 1}:` });
    baseUserContent.push({ type: 'image_url', image_url: { url: base64 } });
  });

  const fetchExpert = async (key: TabKey): Promise<string> => {
    const userText = `请在输出报告前，先在内部推演核心痛点并确定要引用的专业定律。推演结束后，必须以 \`===TAB_${key.toUpperCase()}===\` 作为分界线，然后严格模仿极其专业、刻薄的文风输出正式的 Markdown 内容！`;
    const content = [{ type: 'text', text: userText }, ...baseUserContent];
    return streamSSE(url, apiKey, {
      model: finalModel,
      messages: [
        { role: 'system', content: prompts[key] },
        { role: 'user', content: content.filter(Boolean) },
      ],
      temperature: 0.7,
      stream: true,
    }, (text) => {
      setTabContents(prev => ({ ...prev, [key]: text }));
    });
  };

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
  setTabContents: React.Dispatch<React.SetStateAction<TabContents>>;
}

const TAB_NAME_MAP: Record<TabKey, string> = {
  overview: '综合总览', business: '产品层面', ux: '交互层面', ui: '设计层面',
};

export const runRewrite = async (opts: RunRewriteOptions): Promise<string> => {
  const { apiKey, finalBaseUrl, finalModel, activeTab, currentContent, rewriteInput, displayFiles, setTabContents } = opts;
  const url = `${finalBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  const prompt = `你现在是一位专注在【${TAB_NAME_MAP[activeTab]}】领域的资深设计专家。
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