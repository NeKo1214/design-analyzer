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
 * 解析完整 Markdown 文本，拆分为 4 个 Tab 内容
 * 修复：贪婪匹配改为非贪婪，防止正则 ReDoS
 */
export const parseTabContent = (fullText: string): TabContents => {
  const tabs: TabContents = { overview: '', business: '', ux: '', ui: '' };
  if (!fullText) return tabs;

  // 剔除思考链标签及外层 markdown 代码块标记
  let cleaned = fullText.replace(/<Thought_Process>[\s\S]*?<\/Thought_Process>/gi, '').trim();
  cleaned = cleaned.replace(/^```markdown\s*/gi, '').replace(/^```\s*/gi, '').replace(/```\s*$/g, '').trim();

  // 标准分隔符模式
  if (cleaned.includes('===TAB_')) {
    const parts = cleaned.split('===TAB_');
    parts.forEach(part => {
      if (part.startsWith('OVERVIEW===')) tabs.overview = part.replace('OVERVIEW===', '').trim();
      else if (part.startsWith('BUSINESS===')) tabs.business = part.replace('BUSINESS===', '').trim();
      else if (part.startsWith('UX===')) tabs.ux = part.replace('UX===', '').trim();
      else if (part.startsWith('UI===')) tabs.ui = part.replace('UI===', '').trim();
    });
    return tabs;
  }

  // 降级：标题关键字匹配（非贪婪，防止 ReDoS）
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