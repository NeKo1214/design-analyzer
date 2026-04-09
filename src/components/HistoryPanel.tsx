import { X, Clock } from 'lucide-react';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const HistoryPanel = ({ history, onLoad, onDelete, onClearAll, onClose }: HistoryPanelProps) => (
  <div className="fixed inset-y-0 right-0 z-[150] w-full sm:w-[380px] bg-white shadow-2xl border-l border-zinc-100 flex flex-col animate-in slide-in-from-right duration-300">
    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
      <h3 className="text-lg font-bold text-zinc-800">历史记录</h3>
      <div className="flex items-center gap-2">
        {history.length > 0 && (
          <button onClick={() => { if (confirm(`确定要清空所有 ${history.length} 条历史记录吗？此操作不可恢复。`)) onClearAll(); }}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            清空全部
          </button>
        )}
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors">
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
                <button onClick={() => { if (confirm('确定要删除这条历史记录吗？')) onDelete(item.id); }}
                  className="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50" title="删除">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{new Date(item.timestamp).toLocaleString('zh-CN')}</p>

              {item.images && item.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {item.images.map((img, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img src={img} alt={`图 ${index + 1}`} className="w-12 h-12 object-cover rounded-lg border border-zinc-200" />
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => onLoad(item)}
                className="w-full py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors">
                加载报告
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);