/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CATEGORIES, convertValue, Unit, Category, HistoryItem } from '../types';
import { Copy, Check, ArrowRightLeft, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UnitConverterProps {
  initialCategoryId?: string;
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export default function UnitConverter({ initialCategoryId, onAddHistory }: UnitConverterProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    CATEGORIES.find(c => c.id === (initialCategoryId || 'length')) || CATEGORIES[0]
  );
  const [inputValue, setInputValue] = useState<string>('1');
  const [inputUnit, setInputUnit] = useState<Unit>(selectedCategory.units[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync category if props change (e.g. from search click)
  useEffect(() => {
    if (initialCategoryId) {
      const cat = CATEGORIES.find(c => c.id === initialCategoryId);
      if (cat) {
        setSelectedCategory(cat);
        setInputUnit(cat.units[0]);
      }
    }
  }, [initialCategoryId]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setInputUnit(category.units[0]);
    setInputValue('1');
  };

  const handleCopy = (val: string, unitSymbol: string, unitName: string) => {
    const copyText = `${val}${unitSymbol}`;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopiedId(unitSymbol);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const numericValue = parseFloat(inputValue);
  const isValidNumber = !isNaN(numericValue);

  // Quick save to history on debounce or specific convert trigger
  const handleSaveToHistory = (targetUnit: Unit, resultStr: string) => {
    if (!isValidNumber) return;
    onAddHistory({
      type: 'unit',
      title: `${selectedCategory.name} 변환`,
      expression: `${inputValue} ${inputUnit.symbol} ➔ ${targetUnit.name}`,
      result: `${resultStr} ${targetUnit.symbol}`,
      categoryName: selectedCategory.name
    });
  };

  return (
    <div className="w-full space-y-6" id="unit-converter-section">
      {/* Category Icons Selector */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800" id="category-selector-tabs">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory.id === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id}`}
              onClick={() => handleCategoryChange(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{cat.symbol}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm" id="converter-input-card">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Numeric Value Input */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block" htmlFor="convert-input-value">
              변환할 값 입력
            </label>
            <div className="relative">
              <input
                id="convert-input-value"
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="숫자를 입력하세요"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-lg font-medium transition-all"
              />
              {inputValue && (
                <button
                  onClick={() => setInputValue('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm font-medium px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800"
                >
                  지우기
                </button>
              )}
            </div>
          </div>

          {/* Unit Selector Dropdown */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block" htmlFor="convert-input-unit">
              입력 단위 선택
            </label>
            <select
              id="convert-input-unit"
              value={inputUnit.id}
              onChange={(e) => {
                const found = selectedCategory.units.find(u => u.id === e.target.value);
                if (found) setInputUnit(found);
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-base font-medium transition-all cursor-pointer"
            >
              {selectedCategory.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input unit description */}
        {inputUnit.description && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500" id="unit-description-banner">
            <HelpCircle size={14} className="shrink-0" />
            <span>{inputUnit.description}</span>
          </div>
        )}
      </div>

      {/* Grid of Results */}
      <div className="space-y-3" id="converter-results-section">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <ArrowRightLeft size={16} className="text-sky-500" />
            실시간 전체 변환 결과
          </h3>
          <span className="text-xs text-slate-400">클릭 시 클립보드에 복사됩니다</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="results-bento-grid">
          <AnimatePresence mode="popLayout">
            {selectedCategory.units.map((unit) => {
              const isSourceUnit = unit.id === inputUnit.id;
              
              // Base-unit architecture calculation
              let rawVal = 0;
              if (isValidNumber) {
                rawVal = convertValue(numericValue, inputUnit, unit);
              }
              
              // Format result beautifully: remove floating point noise, but keep precision
              let displayVal = '0';
              if (isValidNumber) {
                if (rawVal === 0) {
                  displayVal = '0';
                } else if (Math.abs(rawVal) < 0.000001) {
                  displayVal = rawVal.toExponential(6);
                } else {
                  // Round to reasonable significant figures (up to 10 decimal places)
                  // Avoid scientific notation if possible
                  displayVal = Number(rawVal.toFixed(10)).toString();
                }
              }

              const isCopied = copiedId === unit.symbol;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  key={unit.id}
                  id={`result-card-${unit.id}`}
                  onClick={() => {
                    if (isValidNumber) {
                      handleCopy(displayVal, unit.symbol, unit.name);
                      handleSaveToHistory(unit, displayVal);
                    }
                  }}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group h-28 select-all ${
                    isSourceUnit
                      ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/60 ring-1 ring-sky-100 dark:ring-sky-900/30'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800 hover:shadow-md hover:shadow-slate-100/50 dark:hover:shadow-none'
                  }`}
                >
                  {/* Top line: Name & Symbol */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">
                        {unit.name}
                      </span>
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {unit.symbol}
                      </span>
                    </div>
                    
                    {/* Copy feedback button */}
                    <button
                      type="button"
                      id={`copy-btn-${unit.id}`}
                      className={`p-1.5 rounded-lg transition-all ${
                        isCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title="결과 복사하기"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Value */}
                  <div className="text-right overflow-hidden mt-2">
                    <span
                      className={`font-mono text-lg font-bold break-all transition-all ${
                        isSourceUnit
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400'
                      }`}
                    >
                      {displayVal}
                    </span>
                  </div>

                  {/* Highlight for source unit */}
                  {isSourceUnit && (
                    <span className="absolute bottom-1 left-3 text-[9px] font-semibold text-sky-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={8} /> 입력 단위
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
