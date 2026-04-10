import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { MODELS } from '../constants/models.config';

interface SettingsPanelProps {
  apiKey: string;
  setApiKey: (v: string) => void;
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  customBaseUrl: string;
  setCustomBaseUrl: (v: string) => void;
  customModelId: string;
  setCustomModelId: (v: string) => void;
  apiServerUrl: string;
  setApiServerUrl: (v: string) => void;
  adminSecret: string;
  setAdminSecret: (v: string) => void;
  onClose: () => void;
}

export const SettingsPanel = (props: SettingsPanelProps) => {
  const { apiKey, setApiKey, setBaseUrl, model, setModel, customBaseUrl, setCustomBaseUrl, customModelId, setCustomModelId, apiServerUrl, setApiServerUrl, adminSecret, setAdminSecret, onClose } = props;
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[800px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2.5 text-zinc-800 tracking-tight">
            <span className="w-6 h-6 rounded-full bg-zinc-200/50 flex items-center justify-center text-sm">⚙️</span>
            引擎与 API 配置
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-200/50 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => { setModel(m.id); setBaseUrl(m.defaultUrl); }}
                className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 ${model === m.id ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' : 'border-zinc-200/60 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50'}`}>
                <div className="font-semibold text-base mb-1">{m.name}</div>
                <div className={`text-xs ${model === m.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{m.desc}</div>
              </button>
            ))}
          </div>

          <div className="bg-zinc-50/80 rounded-2xl p-6 border border-zinc-100">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-zinc-800">
                填入您的 API Key <span className="text-red-500">*</span>
              </label>
              <a href={MODELS.find(m => m.id === model)?.keyLink} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full transition-colors">
                去获取 Key ↗
              </a>
            </div>

            <div className="relative">
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                className="w-full px-5 py-4 pr-12 text-base bg-white border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 outline-none transition-all duration-200 text-zinc-800 placeholder-zinc-300 shadow-sm"
                placeholder={`请输入 ${MODELS.find(m => m.id === model)?.name} 的 API Key`} />
              {apiKey && (
                <button onClick={() => setApiKey('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors p-1" title="清空">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              安全承诺：API Key 仅储存在您的浏览器本地，不会上传至任何我们的服务器。
            </p>

            <div className="mt-6 pt-4 border-t border-zinc-200/60">
              <button onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors w-full justify-between sm:justify-start">
                <span className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  高级设置 / 自定义模型 (可选)
                </span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </button>

              <div className={`transition-all duration-500 overflow-hidden ${showAdvanced ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-zinc-100/50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-zinc-200/50">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">自定义 API 地址 (Base URL)</label>
                    <div className="relative">
                      <input type="text" value={customBaseUrl} onChange={e => setCustomBaseUrl(e.target.value)}
                        className="w-full px-3 py-2 pr-8 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                        placeholder="例如：https://api.deepseek.com/v1" />
                      {customBaseUrl && (
                        <button onClick={() => setCustomBaseUrl('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">留空则默认使用官方地址</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">自定义模型名称 (Model ID)</label>
                    <div className="relative">
                      <input type="text" value={customModelId} onChange={e => setCustomModelId(e.target.value)}
                        className="w-full px-3 py-2 pr-8 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                        placeholder="例如：claude-3-5-sonnet" />
                      {customModelId && (
                        <button onClick={() => setCustomModelId('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">留空则默认使用选定模型</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">DA API Server 地址</label>
                    <div className="relative">
                      <input type="text" value={apiServerUrl} onChange={e => setApiServerUrl(e.target.value)}
                        className="w-full px-3 py-2 pr-8 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                        placeholder="例如：https://your-da-server.com" />
                      {apiServerUrl && (
                        <button onClick={() => setApiServerUrl('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">用于「分享能力」功能，管理 DA Key</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Admin Secret（DA Server 管理密钥）</label>
                    <div className="relative">
                      <input type="password" value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                        className="w-full px-3 py-2 pr-8 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
                        placeholder="对应 DA Server 的 ADMIN_SECRET" />
                      {adminSecret && (
                        <button onClick={() => setAdminSecret('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full p-1 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">仅存储在本地，不会上传</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium tracking-wide transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98] shadow-md shadow-zinc-900/20">
            保存并关闭
          </button>
        </div>
      </div>
    </div>
  );
};