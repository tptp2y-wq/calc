/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Trash2, Copy, Check, History, Sparkles, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryListProps {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryList({ history, onDelete, onClearAll }: HistoryListProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'general':
        return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40';
      case 'unit':
        return 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40';
      case 'percent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40';
      case 'salary':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40';
      case 'advanced':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'general': return '일반 계산';
      case 'unit': return '단위 변환';
      case 'percent': return '퍼센트';
      case 'salary': return '실수령액';
      case 'advanced': return '고급 수학';
      default: return '계산';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4" id="history-container">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
          <History size={16} className="text-slate-500" />
          최근 계산/변환 기록
        </h3>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-lg"
          >
            <Trash2 size={12} />
            전체 삭제
          </button>
        )}
      </div>

      {/* Filter and badge toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
          <Filter size={12} /> 필터:
        </span>
        {[
          { id: 'all', name: '전체' },
          { id: 'general', name: '일반계산' },
          { id: 'unit', name: '단위변환' },
          { id: 'percent', name: '퍼센트' },
          { id: 'salary', name: '실수령액' },
          { id: 'advanced', name: '고급수학' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              filterType === btn.id
                ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400'
            }`}
          >
            {btn.name}
          </button>
        ))}
      </div>

      {/* History Items list */}
      <div className="overflow-y-auto max-h-[350px] pr-1 space-y-2" id="history-scroller">
        <AnimatePresence mode="popLayout">
          {filteredHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center space-y-1.5"
            >
              <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">저장된 기록이 없습니다.</p>
              <p className="text-[10px] text-slate-400">계산을 하거나 변환 결과 카드를 클릭하면 기록이 보관됩니다.</p>
            </motion.div>
          ) : (
            filteredHistory.map((item) => {
              const displayDate = new Date(item.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const isCopied = copiedId === item.id;
              const copyContent = `${item.expression} = ${item.result}`;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100/50 dark:border-slate-850 flex justify-between items-start group hover:border-slate-200 dark:hover:border-slate-750 transition-all"
                >
                  <div className="space-y-1 overflow-hidden pr-2">
                    {/* Top line badges & date */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getBadgeStyle(item.type)}`}>
                        {getTypeText(item.type)}
                      </span>
                      {item.categoryName && (
                        <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                          {item.categoryName}
                        </span>
                      )}
                      <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500">
                        {displayDate}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.expression}
                    </div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      = {item.result}
                    </div>
                  </div>

                  {/* Actions (Copy / Delete) */}
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleCopy(copyContent, item.id)}
                      className={`p-1 rounded-lg transition-all cursor-pointer ${
                        isCopied ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800'
                      }`}
                      title="복사"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 dark:bg-slate-900 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                      title="삭제"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
