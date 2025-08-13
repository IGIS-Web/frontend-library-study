# create-ssgoi-transition-context.ts 심층 분석

## 📋 개요

`create-ssgoi-transition-context.ts`는 SSGOI의 핵심 파일로, 페이지 간 전환 애니메이션의 컨텍스트를 생성하고 관리하는 역할을 담당합니다. 이 파일은 전체 SSGOI 라이브러리의 핵심 로직이 집중된 곳으로, 페이지 전환의 동기화, 스크롤 위치 관리, 경로 매칭 등을 처리합니다.

## 🎯 핵심 동작 원리

### 페이지 전환 시나리오: `/home → /about`

```typescript
/**
 * 1. OUT 애니메이션 시작 (홈 페이지 사라짐)
 *    - getTransition('/home', 'out') 호출
 *    - { from: '/home' }을 pendingTransition에 저장
 *    - Promise 생성하고 outResolve 저장 (아직 해결 안됨)
 *    - checkAndResolve 호출 → 'to'가 없어서 대기
 *
 * 2. IN 애니메이션 시작 (어바웃 페이지 나타남)
 *    - getTransition('/about', 'in') 호출
 *    - 기존 pending에 { to: '/about' } 추가
 *    - Promise 생성하고 inResolve 저장
 *    - checkAndResolve 호출 → 'from'과 'to' 모두 존재!
 *
 * 3. 전환 매칭 및 해결
 *    - from: '/home', to: '/about'로 적절한 전환 찾기
 *    - 찾은 전환의 설정으로 out과 in을 동시에 해결
 *    - pendingTransition 초기화
 */
```

**핵심 포인트**: OUT과 IN 애니메이션이 서로를 기다리며, 둘 다 준비되면 from/to 정보를 사용해 적절한 전환을 찾아 동시에 해결합니다.

## 🏗️ 구조 분석

### 1. 타입 정의

```typescript
type PendingTransition = {
    from?: string; // 출발 경로
    to?: string; // 도착 경로
    outResolve?: (transition: GetTransitionConfig) => void; // OUT 애니메이션 해결 함수
    inResolve?: (transition: GetTransitionConfig) => void; // IN 애니메이션 해결 함수
};
```

### 2. 주요 함수들

#### `processSymmetricTransitions`

양방향 전환을 자동으로 생성하는 함수입니다.

```typescript
function processSymmetricTransitions(
    transitions: NonNullable<SsgoiConfig["transitions"]>
): Omit<NonNullable<SsgoiConfig["transitions"]>[number], "symmetric">[] {
    const reversedTransitions = transitions
        .filter(t => t.symmetric)
        .map(t => ({
            from: t.to, // 방향 뒤바꾸기
            to: t.from,
            transition: t.transition
        }));

    return [...transitions, ...reversedTransitions];
}
```

**동작 원리**:

- `symmetric: true`로 설정된 전환을 찾아서
- `from`과 `to`를 뒤바꾼 역방향 전환을 자동 생성
- 원본 전환 배열과 역방향 전환들을 합쳐서 반환

**예시**:

```typescript
// 입력
[{from: "/home", to: "/about", transition: slide(), symmetric: true}][
    // 출력
    ({from: "/home", to: "/about", transition: slide()}, {from: "/about", to: "/home", transition: slide()}) // 자동 생성
];
```

#### `createScrollManager`

페이지 전환 시 스크롤 위치를 추적하고 관리하는 매니저를 생성합니다.

```typescript
function createScrollManager() {
    let scrollContainer: HTMLElement | null = null; // 스크롤 컨테이너
    const scrollPositions: Map<string, {x: number; y: number}> = new Map(); // 경로별 스크롤 위치
    let currentPath: string | null = null; // 현재 경로

    // 스크롤 이벤트 리스너
    const scrollListener = () => {
        if (scrollContainer && currentPath) {
            scrollPositions.set(currentPath, {
                x: scrollContainer.scrollLeft,
                y: scrollContainer.scrollTop
            });
        }
    };

    // ... 더 많은 로직
}
```

**주요 기능**:

1. **스크롤 추적 시작** (`startScrollTracking`):

    ```typescript
    const startScrollTracking = (element: HTMLElement, path: string) => {
        // 스크롤 컨테이너 초기화 (한 번만)
        if (!scrollContainer) {
            scrollContainer = getScrollingElement(element);

            // 중요: document.documentElement인 경우 window에 이벤트 리스너 부착
            const target = scrollContainer === document.documentElement ? window : scrollContainer;
            target.addEventListener("scroll", scrollListener, {passive: true});
        }

        currentPath = path; // 현재 경로 업데이트
    };
    ```

2. **스크롤 오프셋 계산** (`calculateScrollOffset`):

    ```typescript
    const calculateScrollOffset = (from?: string, to?: string): {x: number; y: number} => {
        const fromScroll = from && scrollPositions.has(from) ? scrollPositions.get(from)! : {x: 0, y: 0};

        const toScroll = to && scrollPositions.has(to) ? scrollPositions.get(to)! : {x: 0, y: 0};

        return {
            x: -toScroll.x + fromScroll.x, // 스크롤 차이 계산
            y: -toScroll.y + fromScroll.y
        };
    };
    ```

**스크롤 오프셋의 의미**:

- `fromScroll`: 이전 페이지의 스크롤 위치
- `toScroll`: 새 페이지의 스크롤 위치
- 반환값: 두 페이지 간의 스크롤 차이
- 애니메이션에서 이 차이를 사용해 부드러운 전환 구현

### 3. 메인 함수: `createSggoiTransitionContext`

#### 함수 시그니처 및 설정

```typescript
export function createSggoiTransitionContext(
  options: SsgoiConfig
): SsgoiContext {
  // 설정 구조분해 및 기본값
  const {
    transitions = [],
    defaultTransition,
    middleware = (from, to) => ({ from, to }), // 기본값: 변환 없음
  } = options;

  let pendingTransition: PendingTransition | null = null;

  // 대칭 전환 처리
  const processedTransitions = processSymmetricTransitions(transitions);

  // 스크롤 매니저 초기화
  const { startScrollTracking, calculateScrollOffset } = createScrollManager();
```

#### 핵심 로직: `checkAndResolve`

이 함수는 OUT과 IN 애니메이션이 모두 준비되었을 때 전환을 해결하는 핵심 로직입니다.

```typescript
function checkAndResolve() {
    if (pendingTransition?.from && pendingTransition?.to) {
        // 1. 미들웨어 변환 적용
        const {from: transformedFrom, to: transformedTo} = middleware(pendingTransition.from, pendingTransition.to);

        // 2. 전환 매칭
        const transition = findMatchingTransition(transformedFrom, transformedTo, processedTransitions);

        // 3. 결과 결정 (매칭된 전환 또는 기본 전환)
        const result = transition || defaultTransition;

        // 4. 스크롤 오프셋 계산
        const scrollOffset = calculateScrollOffset(pendingTransition.from, pendingTransition.to);

        // 5. 컨텍스트 생성
        const context = {scrollOffset};

        // 6. Promise 해결
        if (result) {
            if (result.out && pendingTransition.outResolve) {
                pendingTransition.outResolve(element => result.out!(element, context));
            }
            if (result.in && pendingTransition.inResolve) {
                pendingTransition.inResolve(element => result.in!(element, context));
            }
        }

        // 7. 상태 초기화
        pendingTransition = null;
    }
}
```

**단계별 분석**:

1. **미들웨어 변환**: 경로를 변환할 수 있는 미들웨어 적용
2. **전환 매칭**: 변환된 경로로 적절한 전환 찾기
3. **결과 결정**: 매칭된 전환이 없으면 기본 전환 사용
4. **스크롤 오프셋**: 페이지 간 스크롤 차이 계산
5. **컨텍스트 생성**: 애니메이션에 전달할 컨텍스트 객체 생성
6. **Promise 해결**: OUT과 IN 애니메이션의 Promise를 동시에 해결
7. **상태 초기화**: 다음 전환을 위해 상태 초기화

#### 전환 관리: `getTransition`

페이지 전환 요청을 처리하는 비동기 함수입니다.

```typescript
const getTransition = async (path: string, type: "out" | "in") => {
    // 엣지 케이스 처리: IN 호출 시 OUT이 없으면 전환 없음 (페이지 새로고침 등)
    if (type === "in") {
        if (!pendingTransition || !pendingTransition.from) {
            return () => ({}); // 빈 전환 반환
        }
    }

    // pending 상태 초기화
    if (!pendingTransition) {
        pendingTransition = {};
    }

    if (type === "out") {
        // OUT 처리: from 경로 저장 및 Promise 생성
        pendingTransition.from = path;
        return new Promise<GetTransitionConfig>(resolve => {
            pendingTransition!.outResolve = resolve;
            checkAndResolve(); // 해결 시도
        });
    } else {
        // IN 처리: to 경로 저장 및 Promise 생성
        pendingTransition.to = path;
        return new Promise<GetTransitionConfig>(resolve => {
            pendingTransition!.inResolve = resolve;
            checkAndResolve(); // 해결 시도
        });
    }
};
```

**동작 순서**:

1. **OUT 호출**:
    - `from` 경로 저장
    - Promise 생성 및 `outResolve` 저장
    - `checkAndResolve` 호출 (아직 `to`가 없으므로 대기)

2. **IN 호출**:
    - `to` 경로 저장
    - Promise 생성 및 `inResolve` 저장
    - `checkAndResolve` 호출 (이제 `from`과 `to` 모두 있으므로 해결)

#### 반환 함수: `SsgoiContext`

```typescript
return (path: string) => {
    return {
        key: path,
        in: async (element: HTMLElement) => {
            // 스크롤 추적 시작
            startScrollTracking(element, path);

            // 전환 설정 획득
            const transitionConfig = await getTransition(path, "in");
            return transitionConfig(element);
        },
        out: async (element: HTMLElement) => {
            const transitionConfig = await getTransition(path, "out");
            return transitionConfig(element);
        }
    };
};
```

**구조**:

- **입력**: 경로 문자열
- **출력**: `{ key, in, out }` 객체
- **key**: 전환 식별자 (경로)
- **in**: 입장 애니메이션 함수
- **out**: 퇴장 애니메이션 함수

## 🔍 전환 매칭 시스템

### `findMatchingTransition`

경로 패턴을 매칭하여 적절한 전환을 찾는 함수입니다.

```typescript
function findMatchingTransition<TContext>(
    from: string,
    to: string,
    transitions: Array<{
        from: string;
        to: string;
        transition: Transition<TContext>;
    }>
): Transition<TContext> | null {
    // 1차: 정확한 매칭 시도
    for (const config of transitions) {
        if (matchPath(from, config.from) && matchPath(to, config.to)) {
            return config.transition;
        }
    }

    // 2차: 와일드카드 매칭 시도
    for (const config of transitions) {
        if ((config.from === "*" || matchPath(from, config.from)) && (config.to === "*" || matchPath(to, config.to))) {
            return config.transition;
        }
    }

    return null;
}
```

**매칭 우선순위**:

1. **정확한 매칭**: from과 to 모두 정확히 일치
2. **와일드카드 매칭**: `*` 또는 패턴 매칭 사용

### `matchPath`

개별 경로 패턴 매칭 함수입니다.

```typescript
function matchPath(path: string, pattern: string): boolean {
    // 1. 전체 매칭 - 모든 경로와 일치
    if (pattern === "*") {
        return true;
    }

    // 2. 와일드카드 매칭 - 서브경로 포함
    if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -2); // "/*" 제거
        return path === prefix || path.startsWith(prefix + "/");
    }

    // 3. 정확한 매칭 - 경로가 동일해야 함
    return path === pattern;
}
```

**매칭 예시**:

```typescript
matchPath("/products", "/products"); // true  (정확한 매칭)
matchPath("/products/123", "/products/*"); // true  (와일드카드 매칭)
matchPath("/products/123", "/products"); // false (정확한 매칭 실패)
matchPath("/anything", "*"); // true  (전체 매칭)
```

## 🎮 사용 시나리오

### 1. 기본 페이지 전환

```typescript
const config = {
    defaultTransition: fade()
};

const context = createSggoiTransitionContext(config);

// 사용
const homeTransition = context("/home");
// homeTransition.in(element) 또는 homeTransition.out(element) 호출
```

### 2. 경로별 차별화된 전환

```typescript
const config = {
    transitions: [
        {from: "/home", to: "/about", transition: slide({direction: "left"})},
        {from: "/products", to: "/products/*", transition: scale()}
    ],
    defaultTransition: fade()
};
```

### 3. 대칭 전환

```typescript
const config = {
    transitions: [
        {
            from: "/gallery",
            to: "/photo/*",
            transition: hero(),
            symmetric: true // 자동으로 '/photo/*' → '/gallery' 전환도 생성
        }
    ]
};
```

### 4. 미들웨어 사용

```typescript
const config = {
    transitions: [{from: "/user", to: "/user", transition: fade()}],
    middleware: (from, to) => {
        // 쿼리 파라미터 제거
        const cleanFrom = from.split("?")[0];
        const cleanTo = to.split("?")[0];
        return {from: cleanFrom, to: cleanTo};
    }
};
```

## 🔄 전환 생명주기

### 1. 정상적인 페이지 전환

```
[현재 페이지] → [새 페이지]
      ↓              ↓
   OUT 호출       IN 호출
      ↓              ↓
pendingTransition 상태:
{ from: '/current' } → { from: '/current', to: '/new' }
      ↓
checkAndResolve() 실행
      ↓
전환 매칭 및 애니메이션 시작
      ↓
pendingTransition = null
```

### 2. 페이지 새로고침 (OUT 없음)

```
[새 페이지] (직접 접근)
      ↓
   IN 호출
      ↓
pendingTransition이 없거나 from이 없음
      ↓
빈 전환 반환 (애니메이션 없음)
```

### 3. 뒤로가기/앞으로가기

```
브라우저 히스토리 이벤트
      ↓
정상적인 페이지 전환과 동일
(스크롤 위치는 자동으로 복원됨)
```

## 🧩 스크롤 관리 상세

### 스크롤 컨테이너 찾기

`getScrollingElement` 유틸리티를 사용하여 스크롤 가능한 요소를 찾습니다:

```typescript
// utils.ts에서
export const getScrollingElement = (element: HTMLElement): HTMLElement => {
    let current = element.parentElement;

    while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const overflow = style.overflow + style.overflowY + style.overflowX;

        // 스크롤 가능한 요소 체크
        if (overflow.includes("auto") || overflow.includes("scroll")) {
            return current;
        }

        // 실제 스크롤이 있는지 체크
        if (current.scrollHeight > current.clientHeight || current.scrollWidth > current.clientWidth) {
            return current;
        }

        current = current.parentElement;
    }

    // 대체: document.documentElement 반환
    return document.documentElement;
};
```

### 스크롤 이벤트 처리

중요한 구현 디테일:

```typescript
// document.documentElement인 경우 window에 이벤트 부착
const target = scrollContainer === document.documentElement ? window : scrollContainer;
target.addEventListener("scroll", scrollListener, {passive: true});
```

**이유**: `document.documentElement`는 직접적으로 스크롤 이벤트를 발생시키지 않기 때문에 `window`에 이벤트 리스너를 부착해야 합니다.

### 스크롤 오프셋 활용

애니메이션에서 스크롤 오프셋을 활용하는 예시:

```typescript
const scrollAwareTransition = {
    in: (element, context) => {
        const {scrollOffset} = context;
        return {
            prepare: el => {
                // 스크롤 차이만큼 이동한 상태로 시작
                el.style.transform = `translateY(${-scrollOffset.y}px)`;
            },
            tick: progress => ({
                // 원래 위치로 복원
                transform: `translateY(${-scrollOffset.y * (1 - progress)}px)`
            })
        };
    }
};
```

## 🔧 에러 처리 및 엣지 케이스

### 1. 페이지 새로고침 처리

```typescript
if (type === "in") {
    if (!pendingTransition || !pendingTransition.from) {
        return () => ({}); // 빈 전환 반환
    }
}
```

### 2. 전환 없음 처리

```typescript
const result = transition || defaultTransition;
if (result) {
    // 전환 실행
} else {
    // 전환이 없으면 아무것도 하지 않음
}
```

### 3. 스크롤 위치 없음 처리

```typescript
const fromScroll = from && scrollPositions.has(from) ? scrollPositions.get(from)! : {x: 0, y: 0}; // 기본값 사용
```

## 🎯 성능 최적화

### 1. 메모이제이션

- 스크롤 컨테이너는 한 번만 찾아서 재사용
- 전환 설정은 캐시되어 재사용

### 2. 이벤트 최적화

```typescript
target.addEventListener("scroll", scrollListener, {
    passive: true // 스크롤 성능 최적화
});
```

### 3. 메모리 관리

- `pendingTransition`은 해결 후 즉시 `null`로 초기화
- 스크롤 위치는 Map으로 효율적으로 관리

## 📝 요약

`create-ssgoi-transition-context.ts`는 SSGOI의 핵심으로서:

1. **페이지 전환 동기화**: OUT과 IN 애니메이션의 완벽한 조율
2. **스크롤 위치 관리**: 페이지 간 부드러운 스크롤 전환
3. **경로 매칭**: 유연하고 강력한 경로 패턴 매칭
4. **대칭 전환**: 양방향 내비게이션의 자동 생성
5. **에러 처리**: 다양한 엣지 케이스에 대한 안정적인 처리

이 모든 기능이 하나의 파일에 응집되어 있으면서도, 각각의 역할이 명확히 분리되어 있어 유지보수성과 확장성을 보장합니다.
