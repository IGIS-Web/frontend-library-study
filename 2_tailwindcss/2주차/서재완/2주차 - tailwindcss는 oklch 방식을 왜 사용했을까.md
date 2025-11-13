# Tailwind CSS가 OKLCH 색상을 사용하는 이유

## 개요

Tailwind CSS v4부터 전체 기본 색상 팔레트가 RGB에서 **OKLCH**로 변경되었습니다.

```typescript
// packages/tailwindcss/src/compat/colors.ts
export default {
    rose: {
        "50": "oklch(97.7% 0.017 320.058)",
        "100": "oklch(95.2% 0.037 318.852)",
        "200": "oklch(90.3% 0.076 319.62)",
        "300": "oklch(83.3% 0.145 321.434)",
        "400": "oklch(74% 0.238 322.16)",
        "500": "oklch(66.7% 0.295 322.15)",
        "600": "oklch(59.1% 0.293 322.896)",
        "700": "oklch(51.8% 0.253 323.949)",
        "800": "oklch(45.2% 0.211 324.591)",
        "900": "oklch(40.1% 0.17 325.612)",
        "950": "oklch(29.3% 0.136 325.661)"
    }
};
```

---

## OKLCH란?

### OKLCH의 구조

```
oklch(L% C H)

L (Lightness)   : 밝기 (0% = 검정, 100% = 흰색)
C (Chroma)      : 채도 (0 = 무채색, 높을수록 선명)
H (Hue)         : 색상 각도 (0-360도)
```

### 예시 분석

```typescript
'500': 'oklch(66.7% 0.295 322.15)'

66.7%  → 밝기 66.7% (중간 정도 밝음)
0.295  → 채도 0.295 (꽤 선명한 색)
322.15 → 색상 322도 (핑크/장미색)
```

---

## 왜 OKLCH를 사용하는가?

### 1. 인간의 시각과 일치하는 지각적 균일성 (Perceptual Uniformity)

#### 문제: RGB/HEX의 한계

```css
/* RGB: 숫자가 같아도 밝기가 다르게 보임 */
.color-1 {
    color: rgb(0, 128, 0);
} /* 초록: 어둡게 보임 */
.color-2 {
    color: rgb(128, 0, 0);
} /* 빨강: 더 어둡게 보임 */
.color-3 {
    color: rgb(0, 0, 128);
} /* 파랑: 가장 어둡게 보임 */

/* 같은 128 값인데 실제로는 밝기가 다름! */
```

#### 해결: OKLCH의 지각적 균일성

```css
/* OKLCH: 밝기가 50%면 실제로 50%로 보임 */
.color-1 {
    color: oklch(50% 0.15 120);
} /* 초록: 정확히 50% 밝기 */
.color-2 {
    color: oklch(50% 0.15 30);
} /* 빨강: 정확히 50% 밝기 */
.color-3 {
    color: oklch(50% 0.15 240);
} /* 파랑: 정확히 50% 밝기 */

/* 모두 동일하게 50% 밝기로 보임! */
```

**실제 Tailwind 예시:**

```typescript
// 모든 500 레벨 색상은 거의 동일한 밝기(L 값)를 가짐
red:   { '500': 'oklch(63.7% 0.237 25.331)' },   // L: 63.7%
blue:  { '500': 'oklch(60.5% 0.228 252.328)' },  // L: 60.5%
green: { '500': 'oklch(71.6% 0.177 145.589)' },  // L: 71.6%
rose:  { '500': 'oklch(66.7% 0.295 322.15)' },   // L: 66.7%

// → 유사한 L 값으로 일관된 밝기 제공
```

---

### 2. 더 넓은 색상 범위 (Wider Color Gamut)

#### RGB(sRGB)의 한계

```
sRGB 색상 공간은 인간이 볼 수 있는 색상의 약 35%만 표현 가능

┌─────────────────────────────────────────┐
│ sRGB (RGB/HEX)                          │
│ ┌─────────────────┐                     │
│ │ 표현 가능한 색상 │ (~35% of visible)  │
│ └─────────────────┘                     │
│                                         │
│ Display P3 (OKLCH 지원)                 │
│ ┌───────────────────────────┐           │
│ │ 표현 가능한 색상          │ (~50%)    │
│ │ + 더 선명한 빨강, 초록    │           │
│ └───────────────────────────┘           │
└─────────────────────────────────────────┘
```

#### OKLCH의 이점

```css
/* RGB로는 표현 불가능한 선명한 색상 */
.ultra-vivid-cyan {
    /* sRGB 한계: rgb(0, 255, 255) */
    background: rgb(0, 255, 255);

    /* OKLCH로 더 선명하게: Display P3 지원 */
    background: oklch(90% 0.4 195);
    /* → 최신 디스플레이에서 훨씬 더 선명한 시안 */
}
```

**Tailwind v4 실제 색상:**

```typescript
// 더 선명한 색상 표현 가능
cyan: {
  '400': 'oklch(78.9% 0.154 211.53)',  // 높은 Chroma(0.154) = 더 선명
  '500': 'oklch(71.5% 0.143 215.221)', // sRGB보다 넓은 범위
}

// 디스플레이 P3를 지원하는 기기에서 자동으로 더 선명하게 표시됨
```

---

### 3. 자연스러운 그라디언트 (Better Gradients)

#### 문제: RGB 그라디언트의 이상한 중간색

```css
/* RGB 그라디언트: 중간에 회색/탁한 색이 나타남 */
.gradient-rgb {
    background: linear-gradient(to right, rgb(255, 0, 0), /* 빨강 */ rgb(0, 0, 255) /* 파랑 */);
    /* 중간: 회색빛 보라색 (탁함) */
}
```

#### 해결: OKLCH 그라디언트

```css
/* OKLCH 그라디언트: 자연스러운 중간색 */
.gradient-oklch {
    background: linear-gradient(in oklch to right, oklch(60% 0.25 30), /* 빨강 */ oklch(60% 0.25 270) /* 파랑 */);
    /* 중간: 선명한 마젠타/보라색 */
}
```

**Tailwind v4 그라디언트:**

```html
<!-- v4: OKLCH로 더 선명한 그라디언트 -->
<div class="bg-gradient-to-r from-red-500 to-blue-500">
    <!-- oklch(63.7% 0.237 25.331) → oklch(60.5% 0.228 252.328) -->
    <!-- 중간색이 훨씬 선명함! -->
</div>
```

---

### 4. 인간이 읽을 수 있는 형식 (Human Readable)

#### RGB/HEX vs OKLCH

```css
/* ❌ HEX: 무슨 색인지 알 수 없음 */
.color-1 {
    color: #ca5050;
} /* ??? */
.color-2 {
    color: #50ca50;
} /* ??? */

/* ❌ RGB: 여전히 직관적이지 않음 */
.color-3 {
    color: rgb(202, 80, 80);
} /* 빨강...인가? */

/* ✅ OKLCH: 한눈에 파악 가능 */
.color-4 {
    color: oklch(60% 0.15 30);
    /*
    60% = 중간 밝기
    0.15 = 중간 채도
    30 = 빨강-오렌지 계열 (0-30도)
  */
}

.color-5 {
    color: oklch(60% 0.15 120);
    /*
    60% = 동일한 밝기
    0.15 = 동일한 채도
    120 = 초록 계열 (120도)
  */
}
```

**Hue(색상) 각도 참고:**

```
0°   = 빨강
30°  = 주황
60°  = 노랑
120° = 초록
180° = 시안
240° = 파랑
270° = 자주
300° = 마젠타
360° = 빨강 (다시 처음)
```

---

### 5. 일관된 색상 스케일 생성 (Consistent Color Scales)

#### RGB로 스케일 만들기의 어려움

```javascript
// ❌ RGB: 밝기를 예측하기 어려움
const scale = [
    "rgb(255, 200, 200)", // 연한 빨강
    "rgb(200, 150, 150)", // 중간 빨강...?
    "rgb(150, 100, 100)", // 어두운 빨강...?
    "rgb(100, 50, 50)" // 더 어두운 빨강...?
];
// → 밝기가 일정하게 줄어드는지 알 수 없음
```

#### OKLCH로 스케일 만들기

```javascript
// ✅ OKLCH: 수학적으로 정확한 스케일
const scale = [
    "oklch(90% 0.15 30)", // L: 90%
    "oklch(70% 0.15 30)", // L: 70% (-20%)
    "oklch(50% 0.15 30)", // L: 50% (-20%)
    "oklch(30% 0.15 30)" // L: 30% (-20%)
];
// → 밝기가 정확히 20%씩 감소
// → 채도(0.15)와 색상(30)은 동일 유지
```

**Tailwind 실제 스케일:**

```typescript
red: {
  '50':  'oklch(97.1% 0.013 17.38)',   // 가장 밝음: 97.1%
  '100': 'oklch(93.6% 0.032 17.717)',  // 93.6%
  '200': 'oklch(88.5% 0.062 18.334)',  // 88.5%
  '300': 'oklch(80.8% 0.114 19.571)',  // 80.8%
  '400': 'oklch(70.4% 0.191 22.216)',  // 70.4%
  '500': 'oklch(63.7% 0.237 25.331)',  // 63.7% (기본)
  '600': 'oklch(57.7% 0.245 27.325)',  // 57.7%
  '700': 'oklch(50.5% 0.213 27.518)',  // 50.5%
  '800': 'oklch(44.4% 0.177 26.899)',  // 44.4%
  '900': 'oklch(39.6% 0.141 25.723)',  // 39.6%
  '950': 'oklch(25.8% 0.092 26.042)',  // 가장 어두움: 25.8%
}
// 밝기(L)가 일관되게 감소
// 채도(C)와 색상(H)도 세밀하게 조정됨
```

---

### 6. 접근성 개선 (Better Accessibility)

#### 예측 가능한 명도 대비

```css
/* RGB: 대비율 계산이 복잡함 */
.text-rgb {
    color: rgb(200, 50, 50);
    background: rgb(250, 250, 250);
    /* 대비율 예측 어려움 */
}

/* OKLCH: 밝기 차이로 대비율 예측 가능 */
.text-oklch {
    color: oklch(50% 0.15 30); /* L: 50% */
    background: oklch(95% 0.02 30); /* L: 95% */
    /* 밝기 차이: 45% → 높은 대비 보장 */
}
```

**Tailwind 색상 조합 예시:**

```html
<!-- WCAG AA 준수가 더 쉬움 -->
<div class="bg-slate-50 text-slate-900">
    <!-- bg:  oklch(98.4% 0.003 247.858) → L: 98.4% -->
    <!-- text: oklch(20.8% 0.042 265.755) → L: 20.8% -->
    <!-- 밝기 차이: 77.6% → 충분한 대비 -->
</div>
```

---

### 7. 색상 조작의 용이성 (Easy Color Manipulation)

#### 밝기만 조정

```css
/* RGB: 모든 채널을 조정해야 함 */
:root {
    --red-500: rgb(200, 50, 50);
    --red-400: rgb(???, ???, ???); /* 계산 복잡 */
}

/* OKLCH: 첫 번째 값만 변경 */
:root {
    --red-500: oklch(60% 0.2 30);
    --red-400: oklch(70% 0.2 30); /* L만 변경 */
    --red-300: oklch(80% 0.2 30); /* L만 변경 */
}
```

#### 채도만 조정

```css
/* OKLCH: 두 번째 값만 변경 */
:root {
    --color-vivid: oklch(60% 0.25 30); /* 선명 */
    --color-medium: oklch(60% 0.15 30); /* 중간 */
    --color-muted: oklch(60% 0.05 30); /* 탁함 */
}
```

#### 색상만 회전

```css
/* OKLCH: 세 번째 값만 변경 */
:root {
    --hue-red: oklch(60% 0.2 30); /* 빨강 */
    --hue-orange: oklch(60% 0.2 60); /* 주황 (+30도) */
    --hue-yellow: oklch(60% 0.2 90); /* 노랑 (+60도) */
    --hue-green: oklch(60% 0.2 120); /* 초록 (+90도) */
}
```

**실전 활용:**

```css
/* 다크 모드: 밝기만 조정 */
:root {
    --primary: oklch(60% 0.2 250);
}

@media (prefers-color-scheme: dark) {
    :root {
        --primary: oklch(70% 0.2 250); /* 밝기만 10% 증가 */
    }
}
```

---

## 브라우저 지원

### 현재 지원 상황 (2025년 기준)

```
✅ Chrome 111+ (2023년 3월)
✅ Edge 111+ (2023년 3월)
✅ Safari 15.4+ (2022년 3월)
✅ Firefox 113+ (2023년 5월)
✅ iOS Safari 15.4+
✅ Android Chrome 111+
```

**글로벌 지원률: ~95%+** (Can I Use 기준)

### Tailwind의 폴백 처리

Tailwind v4는 OKLCH를 사용하되, 필요시 폴백을 자동 생성합니다:

```typescript
// packages/tailwindcss/src/ast.ts:405-409
// Create fallback values for usages of the `color-mix(…)` function that reference variables
// found in the theme config.
if (polyfills & Polyfills.ColorMix && node.value.includes("color-mix(")) {
    colorMixDeclarations.get(parent).add(node);
}
```

**생성되는 CSS:**

```css
/* 최신 브라우저용 */
.bg-rose-500 {
    background-color: oklch(66.7% 0.295 322.15);
}

/* 구형 브라우저용 폴백 (자동 생성) */
@supports not (color: oklch(0% 0 0)) {
    .bg-rose-500 {
        background-color: rgb(244, 63, 94); /* RGB 폴백 */
    }
}
```

---

## RGB vs OKLCH 비교표

| 특징              | RGB/HEX                         | OKLCH                         |
| ----------------- | ------------------------------- | ----------------------------- |
| **지각적 균일성** | ❌ 같은 숫자 차이가 다르게 보임 | ✅ 수학적으로 지각과 일치     |
| **색상 범위**     | sRGB (~35% of visible)          | Display P3+ (~50%+)           |
| **그라디언트**    | 중간에 탁한 색 발생             | 자연스럽고 선명함             |
| **가독성**        | ❌ `#ca5050` (?)                | ✅ `oklch(60% 0.2 30)` (명확) |
| **색상 조작**     | 복잡 (3채널 동시 조정)          | 간단 (독립적 조정)            |
| **접근성**        | 대비율 계산 복잡                | 밝기로 쉽게 예측              |
| **일관된 스케일** | 어려움                          | 쉬움 (L값만 조정)             |
| **브라우저 지원** | 100%                            | ~95% (폴백 가능)              |

---

## 실제 사용 예시

### 1. 기본 색상 사용

```html
<!-- Tailwind v4 -->
<div class="bg-rose-500 text-white">
    <!-- oklch(66.7% 0.295 322.15) 자동 적용 -->
    Hello OKLCH!
</div>
```

### 2. 커스텀 OKLCH 색상

```css
@theme {
    --color-brand: oklch(65% 0.25 340);
}
```

```html
<div class="bg-brand">Custom OKLCH Color</div>
```

### 3. 임의 값으로 OKLCH 사용

```html
<div class="bg-[oklch(70%_0.2_150)]">Arbitrary OKLCH Value</div>
```

### 4. 그라디언트

```html
<!-- OKLCH 색상으로 더 선명한 그라디언트 -->
<div class="bg-gradient-to-r from-purple-500 to-pink-500">Beautiful Gradient</div>
```

### 5. 다크 모드

```css
@theme {
    --color-primary: oklch(60% 0.2 250);
}

@media (prefers-color-scheme: dark) {
    @theme {
        --color-primary: oklch(75% 0.18 250); /* 밝기↑, 채도↓ */
    }
}
```

---

## 마이그레이션 가이드

### v3 (RGB) → v4 (OKLCH)

```javascript
// Tailwind v3 (RGB)
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',  // HEX
      }
    }
  }
}

// Tailwind v4 (OKLCH)
@theme {
  --color-primary: oklch(61% 0.22 252);
}
```

### HEX → OKLCH 변환 도구

온라인 도구:

-   https://oklch.com/
-   https://colorjs.io/apps/convert/

예시:

```
#3b82f6 → oklch(61% 0.22 252)
#ef4444 → oklch(64% 0.24 25)
#10b981 → oklch(70% 0.17 162)
```

---

## 핵심 정리

### OKLCH를 사용하는 7가지 이유

1. **👁️ 지각적 균일성**: 숫자가 인간의 시각과 일치
2. **🎨 더 넓은 색상**: sRGB를 넘어서는 선명한 색상
3. **🌈 아름다운 그라디언트**: 중간색이 자연스러움
4. **📖 읽기 쉬움**: `oklch(60% 0.2 30)` - 한눈에 파악
5. **🎯 일관된 스케일**: 수학적으로 정확한 색상 팔레트
6. **♿ 접근성**: 밝기로 대비율을 쉽게 예측
7. **🔧 쉬운 조작**: 각 속성을 독립적으로 조정

### Tailwind v4의 선택

```typescript
// packages/tailwindcss/src/compat/colors.ts
export default {
    // 모든 색상이 OKLCH로 정의됨
    rose: {"500": "oklch(66.7% 0.295 322.15)"}
    // → 더 선명하고, 일관되고, 접근성 높은 색상
};
```

**결론: OKLCH는 현대 웹의 표준이 되고 있으며, Tailwind CSS는 이를 선도하고 있습니다.** 🚀

---

## 추가 자료

-   **OKLCH 상세 설명**: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
-   **색상 변환 도구**: https://oklch.com/
-   **Tailwind v4 공식 블로그**: https://tailwindcss.com/blog/tailwindcss-v4
-   **Can I Use (브라우저 지원)**: https://caniuse.com/mdn-css_types_color_oklch
-   **Better dynamic themes in Tailwind with OKLCH**: https://evilmartians.com/chronicles/better-dynamic-themes-in-tailwind-with-oklch-color-magic
