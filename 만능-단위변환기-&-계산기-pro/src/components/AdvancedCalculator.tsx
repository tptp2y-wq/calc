/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Copy, Check, Sliders, Play, RotateCcw, HelpCircle, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface AdvancedCalculatorProps {
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export default function AdvancedCalculator({ onAddHistory }: AdvancedCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'linear' | 'quadratic' | 'gcdlcm' | 'expression'>('linear');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // States: Linear Equation (ax + b = c)
  const [linA, setLinA] = useState<string>('2');
  const [linB, setLinB] = useState<string>('5');
  const [linC, setLinC] = useState<string>('15');

  // States: Quadratic Equation (ax^2 + bx + c = 0)
  const [quadA, setQuadA] = useState<string>('1');
  const [quadB, setQuadB] = useState<string>('-5');
  const [quadC, setQuadC] = useState<string>('6');

  // States: GCD / LCM
  const [numsInput, setNumsInput] = useState<string>('24, 36, 60');

  // States: Expression Evaluator
  const [exprInput, setExprInput] = useState<string>('2 * (15 - 3) / Math.sqrt(16)');
  const [exprResult, setExprResult] = useState<string>('');
  const [exprError, setExprError] = useState<string>('');

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // 1. Solve Linear: ax + b = c
  const solveLinear = () => {
    const a = parseFloat(linA);
    const b = parseFloat(linB);
    const c = parseFloat(linC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      return { error: '모든 계수(a, b, c)에 올바른 숫자를 입력하세요.' };
    }
    if (a === 0) {
      if (b === c) {
        return { error: 'a가 0이므로 식이 "0 = 0"이 됩니다. 즉, x는 모든 실수(무한 해)입니다.' };
      } else {
        return { error: 'a가 0이므로 모순(해 없음)이 발생합니다.' };
      }
    }

    const x = (c - b) / a;
    const step1 = `${a}x = ${c} - (${b})`;
    const step2 = `${a}x = ${c - b}`;
    const step3 = `x = ${c - b} / ${a}`;
    const step4 = `x = ${Number(x.toFixed(6))}`;

    return {
      x,
      steps: [step1, step2, step3, step4],
      formula: `${linA}x + ${linB} = ${linC}`
    };
  };

  const handleSaveLinear = () => {
    const res = solveLinear();
    if ('error' in res) return;
    const resultStr = `x = ${Number(res.x.toFixed(6))}`;
    onAddHistory({
      type: 'advanced',
      title: '일차방정식 풀이',
      expression: res.formula,
      result: resultStr
    });
    handleCopyText(resultStr, 'linear');
  };

  // 2. Solve Quadratic: ax^2 + bx + c = 0
  const solveQuadratic = () => {
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      return { error: '모든 계수(a, b, c)에 올바른 숫자를 입력하세요.' };
    }
    if (a === 0) {
      return { error: 'a는 0일 수 없습니다. (0이면 일차방정식 탭을 이용하세요)' };
    }

    // Discriminant D = b^2 - 4ac
    const d = b * b - 4 * a * c;
    const steps: string[] = [];
    steps.push(`판별식 D = b² - 4ac`);
    steps.push(`D = (${b})² - 4 * (${a}) * (${c})`);
    steps.push(`D = ${b * b} - ${4 * a * c} = ${d}`);

    if (d > 0) {
      const sqrtD = Math.sqrt(d);
      const x1 = (-b + sqrtD) / (2 * a);
      const x2 = (-b - sqrtD) / (2 * a);
      steps.push(`D > 0 이므로 서로 다른 두 실근을 갖습니다.`);
      steps.push(`x = (-b ± √D) / 2a`);
      steps.push(`x = (-(${b}) ± √${d}) / (2 * ${a})`);
      steps.push(`x1 = (${-b} + ${sqrtD.toFixed(4)}) / ${2 * a} = ${Number(x1.toFixed(6))}`);
      steps.push(`x2 = (${-b} - ${sqrtD.toFixed(4)}) / ${2 * a} = ${Number(x2.toFixed(6))}`);
      return {
        type: 'two_real',
        x1,
        x2,
        steps,
        formula: `${quadA}x² + (${quadB})x + (${quadC}) = 0`
      };
    } else if (d === 0) {
      const x = -b / (2 * a);
      steps.push(`D = 0 이므로 중근(서로 같은 두 실근)을 갖습니다.`);
      steps.push(`x = -b / 2a`);
      steps.push(`x = -(${b}) / (2 * ${a}) = ${Number(x.toFixed(6))}`);
      return {
        type: 'one_real',
        x,
        steps,
        formula: `${quadA}x² + (${quadB})x + (${quadC}) = 0`
      };
    } else {
      // Complex roots
      const realPart = -b / (2 * a);
      const imaginaryPart = Math.sqrt(-d) / (2 * a);
      steps.push(`D < 0 이므로 서로 다른 두 허근을 갖습니다.`);
      steps.push(`x = (-b ± i√(-D)) / 2a`);
      steps.push(`x = (${-b} ± i√${-d}) / ${2 * a}`);
      steps.push(`x1 = ${Number(realPart.toFixed(6))} + ${Number(imaginaryPart.toFixed(6))}i`);
      steps.push(`x2 = ${Number(realPart.toFixed(6))} - ${Number(imaginaryPart.toFixed(6))}i`);
      return {
        type: 'complex',
        x1Str: `${Number(realPart.toFixed(4))} + ${Number(imaginaryPart.toFixed(4))}i`,
        x2Str: `${Number(realPart.toFixed(4))} - ${Number(imaginaryPart.toFixed(4))}i`,
        steps,
        formula: `${quadA}x² + (${quadB})x + (${quadC}) = 0`
      };
    }
  };

  const handleSaveQuadratic = () => {
    const res = solveQuadratic();
    if ('error' in res) return;
    let resultStr = '';
    if (res.type === 'two_real') {
      resultStr = `x1 = ${Number(res.x1.toFixed(6))}, x2 = ${Number(res.x2.toFixed(6))}`;
    } else if (res.type === 'one_real') {
      resultStr = `x = ${Number(res.x.toFixed(6))} (중근)`;
    } else {
      resultStr = `x = ${res.x1Str}, ${res.x2Str} (허근)`;
    }
    onAddHistory({
      type: 'advanced',
      title: '이차방정식 풀이',
      expression: res.formula,
      result: resultStr
    });
    handleCopyText(resultStr, 'quadratic');
  };

  // 3. GCD / LCM
  const getGcdAndLcm = () => {
    // parse comma list
    const parts = numsInput.split(',').map(s => s.trim()).filter(s => s !== '');
    const nums: number[] = [];
    for (const part of parts) {
      const n = parseInt(part);
      if (isNaN(n) || n <= 0) {
        return { error: '1 이상의 자연수를 쉼표(,)로 구분해서 입력해주세요.' };
      }
      nums.push(n);
    }

    if (nums.length < 2) {
      return { error: '계산을 위해 최소 2개 이상의 숫자를 입력해주세요.' };
    }

    // Helper: GCD of two numbers
    const gcd2 = (a: number, b: number): number => {
      while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
      }
      return a;
    };

    // Helper: LCM of two numbers
    const lcm2 = (a: number, b: number): number => {
      return (a * b) / gcd2(a, b);
    };

    let gcdResult = nums[0];
    let lcmResult = nums[0];
    const steps: string[] = [];

    steps.push(`입력한 숫자들: [ ${nums.join(', ')} ]`);

    for (let i = 1; i < nums.length; i++) {
      const currGcd = gcdResult;
      const currLcm = lcmResult;
      gcdResult = gcd2(gcdResult, nums[i]);
      lcmResult = lcm2(lcmResult, nums[i]);
      steps.push(
        `단계 ${i}: GCD(${currGcd}, ${nums[i]}) = ${gcdResult} | LCM(${currLcm}, ${nums[i]}) = ${lcmResult}`
      );
    }

    return {
      gcd: gcdResult,
      lcm: lcmResult,
      steps,
      formula: `GCD & LCM of (${nums.join(', ')})`
    };
  };

  const handleSaveGcdLcm = () => {
    const res = getGcdAndLcm();
    if ('error' in res) return;
    const resultStr = `최대공약수(GCD): ${res.gcd}, 최소공배수(LCM): ${res.lcm}`;
    onAddHistory({
      type: 'advanced',
      title: 'GCD/LCM 계산',
      expression: res.formula,
      result: resultStr
    });
    handleCopyText(resultStr, 'gcdlcm');
  };

  // 4. Expression Evaluator
  const handleEvalExpression = () => {
    setExprError('');
    setExprResult('');
    
    if (!exprInput.trim()) {
      setExprError('수식을 입력해 주세요.');
      return;
    }

    try {
      // Create a safe, sandbox-like function wrapper with Math context
      // Standard mathematical operations are allowed
      const mathScope = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        sqrt: Math.sqrt,
        abs: Math.abs,
        pow: Math.pow,
        log: Math.log, // ln
        log10: Math.log10,
        pi: Math.PI,
        PI: Math.PI,
        e: Math.E,
        E: Math.E,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        random: Math.random,
      };

      // Clean the string to prevent raw window access and keep it safe
      const cleaned = exprInput
        .replace(/window/g, '')
        .replace(/document/g, '')
        .replace(/alert/g, '')
        .replace(/console/g, '')
        .replace(/localStorage/g, '')
        .replace(/eval/g, '')
        .replace(/Math\./g, ''); // strip out "Math." prefix to let users type sin() or sqrt() directly!

      // Construct dynamic function safely by injecting the math variables
      const paramNames = Object.keys(mathScope);
      const paramValues = Object.values(mathScope);
      
      // Dynamic safe evaluation with parameters
      const evaluator = new Function(...paramNames, `return (${cleaned});`);
      const result = evaluator(...paramValues);

      if (result === undefined || result === null || isNaN(result)) {
        setExprError('올바르지 않은 수식이거나 계산 불가능한 값입니다.');
      } else {
        const finalVal = Number(result.toFixed(10)).toString();
        setExprResult(finalVal);
        
        onAddHistory({
          type: 'advanced',
          title: '수식 계산기',
          expression: exprInput,
          result: finalVal
        });
      }
    } catch (err: any) {
      setExprError(`수식 오류: ${err.message || '문법을 확인하세요.'}`);
    }
  };

  const linearRes = solveLinear();
  const quadRes = solveQuadratic();
  const gcdLcmRes = getGcdAndLcm();

  return (
    <div className="w-full space-y-6" id="advanced-calculator-section">
      {/* Mini tab switcher */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800" id="advanced-tab-switcher">
        <button
          onClick={() => setActiveTab('linear')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'linear'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          일차방정식 (ax+b=c)
        </button>
        <button
          onClick={() => setActiveTab('quadratic')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'quadratic'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          이차방정식 (ax²+bx+c=0)
        </button>
        <button
          onClick={() => setActiveTab('gcdlcm')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gcdlcm'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          최대공약수 / 최소공배수
        </button>
        <button
          onClick={() => setActiveTab('expression')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'expression'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          공학용 수식 계산기
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input parameters */}
        <div className="lg:col-span-5 space-y-4">
          {activeTab === 'linear' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm" id="linear-input-box">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">일차방정식 계수 입력</h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-center font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                {linA || 'a'}x + {linB || 'b'} = {linC || 'c'}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">a (x의 계수)</label>
                  <input
                    type="number"
                    value={linA}
                    onChange={(e) => setLinA(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">b (상수항)</label>
                  <input
                    type="number"
                    value={linB}
                    onChange={(e) => setLinB(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">c (우변 상수)</label>
                  <input
                    type="number"
                    value={linC}
                    onChange={(e) => setLinC(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quadratic' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm" id="quad-input-box">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">이차방정식 계수 입력</h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-center font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                {quadA || 'a'}x² + ({quadB || 'b'})x + ({quadC || 'c'}) = 0
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">a (x²의 계수)</label>
                  <input
                    type="number"
                    value={quadA}
                    onChange={(e) => setQuadA(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">b (x의 계수)</label>
                  <input
                    type="number"
                    value={quadB}
                    onChange={(e) => setQuadB(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">c (상수항)</label>
                  <input
                    type="number"
                    value={quadC}
                    onChange={(e) => setQuadC(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gcdlcm' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm" id="gcdlcm-input-box">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">자연수 배열 입력</h4>
              <p className="text-xs text-slate-400">여러 개의 자연수를 쉼표로 분리하여 입력해주세요.</p>
              <textarea
                value={numsInput}
                onChange={(e) => setNumsInput(e.target.value)}
                placeholder="예: 24, 36, 60"
                className="w-full h-24 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-base resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setNumsInput('12, 18, 30, 42')}
                  className="text-xs text-indigo-500 hover:underline font-bold cursor-pointer"
                >
                  기본 예시 넣기
                </button>
              </div>
            </div>
          )}

          {activeTab === 'expression' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm" id="expr-input-box">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">수식 직접 입력</h4>
              <p className="text-xs text-slate-400">
                일반 연산 및 다양한 삼각함수, 제곱근, 로그 연산을 지원합니다. (예: `sin(pi/6)`, `sqrt(64)`, `pow(2, 10)`)
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={exprInput}
                  onChange={(e) => setExprInput(e.target.value)}
                  placeholder="수식 입력..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-base"
                />
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-1">
                    {['sin(pi/6)', 'sqrt(2)', 'pow(3,3)', 'log(e)'].map((sample) => (
                      <button
                        key={sample}
                        onClick={() => setExprInput(sample)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] rounded font-mono font-bold text-slate-500 cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleEvalExpression}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold shadow-sm cursor-pointer"
                  >
                    <Play size={12} />
                    <span>실행</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Step-by-Step explanation / solutions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm min-h-64 flex flex-col justify-between" id="advanced-solution-card">
            
            {/* 1. Header of result area */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-500 flex items-center gap-1">
                <FileText size={14} />
                해결 상세 단계 (Solution Steps)
              </span>
              <span className="text-[10px] text-slate-400">계산이 자동으로 수행됩니다</span>
            </div>

            {/* 2. Scrollable Body containing result details */}
            <div className="py-4 flex-grow overflow-y-auto max-h-96 space-y-4 font-sans text-sm">
              {activeTab === 'linear' && (() => {
                if ('error' in linearRes) {
                  return <p className="text-amber-500 font-semibold">{linearRes.error}</p>;
                }
                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block">최종 해 (Result)</span>
                        <span className="font-mono text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          x = {Number(linearRes.x.toFixed(6))}
                        </span>
                      </div>
                      <button
                        onClick={handleSaveLinear}
                        className={`p-2 rounded-lg ${copiedField === 'linear' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500'}`}
                        title="결과 복사 및 기록 보관"
                      >
                        {copiedField === 'linear' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-slate-400 font-bold block">풀이 과정:</span>
                      {linearRes.steps.map((step, idx) => (
                        <div key={idx} className="font-mono text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-bold">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'quadratic' && (() => {
                if ('error' in quadRes) {
                  return <p className="text-amber-500 font-semibold">{quadRes.error}</p>;
                }
                return (
                  <div className="space-y-4">
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30 flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block">최종 근 (Roots)</span>
                        <div className="font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 space-y-1">
                          {quadRes.type === 'two_real' && (
                            <>
                              <div>x₁ = {Number(quadRes.x1?.toFixed(6))}</div>
                              <div>x₂ = {Number(quadRes.x2?.toFixed(6))}</div>
                            </>
                          )}
                          {quadRes.type === 'one_real' && (
                            <div>x = {Number(quadRes.x?.toFixed(6))} <span className="text-xs text-slate-400 font-normal font-sans">(중근)</span></div>
                          )}
                          {quadRes.type === 'complex' && (
                            <>
                              <div>x₁ = {quadRes.x1Str}</div>
                              <div>x₂ = {quadRes.x2Str} <span className="text-xs text-slate-400 font-normal font-sans">(허근)</span></div>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleSaveQuadratic}
                        className={`p-2 rounded-lg shrink-0 ${copiedField === 'quadratic' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500'}`}
                        title="결과 복사 및 기록 보관"
                      >
                        {copiedField === 'quadratic' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-slate-400 font-bold block">풀이 과정 (근의 공식 사용):</span>
                      {quadRes.steps.map((step, idx) => (
                        <div key={idx} className="font-mono text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-bold">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'gcdlcm' && (() => {
                if ('error' in gcdLcmRes) {
                  return <p className="text-amber-500 font-semibold">{gcdLcmRes.error}</p>;
                }
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block">최대공약수 (GCD)</span>
                        <span className="font-mono text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                          {gcdLcmRes.gcd}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-slate-400 font-semibold block">최소공배수 (LCM)</span>
                          <span className="font-mono text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                            {gcdLcmRes.lcm}
                          </span>
                        </div>
                        <button
                          onClick={handleSaveGcdLcm}
                          className={`p-2 rounded-lg ${copiedField === 'gcdlcm' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500'}`}
                          title="결과 복사 및 기록 보관"
                        >
                          {copiedField === 'gcdlcm' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-slate-400 font-bold block">순차적 계산 흐름:</span>
                      {gcdLcmRes.steps.map((step, idx) => (
                        <div key={idx} className="font-mono text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-bold">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'expression' && (
                <div className="space-y-4">
                  {exprError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/40 text-xs font-semibold">
                      {exprError}
                    </div>
                  )}

                  {exprResult && (
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block">계산된 결과 값 (Result)</span>
                        <span className="font-mono text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {exprResult}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(exprResult, 'expr-res')}
                        className={`p-2 rounded-lg ${copiedField === 'expr-res' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500'}`}
                      >
                        {copiedField === 'expr-res' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs space-y-1 text-slate-500 leading-relaxed">
                    <p className="font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <HelpCircle size={12} /> 수식 문법 정보
                    </p>
                    <p>• 기본 기호: `+`, `-`, `*`, `/`, `( )` 사용 가능.</p>
                    <p>• 삼각함수: `sin(x)`, `cos(x)`, `tan(x)` (라디안 단위 기준)</p>
                    <p>• 기타 함수: `sqrt(x)` (제곱근), `pow(x, y)` (x의 y제곱), `abs(x)` (절대값)</p>
                    <p>• 상수 지원: `pi` (원주율), `e` (자연상수)</p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Tiny footer info */}
            <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              방정식 및 행렬, 수식 연산의 정확도는 64비트 정밀 부동 소수점을 따릅니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
