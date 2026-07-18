/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CATEGORIES, Category, Unit, HistoryItem } from './types';
import UnitConverter from './components/UnitConverter';
import SpecialCalculator from './components/SpecialCalculator';
import AdvancedCalculator from './components/AdvancedCalculator';
import GeneralCalculator from './components/GeneralCalculator';
import HistoryList from './components/HistoryList';
import {
  Search,
  History as HistoryIcon,
  Calculator,
  ArrowRightLeft,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Percent,
  Briefcase,
  Sliders,
  Copy,
  Check,
  X,
  TrendingUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Main Navigation state
  // 'general' = 일반 계산기, 'unit' = 단위 변환, 'special' = 특수 계산기, 'advanced' = 고급 계산기
  const [activeMainTab, setActiveMainTab] = useState<'general' | 'unit' | 'special' | 'advanced'>('general');
  
  // States to pass down to trigger specific active sub-views from search
  const [selectedUnitCategory, setSelectedUnitCategory] = useState<string>('length');
  
  // History list state loaded from localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('universal_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Theme states: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('universal_calc_theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });

  // Search query state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Sync theme to document body classes
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    handleThemeChange();
    localStorage.setItem('universal_calc_theme', theme);

    // Listen for system theme change if system is selected
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', handleThemeChange);
      return () => media.removeEventListener('change', handleThemeChange);
    }
  }, [theme]);

  // Persist history to localStorage
  const handleAddHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    
    setHistory((prev) => {
      // Prevent duplicates in history for identical expressions
      const filtered = prev.filter(p => !(p.expression === item.expression && p.result === item.result));
      const updated = [newItem, ...filtered].slice(0, 50); // limit to last 50 entries
      localStorage.setItem('universal_calc_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('universal_calc_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm('모든 계산 기록을 완전히 삭제하시겠습니까?')) {
      setHistory([]);
      localStorage.removeItem('universal_calc_history');
    }
  };

  // Compile Search Index
  const getSearchIndex = () => {
    const index: {
      type: 'general' | 'unit' | 'special' | 'advanced';
      title: string;
      subtitle: string;
      targetId: string; // category id, sub-tab name etc
      keywords: string[];
    }[] = [];

    // 0. General calculator index
    index.push({
      type: 'general',
      title: '🧮 일반 계산기',
      subtitle: '덧셈, 뺄셈, 곱셈, 나눗셈, 백분율 등 표준 사칙연산 계산기',
      targetId: 'general',
      keywords: ['계산기', '사칙연산', '일반계산기', '표준계산기', '산수', '더하기', '빼기', '곱하기', '나누기', 'calculator']
    });

    // 1. Units index
    CATEGORIES.forEach((cat) => {
      // Add category itself
      index.push({
        type: 'unit',
        title: `${cat.symbol} ${cat.name} 변환기`,
        subtitle: `길이, 무게 등 ${cat.name} 단위를 실시간으로 교차 변환`,
        targetId: cat.id,
        keywords: [cat.name, cat.id, '단위', '변환', cat.symbol]
      });

      // Add each unit
      cat.units.forEach((unit) => {
        index.push({
          type: 'unit',
          title: `${cat.symbol} ${unit.name} (${unit.symbol}) 변환`,
          subtitle: `${cat.name} 카테고리의 대표 단위 변환`,
          targetId: cat.id,
          keywords: [unit.name, unit.symbol, cat.name, unit.id, '단위', '변환']
        });
      });
    });

    // 2. Special calculators index
    index.push({
      type: 'special',
      title: '📊 퍼센트 계산기',
      subtitle: '전체의 n%, 일부 비율, 증감률, 값 변동량 계산',
      targetId: 'percent',
      keywords: ['퍼센트', '백분율', '할인', '비율', '증가율', '감소율', '퍼센트계산', '프로', '프로센트', 'percent']
    });
    index.push({
      type: 'special',
      title: '💼 연봉 실수령액 계산기',
      subtitle: '4대보험 공제 및 근로소득 간이소득세 반영 월 실수령액 모의계산',
      targetId: 'salary',
      keywords: ['연봉', '월급', '실수령액', '공제', '세금', '소득세', '4대보험', '국민연금', '건강보험', '고용보험', 'salary', 'pay']
    });

    // 3. Advanced calculators index
    index.push({
      type: 'advanced',
      title: '📐 일차방정식 계산기',
      subtitle: 'ax + b = c 형태의 선형 일차 방정식 풀이 및 단계별 해설',
      targetId: 'linear',
      keywords: ['일차방정식', '방정식', '일차', '수학', '해 공식', 'linear', 'equation']
    });
    index.push({
      type: 'advanced',
      title: '📐 이차방정식 계산기',
      subtitle: 'ax² + bx + c = 0 판별식 및 근의 공식을 활용한 단계별 실근/허근 풀이',
      targetId: 'quadratic',
      keywords: ['이차방정식', '방정식', '이차', '근의공식', '판별식', '허근', '실근', '수학', 'quadratic']
    });
    index.push({
      type: 'advanced',
      title: '📐 최대공약수 / 최소공배수 계산기',
      subtitle: '복수 정수의 최대공약수(GCD) 및 최소공배수(LCM) 순차 흐름 해설',
      targetId: 'gcdlcm',
      keywords: ['최대공약수', '최소공배수', '공약수', '공배수', 'gcd', 'lcm', '수학']
    });
    index.push({
      type: 'advanced',
      title: '📐 공학용 수식 계산기',
      subtitle: '사칙연산 괄호 및 삼각함수, 제곱근, 거듭제곱, 자연로그 계산',
      targetId: 'expression',
      keywords: ['수식', '공학용', '계산기', '함수', '사인', '코사인', '루트', '로그', 'expression', 'math']
    });

    return index;
  };

  // Run Search match
  const searchResults = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().replace(/\s+/g, '');
    const index = getSearchIndex();

    return index.filter((item) => {
      return item.keywords.some(k => k.toLowerCase().includes(q)) || 
             item.title.toLowerCase().includes(q) || 
             item.subtitle.toLowerCase().includes(q);
    });
  };

  const handleSearchResultClick = (result: any) => {
    setActiveMainTab(result.type);
    if (result.type === 'unit') {
      setSelectedUnitCategory(result.targetId);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-300">
      
      {/* Top Header & Search Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand Logo Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/10 text-white text-xl">
                🧮
              </span>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                  만능 단위변환기 & 계산기
                  <span className="text-[10px] bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-extrabold px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900/30">
                    Pro
                  </span>
                </h1>
                <p className="text-[10.5px] text-slate-400 mt-1 dark:text-slate-500">
                  일반 사칙연산, 퍼센트, 2026 연봉 실수령액, 평수 환산, 공학용 수식과 방정식 풀이
                </p>
              </div>
            </div>

            {/* Mobile-only theme toggles or actions can go here */}
          </div>

          {/* Real-time Search and Theme Controllers */}
          <div className="flex items-center gap-3 flex-1 md:max-w-lg md:justify-end">
            
            {/* Search inputs */}
            <div className="relative flex-1 max-w-sm">
              <div className="relative">
                <input
                  type="text"
                  placeholder="단위 이름이나 도구를 검색해 보세요... (예: 평, 근, 소득세)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-medium rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Dynamic Search result dropdown dropdown */}
              <AnimatePresence>
                {showSearchResults && searchQuery.trim() && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSearchResults(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto overflow-x-hidden p-2"
                    >
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 mb-1 border-b border-slate-50 dark:border-slate-800">
                        검색 결과 ({searchResults().length}개)
                      </div>
                      {searchResults().length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                          검색어와 일치하는 단위나 도구가 없습니다.
                        </div>
                      ) : (
                        searchResults().map((result, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                {result.title}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[280px]">
                                {result.subtitle}
                              </span>
                            </div>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 capitalize">
                              {result.type === 'general' ? '일반' : result.type === 'unit' ? '단위' : result.type === 'special' ? '특수' : '고급수학'}
                            </span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Controller Buttons */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0" id="theme-selector-group">
              {[
                { id: 'light', icon: <Sun size={13} />, label: '라이트' },
                { id: 'dark', icon: <Moon size={13} />, label: '다크' },
                { id: 'system', icon: <Monitor size={13} />, label: '시스템' }
              ].map((t) => (
                <button
                  key={t.id}
                  id={`theme-btn-${t.id}`}
                  onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    theme === t.id
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title={`${t.label} 모드`}
                >
                  {t.icon}
                </button>
              ))}
            </div>

          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Navigation Sidebar (Bento Grid Style) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
              메뉴 네비게이션
            </span>

            {/* Main Tabs List (Big touch friendly buttons for mobile) */}
            <nav className="space-y-1 flex flex-col" id="main-navigation-sidebar">
              <button
                onClick={() => setActiveMainTab('general')}
                id="main-nav-general"
                className={`flex items-center justify-between w-full p-3 rounded-xl transition-all font-medium text-sm cursor-pointer ${
                  activeMainTab === 'general'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🧮</span>
                  <span>일반 계산기</span>
                </div>
                <Calculator size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => setActiveMainTab('unit')}
                id="main-nav-unit"
                className={`flex items-center justify-between w-full p-3 rounded-xl transition-all font-medium text-sm cursor-pointer ${
                  activeMainTab === 'unit'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100/60 dark:border-sky-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📏</span>
                  <span>단위 변환기</span>
                </div>
                <ArrowRightLeft size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => setActiveMainTab('special')}
                id="main-nav-special"
                className={`flex items-center justify-between w-full p-3 rounded-xl transition-all font-medium text-sm cursor-pointer ${
                  activeMainTab === 'special'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📊</span>
                  <span>특수 계산기</span>
                </div>
                <Percent size={14} className="text-slate-400" />
              </button>

              <button
                onClick={() => setActiveMainTab('advanced')}
                id="main-nav-advanced"
                className={`flex items-center justify-between w-full p-3 rounded-xl transition-all font-medium text-sm cursor-pointer ${
                  activeMainTab === 'advanced'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📐</span>
                  <span>고급 수학 계산기</span>
                </div>
                <Sliders size={14} className="text-slate-400" />
              </button>
            </nav>
          </div>

          {/* Quick tips card */}
          <div className="hidden lg:block bg-gradient-to-tr from-indigo-50 to-sky-50 dark:from-slate-900 dark:to-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles size={14} /> 스마트 팁 (Quick Tips)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              모든 단위 카드는 클릭하면 그 즉시 클립보드에 해당 값이 기호와 함께 복사되며, 동시에 최근기록(History)에 저장되어 언제든 다시 확인할 수 있습니다.
            </p>
          </div>
        </aside>

        {/* Right Side: Primary calculation workspace */}
        <section className="lg:col-span-9 space-y-6" id="primary-calculation-workspace">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMainTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeMainTab === 'general' && (
                <GeneralCalculator 
                  onAddHistory={handleAddHistory} 
                />
              )}
              {activeMainTab === 'unit' && (
                <UnitConverter 
                  initialCategoryId={selectedUnitCategory} 
                  onAddHistory={handleAddHistory} 
                />
              )}
              {activeMainTab === 'special' && (
                <SpecialCalculator 
                  onAddHistory={handleAddHistory} 
                />
              )}
              {activeMainTab === 'advanced' && (
                <AdvancedCalculator 
                  onAddHistory={handleAddHistory} 
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* History Panel (Persistent) */}
          <HistoryList
            history={history}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearHistory}
          />

        </section>
      </main>

      {/* SEO Optimized Structured Footer (Korean details for search indexing) */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 transition-colors mt-12 py-10">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          
          {/* SEO Text Explanations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed" id="seo-rich-footer-content">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1.5">
                <ArrowRightLeft size={15} className="text-sky-500" />
                단위 변환 및 기준 단위 아키텍처
              </h3>
              <p>
                본 만능 단위 변환기는 소수점 반올림 오차 및 계산 비효율성을 해소하기 위해 <strong>기준 단위(Base-Unit) 설계 아키텍처</strong>를 바탕으로 구성되었습니다. 모든 수치는 입력 즉시 해당 카테고리의 <u>국제 표준 기준 단위(m, g, ㎡, L, °C, B)</u>로 환산된 후, 최종 목적 단위로 다이렉트 변환됩니다.
              </p>
              <p>
                한국 특화 단위인 <strong>평수 계산기</strong>(1평 ≈ 3.30578 ㎡), 전통 금 무게 단위인 <strong>돈/냥</strong>, 정육 거래의 기준이 되는 <strong>근</strong> 단위를 완벽히 지원하며, 고유 단위 해설을 함께 제공하여 편의성을 크게 높였습니다.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1.5">
                <Percent size={15} className="text-emerald-500" />
                퍼센트 및 한국형 연봉 실수령액 계산
              </h3>
              <p>
                일반 재무 설계와 쇼핑 할인율 계산 시 유용한 <strong>퍼센트 계산기</strong>는 전체 비중 분석, 가치 증가/감소폭 분석, 값의 전후 대비 등 4대 필수 공식을 직관적으로 제공합니다.
              </p>
              <p>
                <strong>연봉 실수령액 계산기</strong>는 2024년 국민건강보험공단 요율인 <u>국민연금 4.5%, 건강보험 3.545%, 장기요양 12.95%, 고용보험 0.9%</u> 요율을 대입하여 월급 및 연봉에서 자동으로 사전 공제합니다. 또한 근로소득 간이세액 공제 기본 테이블의 다자녀 가구 공제 인적 요소를 대입해 대한민국 직장인을 위한 매우 직관적인 모의계산 내역을 보여줍니다.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1.5">
                <Calculator size={15} className="text-indigo-500" />
                수학 공식 및 방정식 단계별 해결사
              </h3>
              <p>
                일반 공학 및 학업에 최적화된 <strong>이차방정식 해결사</strong>는 판별식(D = b² - 4ac) 상태를 실시간 체크하여 근의 공식에 대입되는 중간 연산 과정을 투명하게 출력합니다. 이로써 <u>실근과 허근</u>을 빠르고 상세히 추적합니다.
              </p>
              <p>
                두 개 이상의 정수들의 <strong>최대공약수(GCD)</strong>와 <strong>최소공배수(LCM)</strong> 계산 역시 유클리드 호제법 순차 계산 방식을 적용하여 단계적으로 논리적 진행 과정을 습득할 수 있는 교육용 보조 기능까지 수행합니다.
              </p>
            </div>
          </div>

          {/* Sub Bottom Banner */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              © 2026 만능 단위 변환 및 계산기 Pro. All rights reserved. 본 서비스는 개인 정보 보호를 위해 어떠한 데이터도 외부 서버에 전송하지 않으며, 오직 클라이언트 브라우저의 로컬 스토리지에만 기록을 안전하게 보관합니다.
            </div>
            <div className="flex justify-center gap-3 text-[10px] text-sky-500">
              <span>#길이변환 #평수계산기 #연봉실수령액 #퍼센트계산기 #이차방정식 #공약수공배수</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
