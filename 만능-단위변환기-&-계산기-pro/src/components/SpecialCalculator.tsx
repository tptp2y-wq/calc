/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Copy, Check, Percent, Briefcase, Calculator, CircleHelp, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface SpecialCalculatorProps {
  onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
}

export default function SpecialCalculator({ onAddHistory }: SpecialCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'percent' | 'salary'>('percent');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Percent Calculator States
  const [pct1Whole, setPct1Whole] = useState<string>('10000');
  const [pct1Percent, setPct1Percent] = useState<string>('15');
  
  const [pct2Whole, setPct2Whole] = useState<string>('1500');
  const [pct2Part, setPct2Part] = useState<string>('300');

  const [pct3Whole, setPct3Whole] = useState<string>('8000');
  const [pct3Percent, setPct3Percent] = useState<string>('20');
  const [pct3Dir, setPct3Dir] = useState<'up' | 'down'>('up');

  const [pct4From, setPct4From] = useState<string>('5000');
  const [pct4To, setPct4To] = useState<string>('6500');

  // Salary Calculator States
  const [salaryType, setSalaryType] = useState<'annual' | 'monthly'>('annual');
  const [salaryAmount, setSalaryAmount] = useState<string>('4000'); // 40,000,000 KRW or 4,000,000 KRW
  const [nonTaxable, setNonTaxable] = useState<string>('20'); // 200,000 KRW
  const [dependents, setDependents] = useState<number>(1); // 본인 포함
  const [children, setChildren] = useState<number>(0);

  // Helper: Format KRW currency with commas
  const formatKRW = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(val));
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // 1. Percent Calculations
  const calcPercent1 = () => {
    const whole = parseFloat(pct1Whole);
    const pct = parseFloat(pct1Percent);
    if (isNaN(whole) || !pct1Whole || isNaN(pct) || !pct1Percent) return null;
    const result = (whole * pct) / 100;
    return result;
  };

  const calcPercent2 = () => {
    const whole = parseFloat(pct2Whole);
    const part = parseFloat(pct2Part);
    if (isNaN(whole) || !pct2Whole || isNaN(part) || !pct2Part || whole === 0) return null;
    const result = (part / whole) * 100;
    return result;
  };

  const calcPercent3 = () => {
    const whole = parseFloat(pct3Whole);
    const pct = parseFloat(pct3Percent);
    if (isNaN(whole) || !pct3Whole || isNaN(pct) || !pct3Percent) return null;
    const multiplier = pct3Dir === 'up' ? 1 + pct / 100 : 1 - pct / 100;
    return whole * multiplier;
  };

  const calcPercent4 = () => {
    const fromVal = parseFloat(pct4From);
    const toVal = parseFloat(pct4To);
    if (isNaN(fromVal) || !pct4From || isNaN(toVal) || !pct4To || fromVal === 0) return null;
    const result = ((toVal - fromVal) / fromVal) * 100;
    return result;
  };

  const savePercentHistory = (expression: string, result: string) => {
    onAddHistory({
      type: 'percent',
      title: '퍼센트 계산',
      expression,
      result
    });
  };

  // 2. Korean Salary Calculations
  const computeSalaryBreakdown = () => {
    let rawSalaryAmount = parseFloat(salaryAmount) || 0;
    // convert to raw KRW (amount in Ten Thousand KRW)
    let annualSalary = salaryType === 'annual' ? rawSalaryAmount * 10000 : rawSalaryAmount * 12 * 10000;
    let monthlySalary = salaryType === 'monthly' ? rawSalaryAmount * 10000 : (rawSalaryAmount * 10000) / 12;
    let monthlyNonTaxable = (parseFloat(nonTaxable) || 0) * 10000;

    if (monthlySalary <= 0) {
      return {
        annualSalary: 0,
        monthlySalary: 0,
        monthlyNonTaxable: 0,
        nationalPension: 0,
        healthInsurance: 0,
        longTermCare: 0,
        employmentInsurance: 0,
        incomeTax: 0,
        localIncomeTax: 0,
        totalDeductions: 0,
        netPay: 0,
        taxableIncome: 0
      };
    }

    const monthlyTaxable = Math.max(0, monthlySalary - monthlyNonTaxable);

    // 1) 국민연금 (National Pension): 4.5% (Capped between 370k and 5.9M KRW base)
    // 2024 bounds: min base 370k, max base 5.9M.
    const pensionBase = Math.min(5900000, Math.max(370000, monthlyTaxable));
    const nationalPension = Math.round(pensionBase * 0.045);

    // 2) 건강보험 (Health Insurance): 3.545% (2024 Rate)
    const healthInsurance = Math.round(monthlyTaxable * 0.03545);

    // 3) 장기요양보험 (Long-term Care): 12.95% of health insurance premium
    const longTermCare = Math.round(healthInsurance * 0.1295);

    // 4) 고용보험 (Employment Insurance): 0.9%
    const employmentInsurance = Math.round(monthlyTaxable * 0.009);

    // 5) 근로소득세 (Income Tax - Progressive Approximation based on taxable monthly income)
    // To make this look highly authentic, we approximate the national single earner progressive tax
    const annualTaxable = monthlyTaxable * 12;
    
    // Earned Income Deduction (근로소득공제) approximation
    let earnedIncomeDeduction = 0;
    if (annualTaxable <= 5000000) {
      earnedIncomeDeduction = annualTaxable * 0.7;
    } else if (annualTaxable <= 15000000) {
      earnedIncomeDeduction = 3500000 + (annualTaxable - 5000000) * 0.4;
    } else if (annualTaxable <= 45000000) {
      earnedIncomeDeduction = 7500000 + (annualTaxable - 15000000) * 0.15;
    } else if (annualTaxable <= 100000000) {
      earnedIncomeDeduction = 12000000 + (annualTaxable - 45000000) * 0.05;
    } else {
      earnedIncomeDeduction = 14750000 + (annualTaxable - 100000000) * 0.02;
    }

    // Personal Exemption (인적공제): 1.5 million KRW per dependent
    const personalDeduction = dependents * 1500000 + (children > 0 ? children * 1500000 : 0);
    
    // Standard and Pension Premium deduction estimate
    const standardExemption = 130000 + (nationalPension + healthInsurance) * 12;

    // Net taxable base
    const taxBase = Math.max(0, annualTaxable - earnedIncomeDeduction - personalDeduction - standardExemption);

    // National progressive tax rates (2024 brackets)
    let annualIncomeTax = 0;
    if (taxBase <= 14000000) {
      annualIncomeTax = taxBase * 0.06;
    } else if (taxBase <= 50000000) {
      annualIncomeTax = 840000 + (taxBase - 14000000) * 0.15;
    } else if (taxBase <= 88000000) {
      annualIncomeTax = 6240000 + (taxBase - 50000000) * 0.24;
    } else if (taxBase <= 150000000) {
      annualIncomeTax = 15360000 + (taxBase - 88000000) * 0.35;
    } else if (taxBase <= 300000000) {
      annualIncomeTax = 37060000 + (taxBase - 150000000) * 0.38;
    } else if (taxBase <= 500000000) {
      annualIncomeTax = 94060000 + (taxBase - 300000000) * 0.40;
    } else if (taxBase <= 1000000000) {
      annualIncomeTax = 174060000 + (taxBase - 500000000) * 0.42;
    } else {
      annualIncomeTax = 384060000 + (taxBase - 1000000000) * 0.45;
    }

    // Earned income tax credit (근로소득세액공제) approximation
    let taxCredit = 0;
    if (annualIncomeTax <= 1300000) {
      taxCredit = annualIncomeTax * 0.55;
    } else {
      taxCredit = Math.min(740000, 715000 + (annualIncomeTax - 1300000) * 0.3);
    }
    
    const finalAnnualIncomeTax = Math.max(0, annualIncomeTax - taxCredit);
    const incomeTax = Math.round(finalAnnualIncomeTax / 12);

    // 6) 지방소득세 (Local Income Tax): 10% of Income Tax
    const localIncomeTax = Math.round(incomeTax * 0.1);

    // Total deductions & Net monthly pay
    const totalDeductions = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;
    const netPay = Math.max(0, monthlySalary - totalDeductions);

    return {
      annualSalary,
      monthlySalary,
      monthlyNonTaxable,
      nationalPension,
      healthInsurance,
      longTermCare,
      employmentInsurance,
      incomeTax,
      localIncomeTax,
      totalDeductions,
      netPay,
      taxableIncome: monthlyTaxable
    };
  };

  const breakdown = computeSalaryBreakdown();

  const handleSaveSalaryToHistory = () => {
    if (breakdown.monthlySalary <= 0) return;
    const inputDesc = salaryType === 'annual' ? `연봉 ${salaryAmount}만원` : `월급 ${salaryAmount}만원`;
    onAddHistory({
      type: 'salary',
      title: '연봉 실수령액 계산',
      expression: `${inputDesc} (비과세 ${nonTaxable}만, 부양가족 ${dependents}명)`,
      result: `월 실수령액 ${formatKRW(breakdown.netPay)}`
    });
    handleCopyText(formatKRW(breakdown.netPay), 'salary-result');
  };

  return (
    <div className="w-full space-y-6" id="special-calculator-section">
      {/* Tab bar */}
      <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-slate-800" id="special-tab-switcher">
        <button
          onClick={() => setActiveTab('percent')}
          id="btn-tab-percent"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'percent'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Percent size={16} />
          <span>퍼센트 계산기</span>
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          id="btn-tab-salary"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'salary'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase size={16} />
          <span>연봉 실수령액 계산기</span>
        </button>
      </div>

      {activeTab === 'percent' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="percent-grid">
          {/* Card 1: n% of whole */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm" id="pct-card-1">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">공식 1</span>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">전체의 n%는 얼마?</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pct1Whole}
                  onChange={(e) => setPct1Whole(e.target.value)}
                  placeholder="전체값"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">의</span>
                <input
                  type="number"
                  value={pct1Percent}
                  onChange={(e) => setPct1Percent(e.target.value)}
                  placeholder="퍼센트"
                  className="w-1/3 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">%는?</span>
              </div>

              {calcPercent1() !== null && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center transition-all">
                  <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    값: <span className="text-base">{calcPercent1()?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                  </div>
                  <button
                    onClick={() => {
                      const resVal = calcPercent1()?.toString() || '';
                      handleCopyText(resVal, 'pct1');
                      savePercentHistory(`${pct1Whole}의 ${pct1Percent}%`, resVal);
                    }}
                    className={`p-1.5 rounded-lg ${copiedField === 'pct1' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer'}`}
                  >
                    {copiedField === 'pct1' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Part of whole */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm" id="pct-card-2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">공식 2</span>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">전체값 중 일부값은 몇%?</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pct2Whole}
                  onChange={(e) => setPct2Whole(e.target.value)}
                  placeholder="전체값"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">중에서</span>
                <input
                  type="number"
                  value={pct2Part}
                  onChange={(e) => setPct2Part(e.target.value)}
                  placeholder="일부값"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">은?</span>
              </div>

              {calcPercent2() !== null && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center transition-all">
                  <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    비율: <span className="text-base">{calcPercent2()?.toLocaleString(undefined, { maximumFractionDigits: 4 })}%</span>
                  </div>
                  <button
                    onClick={() => {
                      const resVal = `${calcPercent2()?.toFixed(4)}%`;
                      handleCopyText(resVal, 'pct2');
                      savePercentHistory(`${pct2Whole} 중 ${pct2Part}`, resVal);
                    }}
                    className={`p-1.5 rounded-lg ${copiedField === 'pct2' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer'}`}
                  >
                    {copiedField === 'pct2' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Increase or Decrease */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm" id="pct-card-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">공식 3</span>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">값 n% 증가 / 감소한 결과</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pct3Whole}
                  onChange={(e) => setPct3Whole(e.target.value)}
                  placeholder="값"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">에서</span>
                <input
                  type="number"
                  value={pct3Percent}
                  onChange={(e) => setPct3Percent(e.target.value)}
                  placeholder="비율"
                  className="w-1/4 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">%</span>
                <select
                  value={pct3Dir}
                  onChange={(e) => setPct3Dir(e.target.value as 'up' | 'down')}
                  className="px-2 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none rounded-lg text-xs font-bold cursor-pointer focus:outline-none"
                >
                  <option value="up">증가</option>
                  <option value="down">감소</option>
                </select>
              </div>

              {calcPercent3() !== null && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center transition-all">
                  <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    결과: <span className="text-base">{calcPercent3()?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                  </div>
                  <button
                    onClick={() => {
                      const resVal = calcPercent3()?.toString() || '';
                      handleCopyText(resVal, 'pct3');
                      savePercentHistory(`${pct3Whole}에서 ${pct3Percent}% ${pct3Dir === 'up' ? '증가' : '감소'}`, resVal);
                    }}
                    className={`p-1.5 rounded-lg ${copiedField === 'pct3' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer'}`}
                  >
                    {copiedField === 'pct3' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Change from A to B */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm" id="pct-card-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">공식 4</span>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">값 A가 값 B로 변할 때 증감률</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pct4From}
                  onChange={(e) => setPct4From(e.target.value)}
                  placeholder="값 A"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">이(가)</span>
                <input
                  type="number"
                  value={pct4To}
                  onChange={(e) => setPct4To(e.target.value)}
                  placeholder="값 B"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">로 변함</span>
              </div>

              {calcPercent4() !== null && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center transition-all">
                  <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    증감률:{' '}
                    <span className={`text-base ${(calcPercent4() || 0) >= 0 ? 'text-red-500 font-extrabold' : 'text-blue-500 font-extrabold'}`}>
                      {(calcPercent4() || 0) >= 0 ? '+' : ''}
                      {calcPercent4()?.toLocaleString(undefined, { maximumFractionDigits: 4 })}%
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const pctChange = calcPercent4();
                      const prefix = (pctChange || 0) >= 0 ? '+' : '';
                      const resVal = `${prefix}${pctChange?.toFixed(4)}%`;
                      handleCopyText(resVal, 'pct4');
                      savePercentHistory(`${pct4From} ➔ ${pct4To} 증감률`, resVal);
                    }}
                    className={`p-1.5 rounded-lg ${copiedField === 'pct4' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer'}`}
                  >
                    {copiedField === 'pct4' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6" id="salary-calc-panel">
          <div className="flex flex-col md:flex-row gap-6 md:divide-x md:divide-slate-100 md:dark:divide-slate-800">
            {/* Input fields form */}
            <div className="w-full md:w-1/2 space-y-4 pr-0 md:pr-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Calculator size={18} className="text-emerald-500" />
                  조건 설정
                </h3>
                {/* Salary switch annual/monthly */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setSalaryType('annual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      salaryType === 'annual'
                        ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    연봉 기준
                  </button>
                  <button
                    onClick={() => setSalaryType('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      salaryType === 'monthly'
                        ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    월급 기준
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between" htmlFor="salary-input-val">
                  <span>{salaryType === 'annual' ? '희망 연봉' : '희망 월급'}</span>
                  <span className="text-emerald-500">{(parseFloat(salaryAmount) || 0).toLocaleString()} 만원</span>
                </label>
                <div className="relative">
                  <input
                    id="salary-input-val"
                    type="number"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    placeholder="예: 4000"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">만원</span>
                </div>
              </div>

              {/* Non-taxable pay */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between" htmlFor="non-tax-val">
                  <span className="flex items-center gap-1">
                    비과세액 (월 기준)
                    <span className="group relative cursor-pointer" title="식대, 자가운전보조금 등 세금을 매기지 않는 항목 (보통 식대 20만원 한도)">
                      <Info size={12} className="text-slate-400" />
                    </span>
                  </span>
                  <span className="text-slate-400">{(parseFloat(nonTaxable) || 0).toLocaleString()} 만원</span>
                </label>
                <div className="relative">
                  <input
                    id="non-tax-val"
                    type="number"
                    value={nonTaxable}
                    onChange={(e) => setNonTaxable(e.target.value)}
                    placeholder="식대 등 (기본 20만)"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-bold font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">만원</span>
                </div>
              </div>

              {/* Personal exemptions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block" htmlFor="dependents-select">
                    부양가족 수 (본인 포함)
                  </label>
                  <select
                    id="dependents-select"
                    value={dependents}
                    onChange={(e) => setDependents(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} 명</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block" htmlFor="children-select">
                    20세 이하 자녀 수
                  </label>
                  <select
                    id="children-select"
                    value={children}
                    onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold cursor-pointer"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} 명</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30 rounded-xl">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  2024년 4대보험 요율(국민연금 4.5%, 건강보험 3.545%, 고용보험 0.9%) 및 근로소득 간이세액 공제 테이블을 대입한 대략적인 모의계산 결과입니다.
                </p>
              </div>
            </div>

            {/* Calculations Breakdown Output */}
            <div className="w-full md:w-1/2 md:pl-6 space-y-5 pt-4 md:pt-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">계산 및 공제 상세</h3>
              
              {/* Highlight Big Total Box */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-md space-y-1.5 relative overflow-hidden" id="net-pay-highlight">
                <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider block">예상 월 실수령액 (Net Pay)</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-extrabold tracking-tight">{formatKRW(breakdown.netPay)}</span>
                  <button
                    onClick={handleSaveSalaryToHistory}
                    className="bg-white/25 hover:bg-white/35 active:scale-95 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="기록 추가 및 복사"
                  >
                    {copiedField === 'salary-result' ? <Check size={12} /> : <Copy size={12} />}
                    <span>기록 및 복사</span>
                  </button>
                </div>
                <div className="text-[10px] text-emerald-100 flex justify-between items-center pt-2 border-t border-white/20">
                  <span>월 환산 급여: {formatKRW(breakdown.monthlySalary)}</span>
                  <span>비과세 제외 금액: {formatKRW(breakdown.taxableIncome)}</span>
                </div>
              </div>

              {/* Deductions details list */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <span>항목</span>
                  <span>금액 (월 기준)</span>
                </div>

                <div className="space-y-2 text-sm">
                  {/* National Pension */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      국민연금 <span className="text-[10px] text-slate-400 font-mono">4.5%</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatKRW(breakdown.nationalPension)}</span>
                  </div>

                  {/* Health Insurance */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      건강보험 <span className="text-[10px] text-slate-400 font-mono">3.545%</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatKRW(breakdown.healthInsurance)}</span>
                  </div>

                  {/* Long term Care */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      장기요양 <span className="text-[10px] text-slate-400 font-mono">12.95%</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatKRW(breakdown.longTermCare)}</span>
                  </div>

                  {/* Employment Insurance */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      고용보험 <span className="text-[10px] text-slate-400 font-mono">0.9%</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatKRW(breakdown.employmentInsurance)}</span>
                  </div>

                  {/* Income Tax */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">소득세 (간이세액)</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatKRW(breakdown.incomeTax)}</span>
                  </div>

                  {/* Local Income Tax */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">지방소득세 <span className="text-[10px] text-slate-400 font-mono">10%</span></span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatKRW(breakdown.localIncomeTax)}</span>
                  </div>
                </div>

                {/* Deductions Total */}
                <div className="flex justify-between items-center border-t border-dashed border-slate-100 dark:border-slate-800 pt-2.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>공제액 합계 (Total Deductions)</span>
                  <span className="font-mono text-red-500">{formatKRW(breakdown.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
