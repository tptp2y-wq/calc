/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 * [데이터 확장 방법 (How to Extend Data)]
 * ============================================================================
 * 이 애플리케이션은 '기준 단위(Base Unit) 아키텍처'를 채택하여 확장이 간편합니다.
 * 새로운 단위를 추가하고 싶다면 아래 절차를 따르십시오.
 *
 * 1. 카테고리 정의 확장:
 *    - CATEGORIES 배열에서 원하는 카테고리(예: 길이, 무게 등)의 'units' 배열에 새 객체를 추가합니다.
 *
 * 2. 단위 객체 포맷:
 *    - id: 영문 고유 식별자 (예: 'nm')
 *    - name: 사용자에게 표시될 이름 (예: '나노미터')
 *    - symbol: 단위 기호 (예: 'nm')
 *    - description: 단위에 대한 추가 설명 (SEO 및 UX 최적화용)
 * 
 * 3. 변환 공식 지정 (toBase, fromBase):
 *    - 일반 곱셈 변환 (예: 1 nm = 1e-9 m):
 *      toBase: 1e-9, fromBase: 1e9
 *    - 복잡한 공식 변환 (예: 온도):
 *      toBase: (val) => val * customFormula, 
 *      fromBase: (val) => val / customFormula
 *
 * 예시 (길이에 나노미터 추가):
 * {
 *   id: 'nm',
 *   name: '나노미터',
 *   symbol: 'nm',
 *   description: '10억분의 1 미터에 해당하는 미세 길이 단위',
 *   toBase: 1e-9,
 *   fromBase: 1e9
 * }
 * ============================================================================
 */

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  // 숫자 비율 또는 변환 함수
  toBase: number | ((val: number) => number);
  fromBase: number | ((val: number) => number);
}

export interface Category {
  id: string;
  name: string;
  symbol: string; // 카테고리 아이콘이나 기호
  baseUnit: string; // 기준 단위의 id
  units: Unit[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'unit' | 'percent' | 'salary' | 'advanced' | 'general';
  title: string;
  expression: string;
  result: string;
  categoryName?: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'length',
    name: '길이',
    symbol: '📏',
    baseUnit: 'm',
    units: [
      { id: 'mm', name: '밀리미터', symbol: 'mm', description: '1미터의 1,000분의 1', toBase: 0.001, fromBase: 1000 },
      { id: 'cm', name: '센티미터', symbol: 'cm', description: '1미터의 100분의 1', toBase: 0.01, fromBase: 100 },
      { id: 'm', name: '미터', symbol: 'm', description: '길이의 기본 국제 표준 단위', toBase: 1, fromBase: 1 },
      { id: 'km', name: '킬로미터', symbol: 'km', description: '1미터의 1,000배', toBase: 1000, fromBase: 0.001 },
      { id: 'inch', name: '인치', symbol: 'in', description: '야드파운드법 단위 (2.54 cm)', toBase: 0.0254, fromBase: 1 / 0.0254 },
      { id: 'ft', name: '피트', symbol: 'ft', description: '12인치에 해당하는 단위 (30.48 cm)', toBase: 0.3048, fromBase: 1 / 0.3048 },
      { id: 'yd', name: '야드', symbol: 'yd', description: '3피트에 해당하는 단위 (91.44 cm)', toBase: 0.9144, fromBase: 1 / 0.9144 },
      { id: 'mile', name: '마일', symbol: 'mi', description: '영미권 육상 거리 단위 (약 1.609 km)', toBase: 1609.344, fromBase: 1 / 1609.344 },
      { id: 'chook', name: '자 (척)', symbol: '자', description: '한국 전통 길이 단위 (약 30.3 cm)', toBase: 0.30303, fromBase: 1 / 0.30303 },
      { id: 'gan', name: '간 (間)', symbol: '간', description: '한국 전통 길이 단위, 6자에 해당 (약 1.818 m)', toBase: 1.81818, fromBase: 1 / 1.81818 }
    ]
  },
  {
    id: 'weight',
    name: '무게',
    symbol: '⚖️',
    baseUnit: 'g',
    units: [
      { id: 'mg', name: '밀리그램', symbol: 'mg', description: '1그램의 1,000분의 1', toBase: 0.001, fromBase: 1000 },
      { id: 'g', name: '그램', symbol: 'g', description: '무게의 기본 미터법 단위', toBase: 1, fromBase: 1 },
      { id: 'kg', name: '킬로그램', symbol: 'kg', description: '질량의 기본 국제 표준 단위 (1,000그램)', toBase: 1000, fromBase: 0.001 },
      { id: 't', name: '톤', symbol: 't', description: '1,000킬로그램에 해당하는 무게 단위', toBase: 1000000, fromBase: 0.000001 },
      { id: 'oz', name: '온스', symbol: 'oz', description: '야드파운드법 단위 (약 28.35 g)', toBase: 28.349523, fromBase: 1 / 28.349523 },
      { id: 'lb', name: '파운드', symbol: 'lb', description: '16온스에 해당하는 무게 단위 (약 453.6 g)', toBase: 453.59237, fromBase: 1 / 453.59237 },
      { id: 'don', name: '돈', symbol: '돈', description: '귀금속 무게 측정용 한국 전통 단위 (3.75 g)', toBase: 3.75, fromBase: 1 / 3.75 },
      { id: 'geun', name: '근 (肉근)', symbol: '근', description: '한국 전통 무게 단위, 고기 기준 (600 g)', toBase: 600, fromBase: 1 / 600 },
      { id: 'nyang', name: '냥', symbol: '냥', description: '한국 전통 무게 단위, 10돈에 해당 (37.5 g)', toBase: 37.5, fromBase: 1 / 37.5 }
    ]
  },
  {
    id: 'area',
    name: '넓이',
    symbol: '🗺️',
    baseUnit: 'm2',
    units: [
      { id: 'm2', name: '제곱미터', symbol: '㎡', description: '가로 세로 1미터인 사각형의 넓이', toBase: 1, fromBase: 1 },
      { id: 'km2', name: '제곱킬로미터', symbol: '㎢', description: '가로 세로 1킬로미터인 사각형의 넓이', toBase: 1e6, fromBase: 1e-6 },
      { id: 'ft2', name: '제곱피트', symbol: 'ft²', description: '가로 세로 1피트인 사각형의 넓이', toBase: 0.092903, fromBase: 1 / 0.092903 },
      { id: 'ac', name: '에이커', symbol: 'ac', description: '영미 면적 단위 (약 4,047 ㎡)', toBase: 4046.856, fromBase: 1 / 4046.856 },
      { id: 'pyeong', name: '평', symbol: '평', description: '한국 전통 면적 단위 (약 3.3058 ㎡)', toBase: 400 / 121, fromBase: 121 / 400 },
      { id: 'danbo', name: '단보', symbol: '단보', description: '한국 전통 넓이 단위, 300평에 해당 (약 991.74 ㎡)', toBase: 991.7355, fromBase: 1 / 991.7355 },
      { id: 'jeongbo', name: '정보', symbol: '정보', description: '한국 전통 넓이 단위, 3000평에 해당 (약 9917.4 ㎡)', toBase: 9917.355, fromBase: 1 / 9917.355 },
      { id: 'ha', name: '헥타르', symbol: 'ha', description: '10,000 제곱미터에 해당하는 넓이 단위', toBase: 10000, fromBase: 0.0001 }
    ]
  },
  {
    id: 'volume',
    name: '부피',
    symbol: '🧪',
    baseUnit: 'L',
    units: [
      { id: 'mL', name: '밀리리터', symbol: 'mL', description: '1리터의 1,000분의 1 (1 cc)', toBase: 0.001, fromBase: 1000 },
      { id: 'L', name: '리터', symbol: 'L', description: '부피의 기본 국제 표준 단위 (1,000 ㎤)', toBase: 1, fromBase: 1 },
      { id: 'gal', name: '갤런 (미국)', symbol: 'gal', description: '미국 액체 부피 단위 (약 3.785 L)', toBase: 3.785411, fromBase: 1 / 3.785411 },
      { id: 'bbl', name: '배럴 (석유)', symbol: 'bbl', description: '석유 거래용 부피 단위 (약 158.99 L)', toBase: 158.987, fromBase: 1 / 158.987 },
      { id: 'oz', name: '액량온스 (미국)', symbol: 'fl oz', description: '미국 액량 온스 (약 29.57 mL)', toBase: 0.029573, fromBase: 1 / 0.029573 },
      { id: 'cup', name: '컵 (미국)', symbol: 'cup', description: '미국 요리용 컵 계량 단위 (240 mL)', toBase: 0.24, fromBase: 1 / 0.24 },
      { id: 'hop', name: '홉 (홉)', symbol: '홉', description: '한국 전통 부피 단위 (약 180.39 mL)', toBase: 0.18039, fromBase: 1 / 0.18039 },
      { id: 'doe', name: '되 (승)', symbol: '되', description: '한국 전통 부피 단위, 10홉에 해당 (약 1.8 L)', toBase: 1.8039, fromBase: 1 / 1.8039 },
      { id: 'mal', name: '말 (두)', symbol: '말', description: '한국 전통 부피 단위, 10되에 해당 (약 18 L)', toBase: 18.039, fromBase: 1 / 18.039 }
    ]
  },
  {
    id: 'temperature',
    name: '온도',
    symbol: '🌡️',
    baseUnit: 'C',
    units: [
      {
        id: 'C',
        name: '섭씨',
        symbol: '°C',
        description: '물의 어는점을 0도, 끓는점을 100도로 지정한 온도 체계',
        toBase: (v) => v,
        fromBase: (v) => v
      },
      {
        id: 'F',
        name: '화씨',
        symbol: '°F',
        description: '물의 어는점을 32도, 끓는점을 212도로 지정한 온도 체계',
        toBase: (v) => (v - 32) * 5 / 9,
        fromBase: (v) => (v * 9 / 5) + 32
      },
      {
        id: 'K',
        name: '켈빈',
        symbol: 'K',
        description: '절대 영도를 0으로 설정하는 과학용 절대 온도 체계',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15
      }
    ]
  },
  {
    id: 'data',
    name: '데이터',
    symbol: '💾',
    baseUnit: 'B',
    units: [
      { id: 'bit', name: '비트', symbol: 'bit', description: '컴퓨터 데이터의 최소 단위 (0 또는 1)', toBase: 0.125, fromBase: 8 },
      { id: 'B', name: '바이트', symbol: 'B', description: '8비트에 해당하는 기본 데이터 저장 단위', toBase: 1, fromBase: 1 },
      { id: 'KB', name: '킬로바이트', symbol: 'KB', description: '1,024 바이트 (2^10 바이트)', toBase: 1024, fromBase: 1 / 1024 },
      { id: 'MB', name: '메가바이트', symbol: 'MB', description: '1,024 킬로바이트 (2^20 바이트)', toBase: 1024 * 1024, fromBase: 1 / (1024 * 1024) },
      { id: 'GB', name: '기가바이트', symbol: 'GB', description: '1,024 메가바이트 (2^30 바이트)', toBase: 1024 * 1024 * 1024, fromBase: 1 / (1024 * 1024 * 1024) },
      { id: 'TB', name: '테라바이트', symbol: 'TB', description: '1,024 기가바이트 (2^40 바이트)', toBase: 1024 * 1024 * 1024 * 1024, fromBase: 1 / (1024 * 1024 * 1024 * 1024) },
      { id: 'PB', name: '페타바이트', symbol: 'PB', description: '1,024 테라바이트 (2^50 바이트)', toBase: 1024 * 1024 * 1024 * 1024 * 1024, fromBase: 1 / (1024 * 1024 * 1024 * 1024 * 1024) }
    ]
  }
];

export function convertValue(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (isNaN(value)) return 0;
  
  // 1. Convert from source unit to Base Unit
  let baseVal: number;
  if (typeof fromUnit.toBase === 'function') {
    baseVal = fromUnit.toBase(value);
  } else {
    baseVal = value * fromUnit.toBase;
  }

  // 2. Convert from Base Unit to target unit
  let resultVal: number;
  if (typeof toUnit.fromBase === 'function') {
    resultVal = toUnit.fromBase(baseVal);
  } else {
    resultVal = baseVal * toUnit.fromBase;
  }

  return resultVal;
}
