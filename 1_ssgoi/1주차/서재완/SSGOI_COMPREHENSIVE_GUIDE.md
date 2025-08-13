# SSGOI 라이브러리 종합 정보 가이드

## 목차

1. [SSGOI 개요](#ssgoi-개요)
2. [주요 특징](#주요-특징)
3. [지원 프레임워크](#지원-프레임워크)
4. [설치 및 기본 사용법](#설치-및-기본-사용법)
5. [프레임워크별 구현](#프레임워크별-구현)
6. [전환 효과 종류](#전환-효과-종류)
7. [고급 기능](#고급-기능)
8. [API 레퍼런스](#api-레퍼런스)
9. [성능 및 최적화](#성능-및-최적화)
10. [실전 예제](#실전-예제)
11. [트러블슈팅](#트러블슈팅)

---

## SSGOI 개요

**SSGOI**(Smooth Seamless Go-In-out)는 웹 애플리케이션에 네이티브 앱 수준의 페이지 전환 애니메이션을 제공하는 프레임워크 독립적인 라이브러리입니다.

### 📋 기본 정보

- **저장소**: https://github.com/meursyphus/ssgoi
- **작성자**: meursyphus (문대승)
- **라이선스**: MIT
- **언어**: TypeScript
- **패키지 관리**: pnpm 워크스페이스

### 🎯 라이브러리 목적

- 웹에서 네이티브 앱 같은 부드러운 페이지 전환 구현
- 기존 라우팅 시스템 변경 없이 애니메이션 추가
- 프레임워크에 관계없이 일관된 사용 경험 제공
- SSR 환경에서도 안정적인 동작 보장

---

## 주요 특징

### ✨ 핵심 장점

1. **🌍 브라우저 호환성**
    - 모든 모던 브라우저 지원 (Chrome, Firefox, Safari, Edge)
    - View Transition API 의존성 없음
    - IE 11+ 지원 가능

2. **🚀 SSR 친화적**
    - Next.js App Router 완벽 지원
    - 하이드레이션 이슈 없음
    - SEO 친화적 구현

3. **🎯 기존 라우터 유지**
    - React Router, Next.js, SvelteKit, Vue Router와 완벽 호환
    - 라우팅 로직 변경 불필요
    - 점진적 적용 가능

4. **💾 상태 유지**
    - 브라우저 뒤로/앞으로 버튼 지원
    - 스크롤 위치 자동 저장/복원
    - 애니메이션 상태 영속성

5. **⚛️ 프레임워크 최적화**
    - React Hooks와 모던 패턴 활용
    - Svelte의 transition 디렉티브 호환
    - Vue 3 Composition API 지원

### 🔧 기술적 특징

- **물리 기반 애니메이션**: Popmotion 스프링 엔진 사용
- **메모리 안전성**: 자동 리소스 정리 및 가비지 컬렉션
- **타입 안전성**: 완전한 TypeScript 지원
- **트리 쉐이킹**: 사용하지 않는 코드 자동 제거
- **경량화**: 압축 후 ~15KB (gzipped)

---

## 지원 프레임워크

### 📦 패키지 구조

```
ssgoi/
├── packages/
│   ├── core/           # 프레임워크 독립적 코어 로직
│   ├── react/          # React 바인딩
│   ├── svelte/         # Svelte 바인딩
│   └── vue/            # Vue 바인딩
└── apps/
    ├── docs/           # 문서 사이트 (Next.js)
    ├── react-demo/     # React 데모
    ├── svelte-demo/    # Svelte 데모
    └── vue-demo/       # Vue 데모
```

### 🎯 프레임워크별 지원 현황

| 프레임워크 | 패키지명        | 버전 지원 | 라우터 호환성                           |
| ---------- | --------------- | --------- | --------------------------------------- |
| React      | `@ssgoi/react`  | 16.8+     | React Router, Next.js App Router, Remix |
| Svelte     | `@ssgoi/svelte` | 3.0+      | SvelteKit, Svelte Router                |
| Vue        | `@ssgoi/vue`    | 3.0+      | Vue Router 4+                           |
| Vanilla    | `@ssgoi/core`   | -         | 모든 라우터                             |

---

## 설치 및 기본 사용법

### 📥 설치

```bash
# React
npm install @ssgoi/react
# 또는
yarn add @ssgoi/react
# 또는
pnpm add @ssgoi/react

# Svelte
npm install @ssgoi/svelte

# Vue
npm install @ssgoi/vue
```

### 🚀 30초 만에 시작하기

#### React 예제

```tsx
// 1. 앱 래핑
import {Ssgoi} from "@ssgoi/react";
import {fade} from "@ssgoi/react/view-transitions";

export default function App() {
    return (
        <Ssgoi config={{defaultTransition: fade()}}>
            <div style={{position: "relative"}}>{/* 앱 내용 */}</div>
        </Ssgoi>
    );
}

// 2. 페이지 래핑
import {SsgoiTransition} from "@ssgoi/react";

export default function HomePage() {
    return (
        <SsgoiTransition id="/">
            <h1>홈페이지</h1>
            {/* 페이지 내용 */}
        </SsgoiTransition>
    );
}
```

#### Svelte 예제

```svelte
<!-- App.svelte -->
<script>
  import { Ssgoi } from '@ssgoi/svelte';
  import { fade } from '@ssgoi/svelte/view-transitions';

  const config = { defaultTransition: fade() };
</script>

<Ssgoi {config}>
  <slot />
</Ssgoi>

<!-- routes/+page.svelte -->
<script>
  import { SsgoiTransition } from '@ssgoi/svelte';
</script>

<SsgoiTransition id="/">
  <h1>홈페이지</h1>
</SsgoiTransition>
```

#### Vue 예제

```vue
<!-- App.vue -->
<template>
    <Ssgoi :config="config">
        <router-view />
    </Ssgoi>
</template>

<script setup>
import {Ssgoi} from "@ssgoi/vue";
import {fade} from "@ssgoi/vue/view-transitions";

const config = {defaultTransition: fade()};
</script>

<!-- HomePage.vue -->
<template>
    <SsgoiTransition id="/">
        <h1>홈페이지</h1>
    </SsgoiTransition>
</template>

<script setup>
import {SsgoiTransition} from "@ssgoi/vue";
</script>
```

---

## 프레임워크별 구현

### ⚛️ React 구현

#### 컴포넌트

```tsx
// 기본 컴포넌트
import {Ssgoi, SsgoiTransition} from "@ssgoi/react";

// 개별 요소 애니메이션
import {transition} from "@ssgoi/react";
import {fadeIn, slideUp} from "@ssgoi/react/transitions";

function Card() {
    return (
        <div
            ref={transition({
                key: "card",
                in: fadeIn(),
                out: slideUp()
            })}
        >
            <h2>애니메이션 카드</h2>
        </div>
    );
}
```

#### 훅

```tsx
// 전환 상태 확인
import {useTransition} from "@ssgoi/react";

function LoadingIndicator() {
    const {isTransitioning} = useTransition();

    return isTransitioning ? <div>전환 중...</div> : null;
}
```

#### Next.js App Router 통합

```tsx
// app/layout.tsx
import {Ssgoi} from "@ssgoi/react";
import {slide} from "@ssgoi/react/view-transitions";

const config = {
    transitions: [{from: "/", to: "/about", transition: slide({direction: "left"})}]
};

export default function RootLayout({children}) {
    return (
        <html>
            <body>
                <Ssgoi config={config}>{children}</Ssgoi>
            </body>
        </html>
    );
}

// app/page.tsx
import {SsgoiTransition} from "@ssgoi/react";

export default function Page() {
    return <SsgoiTransition id="/">{/* 페이지 내용 */}</SsgoiTransition>;
}
```

### 🔥 Svelte 구현

#### 액션 (Actions)

```svelte
<script>
  import { transition } from '@ssgoi/svelte';
  import { fadeIn, slideOut } from '@ssgoi/svelte/transitions';
</script>

<!-- 개별 요소 애니메이션 -->
<div use:transition={{
  key: 'element',
  in: fadeIn(),
  out: slideOut()
}}>
  내용
</div>
```

#### 스토어

```svelte
<script>
  import { transitioning } from '@ssgoi/svelte';
</script>

{#if $transitioning}
  <p>전환 중...</p>
{/if}
```

#### SvelteKit 통합

```svelte
<!-- app.html -->
<script>
  import { Ssgoi } from '@ssgoi/svelte';
  import { slide, fade } from '@ssgoi/svelte/view-transitions';

  const config = {
    transitions: [
      { from: '/', to: '/about', transition: slide({ direction: 'left' }) }
    ],
    defaultTransition: fade()
  };
</script>

<Ssgoi {config}>
  <slot />
</Ssgoi>

<!-- routes/+page.svelte -->
<script>
  import { SsgoiTransition } from '@ssgoi/svelte';
</script>

<SsgoiTransition id="/">
  <main>홈페이지</main>
</SsgoiTransition>
```

### 🌟 Vue 구현

#### 디렉티브

```vue
<template>
    <!-- 개별 요소 애니메이션 -->
    <div
        v-transition="{
            key: 'element',
            in: fadeIn(),
            out: slideOut()
        }"
    >
        내용
    </div>
</template>

<script setup>
import {vTransition, fadeIn, slideOut} from "@ssgoi/vue";
</script>
```

#### Composition API

```vue
<template>
    <div ref="cardRef">
        <h2>애니메이션 카드</h2>
    </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from "vue";
import {transition, fadeIn, slideUp} from "@ssgoi/vue";

const cardRef = ref();
let cleanup;

onMounted(() => {
    cleanup = transition({
        key: "card",
        in: fadeIn(),
        out: slideUp()
    })(cardRef.value);
});

onUnmounted(() => {
    cleanup?.();
});
</script>
```

---

## 전환 효과 종류

### 🎬 페이지 전환 (`view-transitions`)

#### 기본 전환

```typescript
import {
    fade, // 페이드 인/아웃
    slide, // 슬라이드 (상하좌우)
    scale, // 스케일 확대/축소
    scroll // 스크롤 효과
} from "@ssgoi/react/view-transitions";

// 설정 예제
const config = {
    transitions: [
        {from: "/", to: "/about", transition: fade()},
        {from: "/list", to: "/detail/*", transition: scale()},
        {from: "/tab1", to: "/tab2", transition: slide({direction: "left"})}
    ]
};
```

#### 고급 전환

```typescript
import {
  hero,        // 공유 요소 전환
  pinterest,   // Pinterest 스타일 확장
  ripple       // Material Design 리플
} from '@ssgoi/react/view-transitions';

// Hero 전환 (공유 요소)
const heroConfig = {
  transitions: [
    {
      from: '/gallery',
      to: '/photo/*',
      transition: hero(),
      symmetric: true
    }
  ]
};

// 사용법: data-hero-key 속성 추가
<img
  data-hero-key="photo-123"
  src="/thumbnail.jpg"
  alt="썸네일"
/>

// 상세 페이지에서 같은 키 사용
<img
  data-hero-key="photo-123"
  src="/fullsize.jpg"
  alt="전체 이미지"
/>
```

### 🎭 개별 요소 전환 (`transitions`)

```typescript
import {
  fadeIn, fadeOut,           // 페이드
  slideUp, slideDown,        // 슬라이드
  slideLeft, slideRight,
  scaleIn, scaleOut,         // 스케일
  bounce,                    // 바운스
  blur,                      // 블러
  rotate,                    // 회전
  fly                        // 자유 이동
} from '@ssgoi/react/transitions';

// 사용 예제
<div ref={transition({
  key: 'element',
  in: slideUp({ distance: 50 }),
  out: fadeOut()
})}>
  애니메이션 요소
</div>
```

### ⚙️ 스프링 물리 설정

```typescript
// 스프링 프리셋
import {config} from "@ssgoi/react/presets";

const springConfigs = {
    default: {stiffness: 300, damping: 30},
    gentle: {stiffness: 120, damping: 14},
    wobbly: {stiffness: 180, damping: 12},
    stiff: {stiffness: 400, damping: 40},
    slow: {stiffness: 280, damping: 60},
    molasses: {stiffness: 280, damping: 120}
};

// 커스텀 스프링 설정
slide({
    direction: "left",
    spring: {stiffness: 250, damping: 25}
});
```

---

## 고급 기능

### 🔄 대칭 전환 (Symmetric Transitions)

```typescript
const config = {
    transitions: [
        {
            from: "/home",
            to: "/profile",
            transition: slide({direction: "left"}),
            symmetric: true // 자동으로 역방향 전환 생성
            // profile → home은 자동으로 slide({ direction: 'right' })
        }
    ]
};
```

### 🎯 패턴 매칭

```typescript
const config = {
    transitions: [
        // 정확한 매칭
        {from: "/", to: "/about", transition: fade()},

        // 와일드카드 매칭
        {from: "/products", to: "/products/*", transition: scale()},

        // 모든 경로 매칭
        {from: "*", to: "*", transition: fade()}
    ]
};

// 매칭 순서: 더 구체적인 패턴이 우선
```

### 🔧 미들웨어

```typescript
const config = {
    middleware: (from, to) => {
        // 경로 변환 로직
        if (from.startsWith("/admin") && !to.startsWith("/admin")) {
            return {from, to: "/logout"};
        }
        return {from, to};
    },
    transitions: [{from: "/admin/*", to: "/logout", transition: slide({direction: "up"})}]
};
```

### 📜 스크롤 관리

```typescript
// 자동 스크롤 위치 저장/복원
const config = {
    transitions: [
        {
            from: "/list",
            to: "/detail/*",
            transition: scale()
            // 스크롤 위치가 자동으로 저장되고 복원됨
        }
    ]
};

// 커스텀 스크롤 동작
scroll({
    direction: "up", // 스크롤 방향
    spring: {stiffness: 300, damping: 30}
});
```

---

## API 레퍼런스

### 🔧 Core API

#### `SsgoiConfig`

```typescript
interface SsgoiConfig {
    transitions?: Array<{
        from: string; // 출발 경로 패턴
        to: string; // 도착 경로 패턴
        transition: SggoiTransition;
        symmetric?: boolean; // 양방향 자동 생성
    }>;
    defaultTransition?: SggoiTransition;
    middleware?: (from: string, to: string) => {from: string; to: string};
}
```

#### `SggoiTransition`

```typescript
interface SggoiTransition {
    in?: (element: HTMLElement, context: SggoiTransitionContext) => TransitionConfig;
    out?: (element: HTMLElement, context: SggoiTransitionContext) => TransitionConfig;
}

interface TransitionConfig {
    spring?: {stiffness: number; damping: number};
    prepare?: (element: HTMLElement) => void;
    tick?: (progress: number) => void;
    onStart?: () => void;
    onEnd?: () => void;
}
```

### ⚛️ React API

#### 컴포넌트

```typescript
// <Ssgoi>
interface SsgoiProps {
    config: SsgoiConfig;
    children: ReactNode;
}

// <SsgoiTransition>
interface SsgoiTransitionProps {
    id: string;
    children: ReactNode;
}
```

#### 훅

```typescript
// useTransition()
function useTransition(): {
    isTransitioning: boolean;
    direction?: "forward" | "backward";
};

// useSsgoi()
function useSsgoi(): (path: string) => Transition;
```

#### 함수

```typescript
// transition()
function transition<T = number>(config: {key: string; in?: TransitionFunction<T>; out?: TransitionFunction<T>}): RefCallback<HTMLElement>;
```

### 🔥 Svelte API

#### 컴포넌트

```svelte
<!-- <Ssgoi> -->
<Ssgoi config={ssgoiConfig}>
  <slot />
</Ssgoi>

<!-- <SsgoiTransition> -->
<SsgoiTransition id="/page-id">
  <slot />
</SsgoiTransition>
```

#### 액션

```typescript
// use:transition
function transition(node: HTMLElement, params: Transition & {key: string}): {update: Function; destroy: Function};
```

#### 스토어

```typescript
// transitioning
const transitioning: Readable<boolean>;
```

### 🌟 Vue API

#### 컴포넌트

```vue
<!-- <Ssgoi> -->
<Ssgoi :config="config">
  <slot />
</Ssgoi>

<!-- <SsgoiTransition> -->
<SsgoiTransition id="/page-id">
  <slot />
</SsgoiTransition>
```

#### 디렉티브

```typescript
// v-transition
const vTransition: Directive<HTMLElement, Transition & {key: string}>;
```

#### Composables

```typescript
// useSsgoi()
function useSsgoi(): (path: string) => Transition;

// useTransition()
function useTransition(): ComputedRef<{
    isTransitioning: boolean;
    direction?: "forward" | "backward";
}>;
```

---

## 성능 및 최적화

### ⚡ 성능 특성

- **번들 크기**: ~15KB (gzipped, core + framework binding)
- **애니메이션**: 60fps, GPU 가속 활용
- **메모리**: 자동 정리, 메모리 누수 없음
- **호환성**: IE11+ (polyfill 포함)

### 🚀 최적화 팁

#### 1. 조건부 로드

```typescript
// 라우트 기반 코드 분할
const HeavyTransition = lazy(() => import("./heavy-transition"));

const config = {
    transitions: [
        {
            from: "/simple",
            to: "/simple/*",
            transition: fade() // 가벼운 전환
        },
        {
            from: "/complex",
            to: "/complex/*",
            transition: await import("./complex-transition").then(m => m.default())
        }
    ]
};
```

#### 2. 프리페치

```typescript
// React 예제
useEffect(() => {
    // 중요한 페이지 미리 로드
    router.prefetch("/important-page");
}, []);

// 호버 시 프리페치
const handleHover = href => {
    router.prefetch(href);
};
```

#### 3. 메모리 관리

```typescript
// 자동 정리 확인
useEffect(() => {
    const cleanup = transition({
        key: "element",
        in: fadeIn(),
        out: fadeOut()
    });

    return cleanup; // 반드시 정리 함수 반환
}, []);
```

#### 4. 스프링 최적화

```typescript
// 성능 vs 품질 균형
const performanceConfig = {
    stiffness: 300, // 적당한 강성도
    damping: 30 // 적당한 감쇠
};

const qualityConfig = {
    stiffness: 180, // 낮은 강성도 (더 부드러움)
    damping: 12 // 낮은 감쇠 (더 자연스러움)
};
```

---

## 실전 예제

### 🛍️ 전자상거래 사이트

```typescript
// 쇼핑몰 전환 설정
const ecommerceConfig = {
  transitions: [
    // 메인 → 카테고리: 슬라이드
    {
      from: '/',
      to: '/category/*',
      transition: slide({ direction: 'left' }),
      symmetric: true
    },

    // 목록 → 상품 상세: 스케일 + Hero
    {
      from: '/category/*',
      to: '/product/*',
      transition: hero({ timeout: 300 })
    },

    // 장바구니: 위에서 슬라이드
    {
      from: '*',
      to: '/cart',
      transition: slide({ direction: 'up' })
    },

    // 결제: 페이드 (보안상 부드럽게)
    {
      from: '/cart',
      to: '/checkout',
      transition: fade()
    }
  ],
  defaultTransition: fade()
};

// 상품 카드 컴포넌트
function ProductCard({ product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <div>
        <img
          data-hero-key={`product-${product.id}`}
          src={product.thumbnail}
          alt={product.name}
        />
        <h3 data-hero-key={`title-${product.id}`}>
          {product.name}
        </h3>
      </div>
    </Link>
  );
}
```

### 📰 뉴스/블로그 사이트

```typescript
// 콘텐츠 사이트 전환 설정
const contentConfig = {
  transitions: [
    // 홈 → 기사: Pinterest 스타일
    {
      from: '/',
      to: '/article/*',
      transition: pinterest()
    },

    // 카테고리 간 이동: 수평 슬라이드
    {
      from: '/tech',
      to: '/design',
      transition: slide({ direction: 'left' })
    },
    {
      from: '/design',
      to: '/tech',
      transition: slide({ direction: 'right' })
    },

    // 검색 결과: 스크롤 효과
    {
      from: '*',
      to: '/search',
      transition: scroll({ direction: 'up' })
    }
  ]
};

// 기사 목록 컴포넌트
function ArticleList({ articles }) {
  return (
    <div>
      {articles.map(article => (
        <article
          key={article.id}
          ref={transition({
            key: `article-${article.id}`,
            in: slideUp({ delay: article.index * 50 }), // 순차 애니메이션
            out: fadeOut()
          })}
        >
          <h2>{article.title}</h2>
          <p>{article.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

### 📱 소셜 미디어 앱

```typescript
// 소셜 앱 전환 설정
const socialConfig = {
  transitions: [
    // 피드 → 프로필: Hero 전환
    {
      from: '/feed',
      to: '/profile/*',
      transition: hero()
    },

    // 탭 네비게이션: 빠른 슬라이드
    {
      from: '/feed',
      to: '/explore',
      transition: slide({
        direction: 'left',
        spring: { stiffness: 400, damping: 40 }
      })
    },

    // 포스트 상세: 모달 스타일
    {
      from: '*',
      to: '/post/*',
      transition: scale({ from: 0.9, spring: { stiffness: 300, damping: 30 } })
    },

    // 설정: 우측에서 슬라이드
    {
      from: '*',
      to: '/settings',
      transition: slide({ direction: 'left' })
    }
  ]
};

// 포스트 컴포넌트
function Post({ post }) {
  return (
    <article ref={transition({
      key: `post-${post.id}`,
      in: slideUp(),
      out: slideDown()
    })}>
      <img
        data-hero-key={`avatar-${post.author.id}`}
        src={post.author.avatar}
        alt={post.author.name}
      />
      <div>
        <h3 data-hero-key={`username-${post.author.id}`}>
          {post.author.name}
        </h3>
        <p>{post.content}</p>
      </div>
    </article>
  );
}
```

### 📊 대시보드 애플리케이션

```typescript
// 대시보드 전환 설정
const dashboardConfig = {
  transitions: [
    // 메인 대시보드 → 상세 리포트: 스케일
    {
      from: '/dashboard',
      to: '/report/*',
      transition: scale({ from: 1.1 })
    },

    // 사이드바 메뉴: 페이드
    {
      from: '/dashboard/*',
      to: '/dashboard/*',
      transition: fade({ spring: { stiffness: 400, damping: 40 } })
    }
  ]
};

// 차트 컴포넌트
function Chart({ data, type }) {
  return (
    <div ref={transition({
      key: `chart-${type}`,
      in: (element) => ({
        spring: { stiffness: 200, damping: 25 },
        tick: (progress) => {
          element.style.opacity = progress.toString();
          element.style.transform = `scale(${0.8 + 0.2 * progress})`;
        }
      }),
      out: fadeOut()
    })}>
      {/* 차트 내용 */}
    </div>
  );
}
```

---

## 트러블슈팅

### 🚨 일반적인 문제들

#### 1. 애니메이션이 실행되지 않음

**증상**: 페이지 전환 시 애니메이션 없이 즉시 변경됨

**원인 및 해결**:

```typescript
// ❌ 잘못된 설정
const config = {
  transitions: [
    { from: '/home', to: '/about', transition: fade() }
  ]
};

// ✅ 올바른 설정 - SsgoiTransition의 id와 매칭 확인
<SsgoiTransition id="/home">  {/* 정확한 경로 */}
<SsgoiTransition id="/about"> {/* 정확한 경로 */}

// ✅ 디버깅 코드 추가
const config = {
  middleware: (from, to) => {
    console.log('Transition:', from, '→', to);
    return { from, to };
  }
};
```

#### 2. 애니메이션이 끊어짐

**증상**: 애니메이션 중간에 멈추거나 깨짐

**원인 및 해결**:

```typescript
// ❌ 스프링 설정이 너무 강함
spring: { stiffness: 1000, damping: 5 }

// ✅ 적절한 스프링 설정
spring: { stiffness: 300, damping: 30 }

// ✅ 프리셋 사용
import { config } from '@ssgoi/react/presets';
spring: config.gentle // { stiffness: 120, damping: 14 }
```

#### 3. 메모리 누수

**증상**: 페이지 전환 후 메모리 사용량 증가

**원인 및 해결**:

```typescript
// ❌ cleanup 함수 누락
useEffect(() => {
  const transitionRef = transition({ ... });
  // cleanup 함수 반환하지 않음
}, []);

// ✅ 올바른 cleanup
useEffect(() => {
  const cleanup = transition({
    key: 'element',
    in: fadeIn(),
    out: fadeOut()
  })(element);

  return cleanup; // 반드시 cleanup 함수 반환
}, []);

// ✅ React Strict Mode 고려
if (process.env.NODE_ENV === 'development') {
  // Strict Mode에서 두 번 실행되는 것 고려
}
```

#### 4. SSR 하이드레이션 오류

**증상**: 서버와 클라이언트 렌더링 불일치

**원인 및 해결**:

```typescript
// ❌ 서버에서 애니메이션 상태 불일치
const [isVisible, setIsVisible] = useState(true);

// ✅ 클라이언트에서만 애니메이션 실행
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

if (!isClient) {
  return <div>Loading...</div>; // 서버 렌더링 시 정적 콘텐츠
}
```

#### 5. 성능 문제

**증상**: 애니메이션 중 프레임 드롭

**원인 및 해결**:

```typescript
// ❌ 매 프레임마다 무거운 계산
tick: progress => {
    const complexValue = heavyCalculation(progress); // 매번 계산
    element.style.transform = `translateX(${complexValue}px)`;
};

// ✅ 미리 계산된 값 사용
const precomputedValues = useMemo(() => Array.from({length: 100}, (_, i) => heavyCalculation(i / 100)), []);

tick: progress => {
    const index = Math.floor(progress * 99);
    const value = precomputedValues[index];
    element.style.transform = `translateX(${value}px)`;
};

// ✅ requestAnimationFrame 활용
tick: progress => {
    requestAnimationFrame(() => {
        element.style.transform = `translateX(${progress * 100}%)`;
    });
};
```

### 🔧 디버깅 도구

#### 개발 모드 로깅

```typescript
const debugConfig = {
    middleware: (from, to) => {
        if (process.env.NODE_ENV === "development") {
            console.group("🎬 SSGOI Transition");
            console.log("From:", from);
            console.log("To:", to);
            console.log("Timestamp:", Date.now());
            console.groupEnd();
        }
        return {from, to};
    }
};
```

#### 성능 모니터링

```typescript
// 전환 성능 측정
const performanceConfig = {
    transitions: [
        {
            from: "/",
            to: "/about",
            transition: {
                in: element => ({
                    onStart: () => {
                        performance.mark("ssgoi-transition-start");
                    },
                    tick: progress => {
                        element.style.opacity = progress.toString();
                    },
                    onEnd: () => {
                        performance.mark("ssgoi-transition-end");
                        performance.measure("ssgoi-transition-duration", "ssgoi-transition-start", "ssgoi-transition-end");

                        const measure = performance.getEntriesByName("ssgoi-transition-duration")[0];
                        console.log(`Transition took: ${measure.duration}ms`);
                    }
                })
            }
        }
    ]
};
```

#### 애니메이션 상태 확인

```typescript
// React 디버깅 컴포넌트
function TransitionDebugger() {
  const { isTransitioning, direction } = useTransition();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'black',
      color: 'white',
      padding: 10,
      fontSize: 12
    }}>
      <div>Transitioning: {isTransitioning ? 'Yes' : 'No'}</div>
      <div>Direction: {direction || 'None'}</div>
    </div>
  );
}
```

### 📋 체크리스트

**설치 및 설정 확인**:

- [ ] 올바른 패키지 설치 (`@ssgoi/react`, `@ssgoi/svelte`, `@ssgoi/vue`)
- [ ] `<Ssgoi>` 컴포넌트로 앱 래핑
- [ ] 각 페이지에 `<SsgoiTransition>` 컴포넌트 적용
- [ ] `id` prop이 라우터 경로와 일치

**전환 설정 확인**:

- [ ] `from`/`to` 패턴이 실제 경로와 매칭
- [ ] 와일드카드 패턴 올바르게 사용 (`/products/*`)
- [ ] `symmetric` 설정 확인
- [ ] `defaultTransition` 설정

**성능 확인**:

- [ ] cleanup 함수 올바르게 반환
- [ ] 스프링 설정 적절한 값 사용
- [ ] 무거운 계산 최적화
- [ ] 메모리 누수 없음

---

## 결론

SSGOI는 웹 애플리케이션에 네이티브 앱 수준의 페이지 전환 경험을 제공하는 강력하고 유연한 라이브러리입니다. 주요 장점:

- **🌐 범용성**: 모든 프레임워크와 라우터에서 동작
- **🎯 간단함**: 기존 코드 변경 최소화
- **⚡ 성능**: 60fps 부드러운 애니메이션
- **🔧 확장성**: 커스텀 전환 효과 쉽게 구현
- **💪 안정성**: 프로덕션 환경에서 검증된 코드

### 다음 단계

1. **설치 및 기본 설정**: 30초 만에 첫 전환 효과 적용
2. **고급 기능 탐색**: Hero 전환, Pinterest 효과 등 활용
3. **커스텀 전환**: 프로젝트에 맞는 독특한 효과 개발
4. **성능 최적화**: 프로덕션 환경에 맞는 세부 튜닝

SSGOI를 통해 사용자에게 더 나은 웹 경험을 제공하세요! 🚀
