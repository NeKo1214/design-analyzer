import { useState, useCallback, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Settings, Upload, X, Image as ImageIcon, BarChart2, Copy, Download, Check, Printer, Clock } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 彻底解决 Markdown 渲染导致整个 React 应用白屏崩溃的终极方案：错误边界
class MarkdownErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, errorMsg: string}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Markdown Render Crash Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <strong>⚠️ 渲染分析报告时发生异常：</strong>
          <br/>
          请尝试重新分析，或检查返回的内容格式。
          <p className="mt-2 text-xs text-red-400 font-mono">{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// 极简主义阅读模式（类 Notion / 苹果风），去除繁杂的色块与边框，专注于排版与内容呼吸感
const markdownComponents = {
  h1: function CustomH1({ children }: any) {
    return <h1 className="text-2xl font-bold text-zinc-900 mt-8 mb-4 tracking-tight">{children}</h1>;
  },
  h3: function CustomH3({ children }: any) {
    return <h3 className="text-[17px] font-semibold text-zinc-900 mt-6 mb-3 tracking-tight">{children}</h3>;
  },
  h2: function CustomH2({ children }: any) {
    return <h2 className="text-xl font-semibold text-zinc-900 mt-7 mb-4 tracking-tight">{children}</h2>;
  },
  h4: function CustomH4({ children }: any) {
    return <h4 className="text-base font-medium text-zinc-800 mt-5 mb-2 tracking-tight">{children}</h4>;
  },
  h5: function CustomH5({ children }: any) {
    return <h5 className="text-sm font-medium text-zinc-700 mt-4 mb-2 tracking-tight uppercase">{children}</h5>;
  },
  a: function CustomA({ children, href }: any) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{children}</a>;
  },
  p: function CustomP({ children }: any) {
    return <p className="text-zinc-600 leading-[1.8] mb-4 text-[15px] font-normal">{children}</p>;
  },
  ul: function CustomUl({ children }: any) {
    return <ul className="space-y-2 mb-4 ml-5 text-zinc-600 font-normal">{children}</ul>;
  },
  ol: function CustomOl({ children }: any) {
    return <ol className="space-y-2 mb-4 list-decimal list-outside ml-5 text-zinc-600 font-normal">{children}</ol>;
  },
  li: function CustomLi({ children }: any) {
    return <li className="text-zinc-600 text-[15px] leading-[1.8] mb-1">{children}</li>;
  },
  strong: function CustomStrong({ children }: any) {
    return (
      <strong className="font-semibold text-zinc-900">
        {children}
      </strong>
    );
  },
  blockquote: function CustomQuote({ children }: any) {
    return (
      <blockquote className="pl-4 py-2 my-4 border-l-2 border-zinc-200 text-zinc-500 text-[15px] leading-relaxed italic bg-transparent">
        {children}
      </blockquote>
    );
  },
  table: function CustomTable({ children }: any) {
    return (
      <div className="overflow-x-auto my-6 border border-zinc-100 rounded-xl">
        <table className="w-full text-[14px] text-left border-collapse m-0">
          {children}
        </table>
      </div>
    );
  },
  thead: function CustomThead({ children }: any) {
    return <thead className="bg-zinc-50/50 border-b border-zinc-100 text-zinc-500">{children}</thead>;
  },
  tbody: function CustomTbody({ children }: any) {
    return <tbody className="divide-y divide-zinc-50">{children}</tbody>;
  },
  th: function CustomTh({ children }: any) {
    return <th className="px-4 py-3 font-medium whitespace-nowrap">{children}</th>;
  },
  td: function CustomTd({ children }: any) {
    return <td className="px-4 py-3 text-zinc-600 align-top leading-relaxed break-words">{children}</td>;
  },
  pre: function CustomPre({ children }: any) {
    // 使用浅色背景防止大模型将表格意外缩进解析为代码块时造成视觉突兀
    return <pre className="overflow-x-auto bg-zinc-50 border border-zinc-100 text-zinc-700 p-4 rounded-2xl text-[14px] leading-[1.8] my-4 custom-scrollbar break-words whitespace-pre-wrap font-sans">{children}</pre>;
  },
  code: function CustomCode({ inline, children }: any) {
    if (inline) {
      return <code className="px-1.5 py-0.5 bg-zinc-100 text-zinc-800 rounded-md text-[13.5px] font-mono break-all">{children}</code>;
    }
    // 块级代码也继承浅色背景
    return <code className="font-sans text-[14px] break-words whitespace-pre-wrap text-zinc-700">{children}</code>;
  }
};

const MODELS = [
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    desc: '推荐，最强视觉解析',
    defaultUrl: 'https://api.openai.com/v1',
    keyLink: 'https://platform.openai.com/api-keys'
  },
  {
    id: 'qwen-vl-plus',
    name: '通义千问',
    desc: '国内好用且性价比高',
    defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    keyLink: 'https://dashscope.console.aliyun.com/apiKey'
  },
  {
    id: 'glm-4v',
    name: '智谱 GLM-4V',
    desc: '中文理解极其优秀',
    defaultUrl: 'https://open.bigmodel.cn/api/paas/v4',
    keyLink: 'https://bigmodel.cn/usercenter/apikeys'
  }
];

interface FileWithPreview extends File {
  preview: string;
}

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('da_apiKey') || '');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('da_baseUrl') || 'https://api.openai.com/v1');
  const [model, setModel] = useState(() => localStorage.getItem('da_model') || 'gpt-4o');
  
  // 新增高级设置状态
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState(() => localStorage.getItem('da_customBaseUrl') || '');
  const [customModelId, setCustomModelId] = useState(() => localStorage.getItem('da_customModelId') || '');
  
  // 新增：分析模式状态（single / multiple）
  const [analyzeMode, setAnalyzeMode] = useState<'single' | 'multiple'>('single');
  // 新增：保存多图模式下的所有图片，避免模式切换时丢失
  const [allFiles, setAllFiles] = useState<FileWithPreview[]>([]);
  
  // 派生状态：根据模式动态计算需要显示的图片，杜绝双状态同步导致的 Bug
  const displayFiles = analyzeMode === 'single' && allFiles.length > 0 ? [allFiles[0]] : allFiles;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // 新增：分离式 Tab 内容状态，用于承载 4 路并发数据
  const [tabContents, setTabContents] = useState({ overview: '', business: '', ux: '', ui: '' });
  // 专门给 4 大 Tab 用的派生状态，默认为 overview
  const [activeTab, setActiveTab] = useState<'overview' | 'business' | 'ux' | 'ui'>('overview');
  const [isCopied, setIsCopied] = useState(false);

  // 统一判断是否有结果输出
  const hasResult = !!(tabContents.overview || tabContents.business || tabContents.ux || tabContents.ui);
  // 是否包含错误（通过简单判断概览中是否有错误标志）
  const hasError = tabContents.overview.includes('❌ 分析失败');

  // 局部追问重写相关的状态
  const [rewriteInput, setRewriteInput] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  // 新增：图片全屏放大 (Lightbox)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // 新增：历史记录状态
  const [history, setHistory] = useState<Array<{ id: string; title: string; markdown: string; images: string[]; timestamp: number }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 监听 Esc 键关闭 Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    if (lightboxImage) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  // 简易 IDBRequest 转 Promise 工具
  const idbReq = <T extends any>(request: IDBRequest<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  // 定义统一的数据库版本号（提升版本以触发新建表的 upgradeneeded）
  const DB_VERSION = 2;

  // 初始化：从 IndexedDB 加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const db = await openDB('designAnalyzerDB', DB_VERSION, (db) => {
          if (!db.objectStoreNames.contains('history')) {
            db.createObjectStore('history', { keyPath: 'id' });
          }
        });
        const tx = db.transaction('history', 'readonly');
        const store = tx.objectStore('history');
        const allRecords = await idbReq(store.getAll());
        setHistory(allRecords.sort((a: any, b: any) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };
    loadHistory();
  }, []);

  // 保存分析记录到 IndexedDB
  const saveToHistory = async (title: string, markdown: string) => {
    try {
      // 将图片转换为base64存储
      const imagePromises = allFiles.map(async (file) => {
        return await fileToBase64(file);
      });
      const images = await Promise.all(imagePromises);
      
      const newRecord = {
        id: Date.now().toString(),
        title,
        markdown,
        images,
        timestamp: Date.now()
      };

      const db = await openDB('designAnalyzerDB', DB_VERSION);
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      await idbReq(store.add(newRecord));

      setHistory(prev => [newRecord, ...prev]);
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  // 删除历史记录
  const deleteHistory = async (id: string) => {
    try {
      const db = await openDB('designAnalyzerDB', DB_VERSION);
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      await idbReq(store.delete(id));

      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  // 清空所有历史记录
  const clearAllHistory = async () => {
    try {
      const db = await openDB('designAnalyzerDB', DB_VERSION);
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      await idbReq(store.clear());

      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  // 终极正则解析机制：自动识别语义并强制分栏，兼容所有瞎输出模型的“野生格式”
  const parseTabContent = (fullText: string) => {
    const tabs = { overview: '', business: '', ux: '', ui: '' };
    if (!fullText) return tabs;

    // 第一重装甲：先剔除所有模型可能乱加的最外层 markdown 代码块标记，并完全剔除模型内部的思考链 <Thought_Process> 标签及内容
    let cleanedText = fullText.replace(/<Thought_Process>[\s\S]*?<\/Thought_Process>/gi, '').trim();
    cleanedText = cleanedText.replace(/^```markdown\s*/gi, '').replace(/^```\s*/gi, '').replace(/```\s*$/g, '').trim();

    // 如果模型乖乖听话输出了标准的隐藏分隔符
    if (cleanedText.includes('===TAB_')) {
      const parts = cleanedText.split('===TAB_');
      parts.forEach(part => {
        if (part.startsWith('OVERVIEW===')) tabs.overview = part.replace('OVERVIEW===', '').trim();
        else if (part.startsWith('BUSINESS===')) tabs.business = part.replace('BUSINESS===', '').trim();
        else if (part.startsWith('UX===')) tabs.ux = part.replace('UX===', '').trim();
        else if (part.startsWith('UI===')) tabs.ui = part.replace('UI===', '').trim();
      });
      return tabs;
    }

    // 第二重装甲：基于标题关键字的正则强制匹配（拯救乱输出的弱模型）
    // 匹配 "综合总览" / "产品功能" / "交互体验" / "设计样式" 及其各种变体标题
    const overviewRegex = /(?:#+\s*(?:🌟\s*)?综合总览|第[一|1]部分[:：]?\s*综合总览|【综合总览】)/i;
    const businessRegex = /(?:#+\s*(?:📦\s*)?产品功能|第[二|2]部分[:：]?\s*产品功能|【产品功能】)/i;
    const uxRegex = /(?:#+\s*(?:👆\s*)?交互体验|第[三|3]部分[:：]?\s*交互体验|【交互体验】)/i;
    const uiRegex = /(?:#+\s*(?:🎨\s*)?设计样式|第[四|4]部分[:：]?\s*设计样式|【设计样式】)/i;

    const matchOverview = cleanedText.match(overviewRegex);
    const matchBusiness = cleanedText.match(businessRegex);
    const matchUx = cleanedText.match(uxRegex);
    const matchUi = cleanedText.match(uiRegex);

    // 如果连标题正则都匹配不到，说明彻底乱了，全塞进总览
    if (!matchOverview && !matchBusiness && !matchUx && !matchUi) {
      tabs.overview = cleanedText;
      return tabs;
    }

    // 获取各部分在字符串中的索引位置，按顺序进行切片
    const indices = [
      { name: 'overview', index: matchOverview ? matchOverview.index! : -1 },
      { name: 'business', index: matchBusiness ? matchBusiness.index! : -1 },
      { name: 'ux', index: matchUx ? matchUx.index! : -1 },
      { name: 'ui', index: matchUi ? matchUi.index! : -1 },
    ].filter(item => item.index !== -1).sort((a, b) => a.index - b.index);

    // 根据索引切片内容
    for (let i = 0; i < indices.length; i++) {
      const current = indices[i];
      const next = i + 1 < indices.length ? indices[i + 1] : null;
      const startIndex = current.index;
      const endIndex = next ? next.index : cleanedText.length;
      const content = cleanedText.substring(startIndex, endIndex).trim();
      
      // 去除匹配到的标题本身，让渲染组件统一加上标准标题
      const finalContent = content.replace(/^(?:#+\s*.*|第.部分.*|【.*】)\s*/, '');
      (tabs as any)[current.name] = finalContent;
    }

    return tabs;
  };

  // 加载历史记录
  const loadHistoryItem = (item: any) => {
    const loadedTabs = parseTabContent(item.markdown);
    setTabContents(loadedTabs);
    setActiveTab('overview'); // 重置 Tab
    
    // 加载关联的图片
    if (item.images && item.images.length > 0) {
      const filesWithPreview = item.images.map((img: string, index: number) => {
        // 创建虚拟文件对象
        const file = new File([], `history-image-${index}.png`, { type: 'image/png' });
        (file as any).preview = img;
        return file as FileWithPreview;
      });
      setAllFiles(filesWithPreview);
    }
    
    setShowHistory(false);
  };

  useEffect(() => {
    localStorage.setItem('da_apiKey', apiKey);
    localStorage.setItem('da_baseUrl', baseUrl);
    localStorage.setItem('da_model', model);
    localStorage.setItem('da_customBaseUrl', customBaseUrl);
    localStorage.setItem('da_customModelId', customModelId);
  }, [apiKey, baseUrl, model, customBaseUrl, customModelId]);

  // IndexedDB 简单封装
  const openDB = async (name: string, version: number, upgradeCallback?: (db: IDBDatabase) => void) => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onupgradeneeded = () => upgradeCallback?.(request.result);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    const newFiles = acceptedFiles.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));
    
    // 单图模式下，如果直接拖入多图，也只取第一张，确保不污染库
    const filesToAdd = analyzeMode === 'single' ? [newFiles[0]] : newFiles;
    
    // 过滤掉可能的 undefined 或 null
    const validFilesToAdd = filesToAdd.filter(Boolean);
    
    if (validFilesToAdd.length > 0) {
      const updatedAllFiles = [...allFiles, ...validFilesToAdd];
      setAllFiles(updatedAllFiles);
    }
  }, [analyzeMode, allFiles]);

  // 单图模式且已有一张图时，禁用整个上传区域
  const isDropzoneDisabled = analyzeMode === 'single' && allFiles.length >= 1;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: analyzeMode === 'multiple',
    disabled: isDropzoneDisabled
  } as any);

  const removeFile = (index: number) => {
    // 由于我们在单图模式下 displayFiles 永远只展示 allFiles[0]，对应的 index 必定是 0。
    // 在多图模式下，displayFiles 和 allFiles 一一对应。
    // 因此直接移除 allFiles 中对应 index 的文件即可。
    const updatedAllFiles = allFiles.filter((_, i) => i !== index);
    setAllFiles(updatedAllFiles);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl); // 释放内存
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 极其彻底的防白屏压缩机制：使用对象 URL 避免 FileReader 内存泄漏
        const MAX_SIZE = 1200;
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("无法创建 Canvas Context"));
          return;
        }
        
        // 使用更好的抗锯齿渲染
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, width, height);
        
        // 统一转为 jpeg 并设置质量 0.8
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("图片解码失败，请检查文件格式是否受支持"));
      };
      
      img.src = objectUrl;
    });
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      alert("请先点击右上角设置您的 API Key");
      setShowSettings(true);
      return;
    }
    if (allFiles.length === 0) {
      alert("请至少上传一张图片");
      return;
    }

    setIsAnalyzing(true);
    // 清空四个 Tab 的内容，准备接受新的流式数据
    setTabContents({ overview: '', business: '', ux: '', ui: '' });
    setActiveTab('overview'); // 每次新分析前强制切回总览
    
    try {
      const finalBaseUrl = customBaseUrl.trim() || baseUrl;
      const finalModel = customModelId.trim() || model;
      
      // 串行读取图片，防止多图并发时内存溢出
      const base64Images = [];
      for (const f of displayFiles) {
        try {
          const base64 = await fileToBase64(f);
          base64Images.push(base64);
        } catch (err) {
          console.error("图片读取失败:", err);
          throw new Error("某张图片读取失败，请检查图片格式或刷新后重试。");
        }
      }
      
      const isMulti = analyzeMode === 'multiple' && displayFiles.length > 1;
      
      // 构建多图/单图的基础用户 Prompt 内容体
      let baseUserContent: any[] = [];
      base64Images.forEach((base64, index) => {
        if (isMulti) {
          baseUserContent.push({ type: "text", text: `这是 图${index + 1}:` });
        }
        baseUserContent.push({ type: "image_url", image_url: { url: base64 } });
      });

      // 终极指令架构升级：极度结构化约束 + 黄金思考链(CoT) + One-Shot 范例
      const expertPrompts = {
        overview: `<Role>大厂顶尖产品架构师。点评极犀利、充满傲骨且极度专业。</Role>
<Task>输出【综合总览】分析，必须以 \`===TAB_OVERVIEW===\` 作为第一行！</Task>
<Constraints>
1. 语言：必须学术、刻薄、一针见血，直接宣判生死。禁止任何寒暄！
2. 结构限制：
  - 首段直接给出【核心业务目标(北极星指标)】。
  - ${isMulti ? '必须输出一个标准Markdown对比表格（表头包含所有图，行包括：核心护城河、业务定位、各维度评分）' : '不用表格，直接点评核心护城河。'}
  - 【深度剖析】：${isMulti ? '必须采用"图1做了XX而图2却XX"的穿插拉踩句式，绝不允许流水账！' : '客观评估信息架构合理度与设计成熟度评分。'}
</Constraints>
<Example>
===TAB_OVERVIEW===
### 🎯 北极星指标研判
图1与图2虽同属下沉电商赛道，但图1的核心目标是通过**极端的信息密度**榨取单屏转化率；而图2则试图通过**品类弱化**来伪造高端感，这在下沉市场是一种极其傲慢且致命的战略误判。
...
</Example>`,
        
        business: `<Role>背负极高KPI的高级增长产品经理。</Role>
<Task>输出【产品功能】深度分析，必须以 \`===TAB_BUSINESS===\` 作为第一行！</Task>
<Constraints>
1. 语言：犀利、不留情面、满载高级增长黑客术语。禁止任何寒暄！
2. 论点依据：每一次评价必须绑定【Fogg行为模型(B=MAP)】或【Kano模型】！
3. 结构限制：
  - 【行为触发点】：${isMulti ? '对比谁更好地部署了触发器(Prompt)，谁在逆人性设计？' : '分析页面动机与能力平衡。'}
  - 【业务链路与漏斗】：指出极其愚蠢的阻塞点。
  - 【总结】：${isMulti ? '必须单独设立🏆本局胜负判定 和 ⚠️致命反面教材' : '必须给出💡商业转化迭代建议'}。
</Constraints>
<Example>
===TAB_BUSINESS===
### 📈 Fogg行为模型下的转化漏斗审计
图1将首单补贴（Motivation）与一键支付（Ability）融合在一个极高权重的悬浮按钮上，是一个教科书级的完美触发器（Prompt）。
反观图2，竟然在支付前强行插入了毫无必要的“补充个人资料”步骤。在动机本就脆弱的引流页加入极高摩擦力的节点，这是标准的**漏斗流失制造机**。
...
</Example>`,

        ux: `<Role>极度信仰人机工程学的UX专家。</Role>
<Task>输出【交互体验】深度分析，必须以 \`===TAB_UX===\` 作为第一行！</Task>
<Constraints>
1. 语言：学术、刻薄、对糟糕体验零容忍。禁止任何寒暄！
2. 论点依据：每次拉踩必须引用【尼尔森可用性原则】、【米勒定律】或【菲茨定律】将其钉在耻辱柱上！
3. 结构限制：
  - 【信息分块与负荷】：分析认知超载或极简折叠。
  - 【操作域与防错】：${isMulti ? '对比谁的操作排布反人类，谁的容错设计更完美。' : '审视核心CTA按钮的点击舒适区。'}
  - 【总结】：${isMulti ? '必须单独设立🏆本局胜负判定 和 ⚠️致命反面教材' : '必须给出💡体验优化建议'}。
</Constraints>
<Example>
===TAB_UX===
### 🧩 米勒定律与认知负荷清算
图2的设计师显然根本没有听说过【米勒定律（7±2法则）】。其首页强行塞入了多达14个毫无视觉层级区分的金刚位Icon，导致用户的视觉焦点如同无头苍蝇般游荡，决策成本呈指数级上升。
相比之下，图1通过完美的卡片式分类（Chunking），将核心功能压缩至4个高频入口，展现了极强的克制力。
...
</Example>`,

        ui: `<Role>容不得半个像素偏差的顶级视觉设计专家。</Role>
<Task>输出【设计样式】深度分析，必须以 \`===TAB_UI===\` 作为第一行！</Task>
<Constraints>
1. 语言：高冷、学术、用设计理论进行降维打击。禁止任何寒暄！
2. 论点依据：每次审判必须引用【格式塔心理学】、【光环效应】或【奥卡姆剃刀原理】！
3. 结构限制：
  - 【排版与网格】：分析亲密性、对齐与隐藏网格。
  - 【首屏质感与情绪】：${isMulti ? '对比谁的高级感更强，谁像廉价外包模板。' : '分析色彩心理学与WCAG对比度合规性。'}
  - 【总结】：${isMulti ? '必须单独设立🏆本局胜负判定 和 ⚠️致命反面教材' : '必须给出💡视觉重构建议(剃掉多余设计噪音)'}。
</Constraints>
<Example>
===TAB_UI===
### 📐 格式塔心理学与视觉噪音审判
图1在处理商品列表时，完美践行了【奥卡姆剃刀原理】，剃掉了所有多余的分割线，完全依靠留白（Negative Space）和【格式塔亲密性原则】建立信息组，呼吸感极强。
而图2则像一个上世纪的后台管理系统，充满了廉价的1px灰色边框和滥用的投影，这些毫无意义的**视觉噪音**不仅破坏了品牌的光环效应，更让整个页面显得极度拥挤与廉价。
...
</Example>`
      };

      // 封装四路并发的独立 Fetch 闭包
      const fetchExpert = async (key: keyof typeof expertPrompts) => {
        const userPromptText = `请在输出报告前，先在 <Thought_Process> 标签内进行简短的内部自我推演，找出图中的核心痛点并确定你要引用的专业定律。推演结束后，必须以 \`===TAB_${key.toUpperCase()}===\` 作为分界线，然后严格模仿 <Example> 中的"极其专业、刻薄、拉踩"的文风输出正式的 Markdown 内容！绝不要带任何客套话！`;
        const content = [{ type: "text", text: userPromptText }, ...baseUserContent];

        const res = await fetch(`${finalBaseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: finalModel,
            messages: [
              { role: "system", content: expertPrompts[key] },
              { role: "user", content: content.filter(item => item != null) }
            ],
            temperature: 0.7,
            stream: true,
          })
        });

        if (!res.ok) throw new Error(`[${key}] API Error`);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let expertText = "";

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
              if (trimmedLine.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmedLine.slice(6));
                  if (data.choices?.[0]?.delta?.content) {
                    expertText += data.choices[0].delta.content;
                    // 流式并发更新特定 Tab 的状态，不影响其他 Tab
                    setTabContents(prev => ({ ...prev, [key]: expertText }));
                  }
                } catch (e) {}
              }
            }
          }
        }
        
        // 返回当前专家的完整文本，用于最后落库
        return expertText;
      };

      // 并发执行四大专家的流式请求！(为了规避部分API的高频并发限制，我们可以稍作延迟)
      const results = await Promise.all([
        fetchExpert('overview'),
        new Promise(r => setTimeout(r, 200)).then(() => fetchExpert('business')),
        new Promise(r => setTimeout(r, 400)).then(() => fetchExpert('ux')),
        new Promise(r => setTimeout(r, 600)).then(() => fetchExpert('ui'))
      ]) as [string, string, string, string];

      // 所有的流式请求结束后，拼接最终内容存入 IndexedDB 历史
      const finalRebuilt = `===TAB_OVERVIEW===\n${results[0]}\n\n===TAB_BUSINESS===\n${results[1]}\n\n===TAB_UX===\n${results[2]}\n\n===TAB_UI===\n${results[3]}\n\n`;
      
      saveToHistory(`多维专家分析 - ${new Date().toLocaleString('zh-CN')}`, finalRebuilt);

    } catch (error: any) {
      console.error("Fetch API Error Details:", error);
      
      const errorMessage = `❌ 分析失败：\n${error.message || '未知网络错误'}
      
🔍 **排查建议**：
1. **并发限制**：方案 1 采用了四大专家并行架构，如果您的 API Key (如免费版) 有强烈的速率限制 (RPM/TPM)，可能会报错。建议使用更充足余额的账号。
2. 其他可能：网络跨域、图片太大超出了并发内存。`;

      // 错误降级：填充到 overview 里
      setTabContents(prev => ({ ...prev, overview: errorMessage }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 基于多并发 Tab 内容合成完整的 Markdown（为了向下兼容拷贝/下载/历史记录合并）
  const getFullMarkdown = () => {
    return [
      `===TAB_OVERVIEW===`, tabContents.overview,
      `===TAB_BUSINESS===`, tabContents.business,
      `===TAB_UX===`, tabContents.ux,
      `===TAB_UI===`, tabContents.ui
    ].filter(Boolean).join('\n\n');
  };

  const handleCopy = async () => {
    const fullText = getFullMarkdown();
    if (!fullText.trim()) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleDownload = () => {
    const fullText = getFullMarkdown();
    if (!fullText.trim()) return;
    let exportText = fullText
      .replace(/===TAB_OVERVIEW===/g, '# 🌟 综合总览\n')
      .replace(/===TAB_BUSINESS===/g, '# 📦 产品功能\n')
      .replace(/===TAB_UX===/g, '# 👆 交互体验\n')
      .replace(/===TAB_UI===/g, '# 🎨 设计样式\n');
    
    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `竞品设计分析报告_${new Date().getTime()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 局部重写 / 追问 API 调用逻辑
  const handleRewrite = async () => {
    if (!rewriteInput.trim() || !apiKey) return;
    setIsRewriting(true);

    try {
      const finalBaseUrl = customBaseUrl.trim() || baseUrl;
      const finalModel = customModelId.trim() || model;
      
      const currentTabNameMap: Record<string, string> = {
        overview: '综合总览', business: '产品层面', ux: '交互层面', ui: '设计层面'
      };

      // 组装局部重写的专用 Prompt
      const rewritePrompt = `你现在是一位专注在【${currentTabNameMap[activeTab]}】领域的资深设计专家。
我刚刚对页面进行了一次完整的分析，你在该维度给我的原始分析内容是：
"""
${tabContents[activeTab]}
"""

现在用户对这段内容提出了一个新的追问/修改要求：
【${rewriteInput}】

请你结合原图（如果需要），严格遵循用户的要求，**重新写一份只针对这个维度**的分析报告，彻底替换掉原来的内容。
要求：
1. 语言依然要【一针见血】、【毒舌且专业】。
2. 绝对不允许输出任何你不需要重新回答的其他维度。
3. 必须直接开始输出新的 Markdown 正文，不允许有“好的”、“我明白了”之类的废话。`;

      const content: any[] = [{ type: "text", text: rewritePrompt }];
      for (const f of displayFiles) {
        try {
          const base64 = await fileToBase64(f);
          content.push({ type: "image_url", image_url: { url: base64 } });
        } catch (err) {} // 这里容错处理图片转base64，如果图太大就不传全图，也能依赖前面生成的文字
      }

      const response = await fetch(`${finalBaseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: finalModel,
          messages: [{ role: "user", content }],
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) throw new Error('API Request Failed');

      // 因为是针对单 Tab 的重写，我们要把它覆盖回去
      let newTabContent = "";
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                  newTabContent += data.choices[0].delta.content;
                  
                  // 流式替换单个 Tab 内容，触发实时渲染
                  setTabContents(prev => ({ ...prev, [activeTab]: newTabContent }));
                }
              } catch (e) {}
            }
          }
        }
      }
      
      // 存入最新的完整历史（基于所有最新的 Tab 状态合并）
      const newTabs = { ...tabContents, [activeTab]: newTabContent };
      const fullText = [
        `===TAB_OVERVIEW===`, newTabs.overview,
        `===TAB_BUSINESS===`, newTabs.business,
        `===TAB_UX===`, newTabs.ux,
        `===TAB_UI===`, newTabs.ui
      ].filter(Boolean).join('\n\n');

      saveToHistory(`修改后分析 - ${new Date().toLocaleString('zh-CN')}`, fullText);
      setRewriteInput('');
    } catch (error: any) {
      console.error(error);
      alert('重新分析失败，请检查网络或 API Key');
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] font-sans selection:bg-zinc-200">
      {/* 顶部流式全屏导航 */}
      <header className="bg-white/70 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="w-full px-6 lg:px-10 py-4 flex justify-between items-center max-w-[2000px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Design Analyzer</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                showHistory ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              查看历史
              {history.length > 0 && (
                <span className="text-xs bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                showSettings ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              配置 API
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[2000px] mx-auto px-6 lg:px-10 py-8 lg:py-10 flex flex-col gap-8">
        
        {/* 设置面板：全新全屏自适应模态弹窗 */}
        {showSettings ? (
          <div key="settings-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[800px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              
              {/* 弹窗头部 */}
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <h2 className="text-lg font-bold flex items-center gap-2.5 text-zinc-800 tracking-tight">
                  <span className="w-6 h-6 rounded-full bg-zinc-200/50 flex items-center justify-center text-sm">⚙️</span>
                  引擎与 API 配置
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-200/50 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗主体内容 */}
              <div className="p-6 overflow-y-auto">
                {/* 引擎选择大卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setModel(m.id);
                    setBaseUrl(m.defaultUrl);
                  }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                    model === m.id
                      ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'
                      : 'border-zinc-200/60 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  <div className="font-semibold text-base mb-1">{m.name}</div>
                  <div className={`text-xs ${model === m.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* API Key 填入区 */}
            <div className="bg-zinc-50/80 rounded-2xl p-6 border border-zinc-100">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-zinc-800">
                  填入您的 API Key <span className="text-red-500">*</span>
                </label>
                <a
                  href={MODELS.find(m => m.id === model)?.keyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                >
                  去获取 Key ↗
                </a>
              </div>
              
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-5 py-4 pr-12 text-base bg-white border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all duration-200 text-zinc-800 placeholder-zinc-300 shadow-sm"
                  placeholder={`请输入 ${MODELS.find(m => m.id === model)?.name} 的 API Key`}
                />
                {apiKey ? (
                  <button
                    key="clear-apiKey"
                    onClick={() => setApiKey('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors p-1"
                    title="清空"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
              
              <p className="mt-4 text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                安全承诺：API Key 仅储存在您的浏览器本地，不会上传至任何我们的服务器。
              </p>
              
              {/* 高级设置入口 */}
              <div className="mt-6 pt-4 border-t border-zinc-200/60">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors w-full justify-between sm:justify-start"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" />
                    高级设置 / 自定义模型 (可选)
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                
                {/* 展开的高级设置面板：全屏下变为双列网格 */}
                <div className={`transition-all duration-500 overflow-hidden ${showAdvanced ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="bg-zinc-100/50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-zinc-200/50">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5">自定义 API 地址 (Base URL)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customBaseUrl}
                          onChange={(e) => setCustomBaseUrl(e.target.value)}
                          className="w-full px-3 py-2 pr-8 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                          placeholder="例如：https://api.deepseek.com/v1"
                        />
                        {customBaseUrl ? (
                          <button
                            key="clear-customBaseUrl"
                            onClick={() => setCustomBaseUrl('')}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 transition-colors"
                            title="清空"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">留空则默认使用官方地址</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-600 mb-1.5">自定义模型名称 (Model ID)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={customModelId}
                          onChange={(e) => setCustomModelId(e.target.value)}
                          className="w-full px-3 py-2 pr-8 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                          placeholder="例如：claude-3-5-sonnet"
                        />
                        {customModelId ? (
                          <button
                            key="clear-customModelId"
                            onClick={() => setCustomModelId('')}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 transition-colors"
                            title="清空"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">留空则默认使用选定模型</p>
                    </div>
                  </div>
                </div>
              </div>

              </div>
              </div>
              
              {/* 弹窗底部操作区 */}
              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium tracking-wide transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98] shadow-md shadow-zinc-900/20"
                >
                  保存并关闭
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* 核心工作区：全屏三栏流式响应布局 */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start transition-all duration-500 w-full opacity-100">
          
          {/* 第一栏 (左侧)：独立工作台 */}
          <div className="w-full lg:w-[300px] xl:w-[340px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-[90px] z-10">
            
            {/* 新增：苹果风 Segmented Control (分段控制器) */}
            <div className="bg-zinc-100/80 p-1 rounded-2xl flex items-center shadow-inner">
              <button
                onClick={() => setAnalyzeMode('single')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  analyzeMode === 'single'
                    ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                单图深度分析
              </button>
              <button
                onClick={() => setAnalyzeMode('multiple')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  analyzeMode === 'multiple'
                    ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                多图竞品对比
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2">
              <div
                {...getRootProps()}
                className={`border-[1.5px] border-dashed rounded-[22px] p-10 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[280px]
                  ${isDropzoneDisabled
                    ? 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed'
                    : isDragActive
                      ? 'border-zinc-900 bg-zinc-100 cursor-pointer'
                      : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 cursor-pointer bg-zinc-50/50'
                  }`}
              >
                <input {...(getInputProps() as any)} />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300
                  ${isDropzoneDisabled
                    ? 'bg-zinc-100 text-zinc-400 shadow-none'
                    : isDragActive
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white shadow-sm text-zinc-600'}`}>
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  <span key={analyzeMode}>{analyzeMode === 'single' ? '上传单张设计图' : '上传多张竞品图'}</span>
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-[260px]">
                  {isDropzoneDisabled ? (
                    <span key="disabled">已选择图片。如需更改，请先删除下方图片。</span>
                  ) : (
                    <span key="enabled">
                      <span>点击或拖拽至此处</span><br/>
                      <span key={analyzeMode}>{analyzeMode === 'single'
                        ? '进行深入的视觉与交互剖析'
                        : '支持拖拽多张图片进行深度横向对比'}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 预览区 */}
            {displayFiles.length > 0 ? (
              <div key={`preview-zone-${analyzeMode}`} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-800">已选内容</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-zinc-100 rounded-md text-zinc-600">{displayFiles.length} 张图片</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {displayFiles.map((file, index) => (
                    <div key={`${file.preview}-${index}`} className="relative group shrink-0">
                      <img
                        src={file.preview}
                        alt="preview"
                        onClick={() => setLightboxImage(file.preview)}
                        className="w-20 h-20 object-cover rounded-xl border border-black/5 cursor-zoom-in hover:opacity-90 transition-opacity"
                        title="点击放大查看"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-md border border-zinc-100 text-zinc-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 执行按钮 */}
            <button
              onClick={handleAnalyze}
              disabled={allFiles.length === 0 || isAnalyzing}
              className="bg-zinc-900 text-white rounded-full font-medium tracking-wide transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed w-full py-4 text-base shadow-lg shadow-zinc-900/20 flex justify-center items-center gap-3"
            >
              {isAnalyzing ? (
                <span key="analyzing" className="flex items-center gap-3">
                  <span className="inline-block w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>分析中...</span>
                </span>
              ) : (
                <span key="idle" className="flex items-center gap-3">
                  <BarChart2 className="w-5 h-5" />
                  <span key={allFiles.length > 1 ? 'multi' : 'single'}>
                    生成{allFiles.length > 1 ? '对比分析' : '分析'}报告
                  </span>
                </span>
              )}
            </button>
          </div>

          {/* 第二 & 第三栏容器：中侧报告 + 右侧独立图库 */}
          <div className="flex-1 w-full flex flex-col xl:flex-row gap-6 lg:gap-10 items-start min-w-0">
            
            {/* 第二栏 (中侧)：沉浸阅读区 */}
            <div className="flex-1 w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 min-h-[600px] flex flex-col p-8 lg:p-12 min-w-0">
              <div className="flex items-center justify-between mb-10 border-b border-zinc-100 pb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
                  分析报告
                </h2>
                
                {/* 操作按钮 */}
                {(!isAnalyzing && hasResult && !hasError) ? (
                  <div key="action-btns" className="flex items-center gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition-colors"
                    >
                      <span key={isCopied ? 'copied' : 'copy'} className="flex items-center gap-1.5">
                        {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? '已复制' : '复制内容'}
                      </span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg transition-colors shadow-sm"
                      title="打印或另存为 PDF"
                    >
                      <Printer className="w-4 h-4" />
                      生成 PDF
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      导出 MD
                    </button>
                  </div>
                ) : null}
              </div>
              
              <div className="flex-1 flex flex-col items-center">
                {/* 锁定最优阅读宽度，防止全屏下文字过长难以阅读 */}
                <div className="w-full max-w-[820px]">
                  {(!hasResult && !isAnalyzing) ? (
                    <div key="empty" className="h-full flex flex-col items-center justify-center text-zinc-400 mt-32">
                      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                        <ImageIcon className="w-8 h-8 text-zinc-300" />
                      </div>
                      <h3 className="text-lg font-medium text-zinc-600 mb-2">等待分析</h3>
                      <p className="text-sm">上传图片后，AI 将在这里输出专业的洞察</p>
                    </div>
                  ) : isAnalyzing ? (
                    <div key="loading" className="h-full flex flex-col items-center justify-center text-zinc-800 mt-32 space-y-6">
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
                    <div key="result" className="w-full text-zinc-800 animate-in fade-in duration-500">
                      {hasError ? (
                        <div key="error-box" className="whitespace-pre-wrap text-red-500 bg-red-50 p-6 rounded-2xl border border-red-100">{tabContents.overview}</div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          {/* 四维度 Tab 导航栏 */}
                          {hasResult && (
                            <div className="flex bg-zinc-100/80 p-1.5 rounded-2xl shadow-inner overflow-x-auto custom-scrollbar shrink-0">
                              <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                  activeTab === 'overview' ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                              >
                                综合总览
                              </button>
                              <button
                                onClick={() => setActiveTab('business')}
                                className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                  activeTab === 'business' ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                              >
                                产品功能
                              </button>
                              <button
                                onClick={() => setActiveTab('ux')}
                                className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                  activeTab === 'ux' ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                              >
                                交互体验
                              </button>
                              <button
                                onClick={() => setActiveTab('ui')}
                                className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                                  activeTab === 'ui' ? 'bg-white text-zinc-900 shadow-[0_2px_8px_rgb(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-700'
                                }`}
                              >
                                设计样式
                              </button>
                            </div>
                          )}

                          {/* Markdown 内容渲染区 (带切换动画) */}
                          <div key={activeTab} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <div className="w-full break-words max-w-full">
                              <MarkdownErrorBoundary>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={markdownComponents}
                                >
                                  {tabContents[activeTab]}
                                </ReactMarkdown>
                              </MarkdownErrorBoundary>
                            </div>
                          </div>

                          {/* 局部追问 / 重写框 */}
                          {tabContents[activeTab] && (
                            <div className="mt-8 pt-6 border-t border-zinc-100 animate-in fade-in duration-500 delay-300">
                              <label className="block text-xs font-semibold text-zinc-500 mb-2">
                                对当前【{
                                  activeTab === 'overview' ? '综合总览' :
                                  activeTab === 'business' ? '产品功能' :
                                  activeTab === 'ux' ? '交互体验' : '设计样式'
                                }】的分析结果有其他要求？
                              </label>
                              <div className="relative flex items-end gap-3">
                                <textarea
                                  value={rewriteInput}
                                  onChange={e => setRewriteInput(e.target.value)}
                                  placeholder="例如：帮我详细展开一下颜色搭配的建议..."
                                  disabled={isRewriting}
                                  className="w-full resize-none min-h-[44px] max-h-[120px] px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all disabled:opacity-50"
                                  rows={1}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleRewrite();
                                    }
                                  }}
                                />
                                <button
                                  onClick={handleRewrite}
                                  disabled={!rewriteInput.trim() || isRewriting}
                                  className="shrink-0 h-[44px] px-4 bg-zinc-900 text-white rounded-xl text-sm font-medium transition-all hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center min-w-[80px]"
                                >
                                  {isRewriting ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                  ) : "重新生成"}
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

            {/* 第三栏 (右侧)：独立图库停靠栏 (仅当有分析结果且有图时显示) */}
            {(!isAnalyzing && hasResult && !hasError && allFiles.length > 0) ? (
              <div key="right-gallery" className="w-full xl:w-[320px] 2xl:w-[380px] shrink-0 flex flex-col gap-6 xl:sticky xl:top-[90px] xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto custom-scrollbar xl:pr-2 pb-10">
                <div className="text-sm font-semibold text-zinc-800 pb-3 border-b border-zinc-200/60 sticky top-0 bg-[#fbfbfd] z-10 pt-2">
                  对照参考图库
                </div>
                <div className="flex flex-col gap-6">
                  {displayFiles.map((file, index) => (
                    <div key={`preview-${index}`} className="flex flex-col gap-2.5">
                      <span className="text-[13px] font-bold text-zinc-700 bg-white shadow-sm border border-zinc-200 w-fit px-3 py-1 rounded-lg">
                        图 {index + 1}
                      </span>
                      <div className="rounded-2xl overflow-hidden border border-black/5 bg-white p-2 shadow-sm group">
                        <img
                          src={file.preview}
                          alt={`图 ${index + 1}`}
                          onClick={() => setLightboxImage(file.preview)}
                          className="w-full object-contain rounded-xl cursor-zoom-in group-hover:opacity-90 transition-opacity"
                          title="点击放大查看细节"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </main>

      {/* 图片全屏放大 (Lightbox) 遮罩层 */}
      {lightboxImage ? (
        <div
          key="lightbox"
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
            title="关闭 (Esc)"
          >
            <X className="w-8 h-8" />
          </button>
          
          <img
            src={lightboxImage}
            alt="Enlarged design"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // 阻止冒泡，以免点击图片关闭
          />
        </div>
      ) : null}

      {/* 历史记录侧边栏 */}
      {showHistory ? (
        <div
          key="history-panel"
          className="fixed inset-y-0 right-0 z-[150] w-[380px] bg-white shadow-2xl border-l border-zinc-100 flex flex-col animate-in slide-in-from-right duration-300"
        >
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-800">历史记录</h3>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`确定要清空所有 ${history.length} 条历史记录吗？此操作不可恢复。`)) {
                      clearAllHistory();
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  清空全部
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center text-zinc-400 py-12 flex flex-col items-center">
                <Clock className="w-12 h-12 mb-4 text-zinc-300 stroke-[1.5]" />
                <p>暂无历史记录</p>
                <p className="text-sm mt-1">每次分析完成后会自动保存</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <div key={item.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-zinc-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-zinc-800 text-sm truncate flex-1">{item.title}</h4>
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这条历史记录吗？')) {
                            deleteHistory(item.id);
                          }
                        }}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                        title="删除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">
                      {new Date(item.timestamp).toLocaleString('zh-CN')}
                    </p>
                    
                    {/* 显示关联的图片缩略图 */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {item.images.map((img, index) => (
                          <div key={index} className="flex-shrink-0">
                            <img
                              src={img}
                              alt={`图 ${index + 1}`}
                              className="w-12 h-12 object-cover rounded-lg border border-zinc-200"
                              title={`图 ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => loadHistoryItem(item)}
                      className="w-full py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                      加载报告
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;