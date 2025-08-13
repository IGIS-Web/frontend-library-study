# SSGOI Core 패키지 동작 분석

## 📁 프로젝트 구조 개요

SSGOI는 웹 페이지 전환 애니메이션을 제공하는 프레임워크 독립적인 라이브러리입니다.

```
ssgoi/
├── packages/
│   ├── core/           # 🎯 핵심 애니메이션 엔진 (바닐라 JS)
│   ├── react/          # React 바인딩
│   ├── svelte/         # Svelte 바인딩
│   └── vue/            # Vue 바인딩
└── apps/
    ├── react-demo/     # React 데모 앱
    ├── svelte-demo/    # Svelte 데모 앱
    ├── vue-demo/       # Vue 데모 앱
    └── docs/           # 문서 사이트
```

## 🔧 Core 패키지 핵심 구조

### 주요 모듈

```
packages/core/src/lib/
├── types.ts                              # 타입 정의
├── create-ssgoi-transition-context.ts    # 🎯 핵심 컨텍스트 생성
├── animator.ts                           # 애니메이션 실행 엔진
├── transition.ts                         # 전환 관리
├── create-transition-callback.ts         # 콜백 생성
├── transition-strategy.ts                # 전환 전략
├── utils.ts                             # 유틸리티 함수
├── transitions/                         # 내장 전환 효과들
│   ├── fade.ts
│   ├── slide.ts
│   ├── scale.ts
│   └── ...
├── view-transitions/                    # 고급 전환 효과들
└── presets/                            # 사전 정의 설정들
```

## 🎯 핵심 동작 원리

### 1. 전환 컨텍스트 생성 (create-ssgoi-transition-context.ts)

가장 핵심이 되는 파일로, 페이지 전환의 전체 로직을 관리합니다.

```typescript
// 페이지 전환 시나리오: /home → /about
//
// 1. OUT 애니메이션 시작 (홈 페이지 사라짐)
//    - getTransition('unique-id', 'out', '/home') 호출
//    - { from: '/home' }을 pendingTransitions에 저장
//    - Promise 생성하고 outResolve 저장 (아직 해결 안됨)
//    - checkAndResolve 호출 → 'to'가 없어서 대기
//
// 2. IN 애니메이션 시작 (어바웃 페이지 나타남)
//    - getTransition('unique-id', 'in', '/about') 호출
//    - 기존 pending에 { to: '/about' } 추가
//    - Promise 생성하고 inResolve 저장
//    - checkAndResolve 호출 → 'from'과 'to' 모두 존재!
//
// 3. 전환 매칭 및 해결
//    - from: '/home', to: '/about'로 적절한 전환 찾기
//    - 찾은 전환의 설정으로 out과 in을 동시에 해결
//    - pendingTransitions에서 id 제거
```

#### 주요 기능들:

1. **대칭 전환 처리** (`processSymmetricTransitions`)
    - `symmetric: true`로 설정된 전환을 자동으로 양방향으로 생성
    - A → B 전환이 있으면 B → A 전환도 자동 생성

2. **스크롤 위치 관리** (`createScrollManager`)
    - 페이지 전환 시 스크롤 위치 보존
    - 스크롤 오프셋 계산하여 부드러운 전환 지원

3. **전환 매칭** (`findMatchingTransition`)
    - 경로 패턴 매칭 지원 (`/products/*` 등)
    - 와일드카드 매칭 (`*`)
    - 정확한 경로 매칭

### 2. 애니메이션 엔진 (animator.ts)

Popmotion 라이브러리를 사용한 스프링 물리 기반 애니메이션 엔진:

```typescript
// 스프링 물리 설정
interface SpringConfig {
  stiffness?: number;  // 강성 (높을수록 빠름)
  damping?: number;    // 감쇠 (높을수록 진동 적음)
}

// 애니메이션 지원 타입
- number: 단순 수치 애니메이션 (opacity, scale 등)
- object: 복합 객체 애니메이션 (transform 등)
```

### 3. 전환 전략 (transition-strategy.ts)

UX에 최적화된 4가지 주요 시나리오 처리:

```typescript
// 1. 애니메이션 없음 + IN 트리거:
//    - 입장 애니메이션 시작 (0 → 1)
//    - 종료를 위한 클린업 함수 반환

// 2. 애니메이션 없음 + OUT 트리거:
//    - 요소 복제, 종료 애니메이션 시작 (1 → 0)
//    - 완료 시 복제본 제거

// 3. IN 애니메이션 실행 중 + OUT 트리거:
//    - 현재 IN 애니메이션 중단 (DOM이 사라지는 중)
//    - 종료 애니메이션용 요소 복제
//    - 현재 상태로 REVERSED IN 애니메이션 생성

// 4. OUT 애니메이션 실행 중 + IN 트리거:
//    - 현재 OUT 애니메이션 중단
//    - 복제된 요소들 정리
//    - 현재 상태로 IN 애니메이션 시작
```

### 4. 전환 콜백 시스템 (create-transition-callback.ts)

프레임워크별 구현체들이 사용할 수 있는 통합 콜백 시스템:

```typescript
// 사용법
const callback = createTransitionCallback(() => ({in: fadeIn, out: fadeOut}), {strategy: customStrategy});

// 프레임워크에서 사용
element.addEventListener("mount", () => callback(element));
```

## 🎨 내장 전환 효과들

### 기본 전환들 (transitions/)

- **fade**: 투명도 전환
- **slide**: 슬라이드 전환 (상하좌우)
- **scale**: 확대/축소 전환
- **rotate**: 회전 전환
- **blur**: 블러 효과 전환
- **bounce**: 바운스 효과
- **fly**: 날아오는 효과

### 고급 전환들 (view-transitions/)

- **hero**: 히어로 전환 (요소 간 매끄러운 변형)
- **pinterest**: 핀터레스트 스타일 전환
- 기타 복합 효과들

## 🌐 프레임워크 바인딩 구조

### React 바인딩 (@ssgoi/react)

```tsx
// 1. 앱 레벨에서 컨텍스트 제공
<Ssgoi config={config}>
  <App />
</Ssgoi>

// 2. 페이지별 전환 적용
<SsgoiTransition id="/home">
  <HomePage />
</SsgoiTransition>

// 내부 구현
const Ssgoi = ({ config, children }) => {
  const contextValue = useMemo(
    () => createSggoiTransitionContext(config),
    [config]
  );
  return <SsgoiProvider value={contextValue}>{children}</SsgoiProvider>;
};
```

### Svelte 바인딩 (@ssgoi/svelte)

```svelte
<!-- 1. 앱 레벨에서 컨텍스트 제공 -->
<Ssgoi config={config}>
  <slot />
</Ssgoi>

<!-- 2. 페이지별 전환 적용 -->
<SsgoiTransition id="/home">
  <!-- 페이지 내용 -->
</SsgoiTransition>

<!-- 3. 개별 요소 전환 (Svelte action) -->
<div use:transition={{ key: 'element', in: fadeIn, out: fadeOut }}>
  내용
</div>
```

### Vue 바인딩 (@ssgoi/vue)

```vue
<!-- 1. 앱 레벨에서 컨텍스트 제공 -->
<Ssgoi :config="config">
  <router-view />
</Ssgoi>

<!-- 2. 페이지별 전환 적용 -->
<SsgoiTransition id="/home">
  <!-- 페이지 내용 -->
</SsgoiTransition>
```

## ⚙️ 설정 시스템

### 기본 설정 구조

```typescript
interface SsgoiConfig {
    // 라우트별 전환 정의
    transitions?: {
        from: string; // 출발 경로
        to: string; // 도착 경로
        transition: SggoiTransition;
        symmetric?: boolean; // 양방향 전환 자동 생성
    }[];

    // 기본 전환 (매칭되는 라우트가 없을 때)
    defaultTransition?: SggoiTransition;

    // 경로 변환 미들웨어
    middleware?: (from: string, to: string) => {from: string; to: string};
}
```

### 전환 설정 예시

```typescript
const config = {
    transitions: [
        // 홈 → 어바웃: 왼쪽으로 슬라이드
        {
            from: "/",
            to: "/about",
            transition: slide({direction: "left"})
        },

        // 제품 목록 → 제품 상세: 스케일 업
        {
            from: "/products",
            to: "/products/*",
            transition: scale()
        },

        // 갤러리 → 사진 상세: 히어로 전환 (양방향)
        {
            from: "/gallery",
            to: "/photo/*",
            transition: hero(),
            symmetric: true
        }
    ],
    defaultTransition: fade()
};
```

## 🔄 실행 흐름

### 페이지 전환 시퀀스

1. **사용자 액션**: 링크 클릭 또는 네비게이션
2. **라우터 처리**: 프레임워크 라우터가 URL 변경 감지
3. **OUT 단계**: 현재 페이지의 SsgoiTransition에서 `out` 트리거
4. **IN 단계**: 새 페이지의 SsgoiTransition에서 `in` 트리거
5. **전환 매칭**: 설정된 전환 규칙에서 from/to 패턴 매칭
6. **애니메이션 실행**: 스프링 물리 기반으로 부드러운 전환
7. **상태 정리**: 임시 요소 제거 및 메모리 정리

### 스크롤 위치 처리

1. **스크롤 추적**: 각 페이지의 스크롤 위치 자동 저장
2. **오프셋 계산**: 페이지 간 스크롤 차이 계산
3. **전환 컨텍스트**: 애니메이션에 스크롤 오프셋 정보 제공
4. **복원**: 뒤로가기 시 이전 스크롤 위치 복원

## 💡 핵심 특징들

### 1. 프레임워크 독립성

- Core는 순수 JavaScript/TypeScript
- 각 프레임워크는 Core를 얇게 래핑
- 일관된 API와 동작 보장

### 2. SSR 호환성

- 서버사이드 렌더링 완벽 지원
- 하이드레이션 문제 없음
- SEO 친화적

### 3. 브라우저 호환성

- View Transition API와 달리 모든 모던 브라우저 지원
- Chrome, Firefox, Safari 모두 동일한 경험

### 4. 성능 최적화

- 하드웨어 가속 애니메이션
- 자동 메모리 관리
- 최소 번들 크기 (~8kb gzipped)

### 5. 개발자 경험

- TypeScript 완벽 지원
- 직관적인 API
- 기존 라우터와의 완벽한 호환성

## 🎯 사용 사례

### 기본 페이지 전환

```typescript
// 간단한 페이드 전환
const config = {
    defaultTransition: fade()
};
```

### 경로별 차별화된 전환

```typescript
// 섹션별 다른 전환 효과
const config = {
    transitions: [
        {from: "/home", to: "/about", transition: slide()},
        {from: "/gallery", to: "/photo/*", transition: hero()},
        {from: "*", to: "*", transition: fade()} // 기타 모든 경우
    ]
};
```

### 히어로 전환

```typescript
// 요소 간 매끄러운 변형
const heroTransition = hero({
  spring: { stiffness: 300, damping: 30 }
});

// HTML에서 data-hero-key로 요소 연결
<div data-hero-key="product-123">...</div>
```

## 🔮 확장 가능성

SSGOI Core의 설계는 다음과 같은 확장을 염두에 두고 있습니다:

1. **새로운 프레임워크 지원**: Qwik, SolidJS 등
2. **커스텀 전환 효과**: 사용자 정의 애니메이션
3. **고급 제스처 지원**: 스와이프, 드래그 기반 전환
4. **성능 최적화**: Web Workers, OffscreenCanvas 활용

이러한 아키텍처를 통해 SSGOI는 웹에서 네이티브 앱과 같은 부드러운 페이지 전환 경험을 제공합니다.
