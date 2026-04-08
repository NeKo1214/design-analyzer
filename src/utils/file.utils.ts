import type { TabContents } from '../types';

const MAX_SIZE = 1200;

/**
 * 将 File 对象转为 base64 JPEG 字符串（修复内存泄漏：URL 会被及时释放）
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // 立即释放，防止内存泄漏

      let width = img.width;
      let height = img.height;

      if (width > height && width > MAX_SIZE) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 Canvas Context'));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片解码失败，请检查文件格式是否受支持'));
    };

    img.src = objectUrl;
  });
};

/**
 * 对单个 Tab 的内容做标题清洗（与 MarkdownComponents.fixMarkdownHeadings 保持一致）
 */
export const cleanTabContent = (text: string): string => {
  let result = text;
  result = result.replace(/\r\n/g, '\n');
  // 清洗孤立 # 行（只有 # 和空白，无实质标题内容）
  result = result.replace(/^#{1,6}\s*$/gm, '');
  // 清洗独立 --- 分隔线，保留含 | 的表格行
  result = result.replace(/^(?!\s*\|)-{3,}\s*$/gm, '');
  // 清洗孤立 === 符号
  result = result.replace(/(?<![a-zA-Z0-9])===(?![a-zA-Z0-9])/g, '');
  // 确保标题行前有空行：先处理"非换行 + 换行 + 标题"
  result = result.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
  // 再确保所有"换行 + 标题"都变成"两个换行 + 标题"
  result = result.replace(/\n(#{1,6} )/g, '\n\n$1');
  // 压缩超过两个连续空行
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
};

/**
 * 解析完整 Markdown 文本，拆分为 4 个 Tab 内容
 */
export const parseTabContent = (fullText: string): TabContents => {
  const tabs: TabContents = { overview: '', business: '', ux: '', ui: '' };
  if (!fullText) return tabs;

  // 剔除思考链标签及外层 markdown 代码块标记
  let text = fullText.replace(/<Thought_Process>[\s\S]*?<\/Thought_Process>/gi, '').trim();
  text = text.replace(/^```markdown\s*/gi, '').replace(/^```\s*/gi, '').replace(/```\s*$/g, '').trim();

  // 【关键修复】先用原始文本做分隔符拆分（在清洗前），避免清洗误删分隔符
  if (text.includes('===TAB_')) {
    const parts = text.split(/===TAB_([A-Z_]+)===/);
    // split 结果: [before, key1, content1, key2, content2, ...]
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i];
      const content = (parts[i + 1] || '').trim();
      if (key === 'OVERVIEW') tabs.overview = cleanTabContent(content);
      else if (key === 'BUSINESS') tabs.business = cleanTabContent(content);
      else if (key === 'UX') tabs.ux = cleanTabContent(content);
      else if (key === 'UI') tabs.ui = cleanTabContent(content);
    }
    return tabs;
  }

  // 降级：先整体清洗，再按关键词拆分
  let cleaned = text.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/^#{1,6}\s*$/gm, '');
  cleaned = cleaned.replace(/^(?!\s*\|)-{3,}\s*$/gm, '');
  cleaned = cleaned.replace(/(?<![a-zA-Z0-9])===(?![a-zA-Z0-9])/g, '');
  cleaned = cleaned.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
  cleaned = cleaned.replace(/\n(#{1,6} )/g, '\n\n$1');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  const overviewRegex = /(?:#+\s*(?:🌟\s*)?综合总览|第[一1]部分[:：]?\s*综合总览|【综合总览】)/i;
  const businessRegex = /(?:#+\s*(?:📦\s*)?产品功能|第[二2]部分[:：]?\s*产品功能|【产品功能】)/i;
  const uxRegex = /(?:#+\s*(?:👆\s*)?交互体验|第[三3]部分[:：]?\s*交互体验|【交互体验】)/i;
  const uiRegex = /(?:#+\s*(?:🎨\s*)?设计样式|第[四4]部分[:：]?\s*设计样式|【设计样式】)/i;

  const matchOverview = cleaned.match(overviewRegex);
  const matchBusiness = cleaned.match(businessRegex);
  const matchUx = cleaned.match(uxRegex);
  const matchUi = cleaned.match(uiRegex);

  if (!matchOverview && !matchBusiness && !matchUx && !matchUi) {
    tabs.overview = cleaned;
    return tabs;
  }

  const indices = [
    { name: 'overview' as const, index: matchOverview?.index ?? -1 },
    { name: 'business' as const, index: matchBusiness?.index ?? -1 },
    { name: 'ux' as const, index: matchUx?.index ?? -1 },
    { name: 'ui' as const, index: matchUi?.index ?? -1 },
  ].filter(item => item.index !== -1).sort((a, b) => a.index - b.index);

  for (let i = 0; i < indices.length; i++) {
    const current = indices[i];
    const next = indices[i + 1] ?? null;
    const content = cleaned.substring(current.index, next ? next.index : cleaned.length).trim();
    tabs[current.name] = content.replace(/^(?:#+\s*.+|第.部分.+|【.+】)\s*/, '');
  }

  return tabs;
};