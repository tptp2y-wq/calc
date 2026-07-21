/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HistoryItem } from '../types';
import { Copy, Check, Equal } from 'lucide-react';

interface GeneralCalculatorProps {
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export default function GeneralCalculator({ onAddHistory }: GeneralCalculatorProps) {
  const [display, setDisplay] = useState<string>('');
  const [subDisplay, setSubDisplay] = useState<string>('');
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Latest state ref pattern to prevent stale closures in global event listener
  const stateRef = useRef({ display, subDisplay, isCalculated });
  stateRef.current = { display, subDisplay, isCalculated };

  const buttons = [
    { label: 'C', value: 'C', type: 'clear' },
    { label: '(', value: '(', type: 'paren' },
    { label: ')', value: ')', type: 'paren' },
    { label: '⌫', value: 'back', type: 'backspace' },
    { label: '7', value: '7', type: 'num' },
    { label: '8', value: '8', type: 'num' },
    { label: '9', value: '9', type: 'num' },
    { label: '÷', value: '/', type: 'op' },
    { label: '4', value: '4', type: 'num' },
    { label: '5', value: '5', type: 'num' },
    { label: '6', value: '6', type: 'num' },
    { label: '×', value: '*', type: 'op' },
    { label: '1', value: '1', type: 'num' },
    { label: '2', value: '2', type: 'num' },
    { label: '3', value: '3', type: 'num' },
    { label: '-', value: '-', type: 'op' },
    { label: '0', value: '0', type: 'num' },
    { label: '.', value: '.', type: 'dot' },
    { label: '%', value: '%', type: 'op' },
    { label: '+', value: '+', type: 'op' },
  ];

  const handlePress = (val: string, type: string) => {
    if (type === 'clear') {
      setDisplay('');
      setSubDisplay('');
      setIsCalculated(false);
      return;
    }

    if (type === 'backspace') {
      if (stateRef.current.isCalculated) {
        setDisplay('');
        setSubDisplay('');
        setIsCalculated(false);
      } else {
        setDisplay((prev) => prev.slice(0, -1));
      }
      return;
    }

    // If calculation was done and we type:
    if (stateRef.current.isCalculated) {
      if (type === 'op') {
        // Continue calculating on top of the previous result
        const base = stateRef.current.subDisplay && stateRef.current.subDisplay !== '오류' && stateRef.current.subDisplay !== '수식 오류' ? stateRef.current.subDisplay : '';
        setDisplay(base + val);
        setSubDisplay('');
        setIsCalculated(false);
        return;
      } else {
        // Start fresh calculation
        setDisplay(type === 'dot' ? '0.' : val);
        setSubDisplay('');
        setIsCalculated(false);
        return;
      }
    }

    // Append to current input expression with smart logic
    setDisplay((prev) => {
      // Smart operator replacement: if previous character is an operator and we click another operator, replace it
      if (type === 'op') {
        const lastChar = prev.slice(-1);
        if (['+', '-', '*', '/', '%'].includes(lastChar)) {
          return prev.slice(0, -1) + val;
        }
      }

      // Decimals protection
      if (type === 'dot') {
        // Find the last number segment being entered
        const parts = prev.split(/[\+\-\*\/\(\)%]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
          return prev; // Ignore consecutive or extra decimals in the same number
        }
        if (prev === '' || /[\+\-\*\/\(\)%]$/.test(prev)) {
          return prev + '0.';
        }
      }

      // Avoid leading operators
      if (prev === '' && ['+', '*', '/', '%'].includes(val)) {
        return prev;
      }

      return prev + val;
    });
  };

  const calculateResult = () => {
    const currentDisplay = stateRef.current.display;
    if (!currentDisplay.trim()) return;
    try {
      let expr = currentDisplay;

      // Safe representation of percentage: convert "X%" to "(X/100)"
      // This matches digits (with optional decimal point) followed by % and replaces with (/100)
      expr = expr.replace(/(\d+(\.\d+)?)(%)/g, '($1/100)');

      // Validate characters to prevent arbitrary script execution
      if (/[^0-9+\-*/().\s]/g.test(expr)) {
        setSubDisplay('수식 오류');
        setIsCalculated(true);
        return;
      }

      const evaluator = new Function(`return (${expr});`);
      const res = evaluator();

      if (res === undefined || res === null || isNaN(res) || !isFinite(res)) {
        setSubDisplay('오류');
        setIsCalculated(true);
      } else {
        const formattedRes = Number(res.toFixed(10)).toString();
        setSubDisplay(formattedRes);
        setIsCalculated(true);

        // Auto save to history
        onAddHistory({
          type: 'general',
          title: '일반 계산기',
          expression: formatExpressionForDisplay(currentDisplay),
          result: formattedRes
        });
      }
    } catch (err) {
      setSubDisplay('오류');
      setIsCalculated(true);
    }
  };

  // Latest handler ref pattern for event listeners
  const handlePressRef = useRef(handlePress);
  handlePressRef.current = handlePress;
  
  const calculateResultRef = useRef(calculateResult);
  calculateResultRef.current = calculateResult;

  // Keyboard integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing shortcuts when user is focusing an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key;

      if (key >= '0' && key <= '9') {
        handlePressRef.current(key, 'num');
      } else if (key === '.') {
        handlePressRef.current('.', 'dot');
      } else if (key === '+') {
        handlePressRef.current('+', 'op');
      } else if (key === '-') {
        handlePressRef.current('-', 'op');
      } else if (key === '*') {
        handlePressRef.current('*', 'op');
      } else if (key === '/') {
        e.preventDefault();
        handlePressRef.current('/', 'op');
      } else if (key === '%') {
        handlePressRef.current('%', 'op');
      } else if (key === '(' || key === ')') {
        handlePressRef.current(key, 'paren');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculateResultRef.current();
      } else if (key === 'Backspace') {
        handlePressRef.current('back', 'backspace');
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        handlePressRef.current('C', 'clear');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCopy = () => {
    if (!subDisplay || subDisplay === '오류' || subDisplay === '수식 오류') return;
    navigator.clipboard.writeText(subDisplay).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // Render mathematical symbols beautifully on-screen
  const formatExpressionForDisplay = (expr: string) => {
    if (!expr) return '';
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' - ')
      .replace(/%/g, '% ');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl space-y-5" id="general-calc-container">
      <div className="space-y-1.5 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">일반 사칙연산 계산기</span>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">표준 전자계산기</h3>
        </div>
        <div className="text-[10px] bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 py-1 px-2.5 rounded-full font-bold shadow-sm">
          ⌨️ 키보드 연동 완료
        </div>
      </div>

      {/* Calculator Screen Display */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-right space-y-2 h-32 flex flex-col justify-between shadow-inner">
        {/* Top small display line */}
        <div className="text-sm font-semibold font-mono text-slate-400 dark:text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none h-6 flex items-center justify-end">
          {isCalculated ? (
            <span className="text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1">
              <span>{formatExpressionForDisplay(display)}</span>
              <span className="text-purple-500 dark:text-purple-400 font-bold">=</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-300 dark:text-slate-700 font-normal">수식 입력 중...</span>
          )}
        </div>

        {/* Bottom large display line */}
        <div className="flex justify-between items-end">
          {isCalculated && subDisplay && subDisplay !== '오류' && subDisplay !== '수식 오류' ? (
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'} transition-all cursor-pointer mb-0.5`}
              title="결과 복사"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          ) : <div />}
          <div className="text-3xl font-extrabold font-mono text-slate-800 dark:text-slate-100 truncate max-w-[85%] select-all">
            {isCalculated ? (subDisplay || '0') : (formatExpressionForDisplay(display) || '0')}
          </div>
        </div>
      </div>

      {/* Button Grid layout */}
      <div className="grid grid-cols-4 gap-3">
        {buttons.map((btn, idx) => {
          let btnClass = 'flex items-center justify-center h-14 rounded-2xl text-base font-bold transition-all active:scale-95 cursor-pointer ';
          
          if (btn.type === 'clear') {
            btnClass += 'bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30';
          } else if (btn.type === 'backspace') {
            btnClass += 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';
          } else if (btn.type === 'op' || btn.type === 'paren') {
            btnClass += 'bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:hover:bg-sky-900/30';
          } else {
            btnClass += 'bg-slate-50 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
          }

          return (
            <button
              key={idx}
              onClick={() => handlePress(btn.value, btn.type)}
              className={btnClass}
            >
              {btn.label}
            </button>
          );
        })}

        {/* Big Equals button */}
        <button
          onClick={calculateResult}
          className="col-span-4 flex items-center justify-center gap-1.5 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-extrabold shadow-md shadow-sky-600/15 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          <Equal size={18} />
          <span>계산 결과 산출</span>
        </button>
      </div>
    </div>
  );
}
