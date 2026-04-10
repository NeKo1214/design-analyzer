import { useState } from 'react';
import { X, Share2, Copy, Check, Plus, Trash2, AlertCircle } from 'lucide-react';

interface KeyRecord {
  key: string;
  label: string;
  createdAt: string;
  active: boolean;
}

interface SharePanelProps {
  apiServerUrl: string; // DA API Server 地址，如 https://your-da-server.com
  adminSecret: string;  // 管理员密钥（存储在本地 settings 中）
  onClose: () => void;
}

export const SharePanel = ({ apiServerUrl, adminSecret, onClose }: SharePanelProps) => {
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [error, setError] = useState('');

  const baseUrl = (apiServerUrl || 'http://localhost:3100').replace(/\/+$/, '');

  // 若 adminSecret 为空则不附带该 Header（localhost 无需 Secret 即可访问）
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminSecret?.trim()) headers['X-Admin-Secret'] = adminSecret.trim();

  const fetchKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${baseUrl}/api/admin/keys`, { headers });
      const json = await res.json();
      if (json.success) {
        setKeys(json.data.keys);
        setFetchedOnce(true);
      } else {
        setError(json.error?.message || '获取失败');
      }
    } catch {
      setError('无法连接到 API Server，请检查地址是否正确');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${baseUrl}/api/admin/keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewLabel('');
        setKeys(prev => [{ ...json.data, active: true }, ...prev]);
      } else {
        setError(json.error?.message || '生成失败');
      }
    } catch {
      setError('生成 Key 失败，请检查 API Server 地址与 Admin Secret');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (key: string) => {
    if (!confirm('确认吊销该 DA Key？吊销后持有该 Key 的用户将立即失去访问权限。')) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/admin/keys/${key}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (json.success) {
        setKeys(prev => prev.map(k => k.key === key ? { ...k, active: false } : k));
      } else {
        setError(json.error?.message || '吊销失败');
      }
    } catch {
      setError('吊销失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[680px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2.5 text-zinc-800 tracking-tight">
            <Share2 className="w-5 h-5" />
            分享分析能力 / DA Key 管理
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-200/50 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* 说明 */}
          <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700 leading-relaxed">
            生成 DA Key 后，将其分享给任意平台。对方填入 DA Key 后，即可调用你的分析框架与提示词能力，但需自备 LLM API Key（由对方自己承担费用）。
          </div>

          {/* 当前连接地址提示 */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-50 rounded-xl px-4 py-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block shrink-0"></span>
            连接到：<code className="font-mono text-zinc-600">{baseUrl}</code>
            {!adminSecret?.trim() && <span className="ml-1 text-amber-500">（本地模式，无需 Admin Secret）</span>}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* 生成新 Key */}
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="备注名称（选填），如：飞书集成、团队共享"
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              生成 Key
            </button>
            {!fetchedOnce && (
              <button
                onClick={fetchKeys}
                disabled={loading}
                className="px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-sm hover:bg-zinc-50 disabled:opacity-50 transition-all whitespace-nowrap"
              >
                {loading ? '加载中...' : '查看已有 Key'}
              </button>
            )}
          </div>

          {/* Key 列表 */}
          {keys.length > 0 && (
            <div className="flex flex-col gap-2">
              {keys.map(record => (
                <div key={record.key} className={`flex items-center gap-3 p-4 rounded-2xl border ${record.active ? 'border-zinc-200 bg-white' : 'border-zinc-100 bg-zinc-50 opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${record.active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-500'}`}>
                        {record.active ? '有效' : '已吊销'}
                      </span>
                      {record.label && <span className="text-sm text-zinc-600 font-medium">{record.label}</span>}
                      <span className="text-xs text-zinc-400">{new Date(record.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <code className="text-xs text-zinc-500 font-mono truncate block">{record.key}</code>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {record.active && (
                      <>
                        <button
                          onClick={() => handleCopy(record.key)}
                          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                          title="复制 Key"
                        >
                          {copiedKey === record.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRevoke(record.key)}
                          className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                          title="吊销 Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {fetchedOnce && keys.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-4">暂无 DA Key，点击「生成 Key」创建第一个</p>
          )}
        </div>

        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all shadow-md shadow-zinc-900/20">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};