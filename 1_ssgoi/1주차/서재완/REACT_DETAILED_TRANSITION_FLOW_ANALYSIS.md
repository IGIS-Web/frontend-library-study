# React SSGOI 페이지 전환 상세 플로우 분석: "/" → "/item/123"

## 개요

이 문서는 React 기반 SSGOI 애플리케이션에서 루트 경로 "/"에서 상세 페이지 "/item/123"으로 이동할 때의 **완전한 페이지 전환 플로우**를 단계별로 분석합니다. 각 함수와 컴포넌트의 역할, IN/OUT 애니메이션의 원리, 그리고 전체 동작 메커니즘을 상세하게 설명합니다.

## 1. 초기 설정 및 컴포넌트 구조

### 1.1 애플리케이션 구조

```tsx
// app/layout.tsx - 최상위 레이아웃
import {Ssgoi} from "@ssgoi/react";
import {slide, fade} from "@ssgoi/react/view-transitions";

const config = {
    transitions: [
        {
            from: "/",
            to: "/item/*",
            transition: slide({direction: "left"}),
            symmetric: false
        }
    ],
    defaultTransition: fade()
};

export default function RootLayout({children}) {
    return (
        <html>
            <body>
                <Ssgoi config={config}>
                    <div style={{position: "relative", minHeight: "100vh"}}>{children}</div>
                </Ssgoi>
            </body>
        </html>
    );
}
```

```tsx
// app/page.tsx - 홈 페이지
import {SsgoiTransition} from "@ssgoi/react";

export default function HomePage() {
    return (
        <SsgoiTransition id="/">
            <div>
                <h1>홈 페이지</h1>
                <Link href="/item/123">아이템 보기</Link>
            </div>
        </SsgoiTransition>
    );
}
```

```tsx
// app/item/[id]/page.tsx - 상세 페이지
import {SsgoiTransition} from "@ssgoi/react";

export default function ItemPage({params}) {
    return (
        <SsgoiTransition id={`/item/${params.id}`}>
            <div>
                <h1>아이템 {params.id}</h1>
                <Link href="/">홈으로 돌아가기</Link>
            </div>
        </SsgoiTransition>
    );
}
```

## 2. 컴포넌트 및 함수 역할 분석

### 2.1 핵심 컴포넌트들

#### `<Ssgoi>` - 전환 컨텍스트 프로바이더

```tsx
// packages/react/src/lib/ssgoi.tsx
export const Ssgoi: React.FC<SsgoiProps> = ({config, children}) => {
    const contextValue = useMemo<SsgoiContext>(() => createSggoiTransitionContext(config), [config]);

    return <SsgoiProvider value={contextValue}>{children}</SsgoiProvider>;
};
```

**역할:**

- SSGOI 전환 설정(`config`)을 받아 전환 컨텍스트를 생성
- `createSggoiTransitionContext()`를 통해 전환 로직의 핵심 인스턴스 생성
- React Context로 하위 컴포넌트들에게 전환 기능 제공

#### `<SsgoiTransition>` - 페이지 래퍼 컴포넌트

```tsx
// packages/react/src/lib/ssgoi-transition.tsx
export const SsgoiTransition = ({children, id}: SsgoiTransitionProps) => {
    const getTransition = useSsgoi();

    return (
        <div ref={transition(getTransition(id))} data-ssgoi-transition={id}>
            {children}
        </div>
    );
};
```

**역할:**

- 각 페이지를 래핑하여 전환 대상으로 등록
- `id` prop으로 페이지를 식별 (라우터 패턴 매칭에 사용)
- `transition()` 함수를 통해 DOM 요소에 전환 로직 연결
- `useSsgoi()` 훅으로 전환 컨텍스트에서 해당 페이지의 전환 설정 가져오기

### 2.2 핵심 함수들

#### `createSggoiTransitionContext()` - 전환 컨텍스트 생성

```typescript
// packages/core/src/lib/create-ssgoi-transition-context.ts
export function createSggoiTransitionContext(options: SsgoiConfig): SsgoiContext {
    const {transitions = [], defaultTransition, middleware} = options;
    let pendingTransition: PendingTransition | null = null;

    // 대칭 전환 처리 (symmetric: true인 경우 역방향 자동 생성)
    const processedTransitions = processSymmetricTransitions(transitions);

    // 스크롤 관리자 초기화
    const {startScrollTracking, calculateScrollOffset} = createScrollManager();

    // 핵심 동기화 함수
    function checkAndResolve() {
        if (pendingTransition?.from && pendingTransition?.to) {
            // 미들웨어 적용
            const {from: transformedFrom, to: transformedTo} = middleware(pendingTransition.from, pendingTransition.to);

            // 패턴 매칭으로 적절한 전환 찾기
            const transition = findMatchingTransition(transformedFrom, transformedTo, processedTransitions);

            const result = transition || defaultTransition;
            const scrollOffset = calculateScrollOffset(pendingTransition.from, pendingTransition.to);

            // OUT과 IN 애니메이션 동시 해결
            if (result) {
                if (result.out && pendingTransition.outResolve) {
                    pendingTransition.outResolve(element => result.out!(element, {scrollOffset}));
                }
                if (result.in && pendingTransition.inResolve) {
                    pendingTransition.inResolve(element => result.in!(element, {scrollOffset}));
                }
            }

            pendingTransition = null;
        }
    }

    return (path: string) => ({
        key: path,
        in: async (element: HTMLElement) => {
            startScrollTracking(element, path);
            const transitionConfig = await getTransition(path, "in");
            return transitionConfig(element);
        },
        out: async (element: HTMLElement) => {
            const transitionConfig = await getTransition(path, "out");
            return transitionConfig(element);
        }
    });
}
```

**역할:**

- 전환 설정을 받아 실제 전환 함수들을 생성
- `pendingTransition`으로 OUT/IN 애니메이션 상태 추적
- `checkAndResolve()`로 OUT과 IN 애니메이션을 동기화
- 패턴 매칭을 통해 적절한 전환 효과 선택
- 스크롤 위치 관리 및 복원

#### `transition()` - DOM 요소 전환 로직 연결

```typescript
// packages/core/src/lib/transition.ts
export function transition<TAnimationValue = number>(options: {
    key: TransitionKey;
    in?: Transition<undefined, TAnimationValue>["in"];
    out?: Transition<undefined, TAnimationValue>["out"];
}): TransitionCallback {
    return registerTransition(options.key, {
        in: options.in,
        out: options.out
    });
}

function registerTransition<TAnimationValue = number>(key: TransitionKey, transition: Transition<undefined, TAnimationValue>): TransitionCallback {
    // 전환 정의 저장
    transitionDefinitions.set(key, transition);

    // 기존 콜백이 있으면 재사용
    let callback = transitionCallbacks.get(key);
    if (callback) return callback;

    // 새 콜백 생성
    callback = createTransitionCallback(() => transitionDefinitions.get(key) || {}, {onCleanupEnd: () => unregisterTransition(key)});

    transitionCallbacks.set(key, callback);
    return callback;
}
```

**역할:**

- DOM 요소에 전환 로직을 연결하는 ref 콜백 생성
- 전환 정의를 키 기반으로 등록 및 관리
- `createTransitionCallback()`을 통해 실제 전환 실행 로직 생성

#### `createTransitionCallback()` - 전환 실행 콜백 생성

```typescript
// packages/core/src/lib/create-transition-callback.ts
export function createTransitionCallback<TAnimationValue = number>(getTransition: () => Transition<undefined, TAnimationValue>): TransitionCallback {
    let currentAnimation: {animator: Animator<TAnimationValue>; direction: "in" | "out"} | null = null;
    let currentClone: HTMLElement | null = null;

    const runEntrance = async (element: HTMLElement) => {
        // 기존 클론 정리
        if (currentClone) {
            currentClone.remove();
            currentClone = null;
        }

        const transition = getTransition();
        const configs = {
            in: transition.in && Promise.resolve(transition.in(element)),
            out: transition.out && Promise.resolve(transition.out(element))
        };

        // 전환 전략을 통해 애니메이션 설정 가져오기
        const setup = await strategy.runIn(configs);
        if (!setup.config) return;

        // 애니메이션 준비
        setup.config.prepare?.(element);

        // Animator 생성 및 실행
        const animator = Animator.fromState(setup.state, {
            from: setup.from,
            to: setup.to,
            spring: setup.config.spring,
            onStart: setup.config.onStart,
            onUpdate: setup.config.tick,
            onComplete: () => {
                currentAnimation = null;
                setup.config?.onEnd?.();
            }
        });

        currentAnimation = {animator, direction: "in"};
        animator.forward(); // 0 → 1 방향으로 애니메이션
    };

    const runExitTransition = async (element: HTMLElement) => {
        // 요소를 클론하여 애니메이션 실행
        currentClone = element;

        // ... OUT 애니메이션 로직

        currentAnimation = {animator, direction: "out"};
        animator.forward(); // 1 → 0 방향으로 애니메이션
    };

    // 실제 ref 콜백 반환
    return (element: HTMLElement | null) => {
        if (element) {
            runEntrance(element);
            return () => runExitTransition(element);
        }
    };
}
```

**역할:**

- DOM 요소가 마운트/언마운트될 때 실행되는 콜백 생성
- 입장(runEntrance)과 퇴장(runExitTransition) 애니메이션 관리
- Animator를 통한 실제 애니메이션 실행 제어

## 3. "/" → "/item/123" 전환 플로우 상세 분석

### 3.1 Phase 1: 사용자 액션 및 라우터 변경

```
사용자가 링크 클릭 → Next.js 라우터가 경로 변경 시작 → React 컴포넌트 트리 업데이트
```

1. **사용자 액션**: 홈페이지의 "아이템 보기" 링크 클릭
2. **라우터 처리**: Next.js App Router가 `/item/123` 경로로 네비게이션 시작
3. **컴포넌트 준비**: React가 새로운 페이지 컴포넌트를 렌더링 준비

### 3.2 Phase 2: OUT 애니메이션 시작 (홈페이지 퇴장)

```typescript
// 홈페이지 SsgoiTransition 컴포넌트의 cleanup 함수 실행
// packages/react/src/lib/ssgoi-transition.tsx에서

// 1. useLayoutEffect cleanup 실행
useLayoutEffect(() => {
    // ... 마운트 로직
    return () => {
        // ✅ 이 부분이 실행됨 - 홈페이지가 언마운트될 때
        runExitTransition(elementRef.current);
    };
}, []);
```

**상세 과정:**

1. **컴포넌트 언마운트 감지**

    ```tsx
    // SsgoiTransition의 내부에서
    <div ref={transition(getTransition("/"))} data-ssgoi-transition="/">
        {children}
    </div>
    ```

    - React가 홈페이지 컴포넌트를 DOM에서 제거하려 할 때
    - `transition()` 함수가 반환한 **ref 콜백의 cleanup 함수** 실행

    ⚠️ **주의**: 여기서 `unregisterTransition`이 바로 실행되지 않습니다! 이는 **애니메이션 완료 후**에만 실행됩니다.

2. **OUT 애니메이션 시작 시도**

    ```typescript
    // createTransitionCallback에서 cleanup 함수가 호출되면
    const runExitTransition = async (element: HTMLElement) => {
        // 이 시점에서 getTransition이 호출됨!
        const transition = getTransition(); // 이게 바로 getTransition("/") 호출!

        // getTransition()은 createSsgoiTransitionContext에서 만들어진 함수
        // 이 함수가 path="/"와 type="out"으로 실제 전환 설정을 요청
    };
    ```

3. **getTransition("/") 실제 호출**

    ```typescript
    // createSggoiTransitionContext.ts에서
    const getTransition = async (path: string, type: "out" | "in") => {
        if (type === "out") {
            pendingTransition = pendingTransition || {};
            pendingTransition.from = path; // "/" 저장

            return new Promise<GetTransitionConfig>(resolve => {
                pendingTransition!.outResolve = resolve; // 해결 함수 저장
                checkAndResolve(); // 동기화 확인
            });
        }
    };
    ```

4. **pendingTransition 상태 변경**

    ```typescript
    // 이 시점에서 pendingTransition:
    {
      from: "/",           // ✅ OUT 애니메이션 정보
      to: undefined,       // ❌ 아직 IN 애니메이션 대기 중
      outResolve: Function,// ✅ OUT 해결 함수 저장됨
      inResolve: undefined // ❌ IN 해결 함수 대기 중
    }
    ```

5. **checkAndResolve() 호출 (첫 번째)**
    ```typescript
    function checkAndResolve() {
        if (pendingTransition?.from && pendingTransition?.to) {
            // ❌ 'to'가 없으므로 아직 실행되지 않음
            // OUT 애니메이션은 IN 애니메이션을 기다림
        }
    }
    ```

**🔄 중요한 점: OUT 애니메이션이 바로 시작되지 않고 IN 애니메이션을 기다립니다!**

### 3.3 Phase 3: IN 애니메이션 준비 (상세페이지 입장)

```typescript
// /item/123 페이지 컴포넌트가 마운트되면서 실행
// packages/react/src/lib/ssgoi-transition.tsx에서

useLayoutEffect(() => {
    // ✅ 이 부분이 실행됨 - 상세페이지가 마운트될 때
    runEntrance(elementRef.current);
}, []);
```

**상세 과정:**

1. **새 페이지 컴포넌트 마운트**

    ```tsx
    // ItemPage 컴포넌트에서
    <SsgoiTransition id="/item/123">
        <div>아이템 123 내용</div>
    </SsgoiTransition>
    ```

2. **getTransition("/item/123") 호출**

    ```typescript
    const getTransition = async (path: string, type: "out" | "in") => {
        if (type === "in") {
            if (!pendingTransition || !pendingTransition.from) {
                return () => ({}); // OUT 없이 IN만 호출되면 빈 전환
            }

            pendingTransition.to = path; // "/item/123" 저장

            return new Promise<GetTransitionConfig>(resolve => {
                pendingTransition!.inResolve = resolve; // IN 해결 함수 저장
                checkAndResolve(); // 🎯 이제 from과 to가 모두 있음!
            });
        }
    };
    ```

3. **pendingTransition 완성**
    ```typescript
    // 이 시점에서 pendingTransition:
    {
      from: "/",              // ✅ OUT 애니메이션 정보
      to: "/item/123",        // ✅ IN 애니메이션 정보
      outResolve: Function,   // ✅ OUT 해결 함수
      inResolve: Function     // ✅ IN 해결 함수
    }
    ```

### 3.4 Phase 4: 전환 매칭 및 동기화 (핵심!)

```typescript
// checkAndResolve() 실행 - 드디어 조건 충족!
function checkAndResolve() {
    if (pendingTransition?.from && pendingTransition?.to) {
        // ✅ 조건 충족: from="/" 그리고 to="/item/123"

        // 1. 미들웨어 적용 (기본값: 그대로 통과)
        const {from: transformedFrom, to: transformedTo} = middleware("/", "/item/123");

        // 2. 패턴 매칭으로 전환 찾기
        const transition = findMatchingTransition(
            "/", // from
            "/item/123", // to
            processedTransitions // 설정된 전환들
        );

        // 3. 매칭된 전환: { from: "/", to: "/item/*", transition: slide({direction: 'left'}) }
        const result = transition; // slide 전환이 매칭됨!

        // 4. 스크롤 오프셋 계산
        const scrollOffset = calculateScrollOffset("/", "/item/123");

        // 5. 🎯 OUT과 IN 애니메이션 동시 해결!
        if (result.out && pendingTransition.outResolve) {
            pendingTransition.outResolve(element => result.out!(element, {scrollOffset}));
        }
        if (result.in && pendingTransition.inResolve) {
            pendingTransition.inResolve(element => result.in!(element, {scrollOffset}));
        }

        // 6. 정리
        pendingTransition = null;
    }
}
```

**패턴 매칭 과정:**

```typescript
function findMatchingTransition(from: "/", to: "/item/123", transitions) {
    for (const config of transitions) {
        if (matchPath("/", config.from) && matchPath("/item/123", config.to)) {
            // config.from = "/"  ✅ 매칭
            // config.to = "/item/*" ✅ 와일드카드 매칭
            return config.transition; // slide({ direction: 'left' }) 반환
        }
    }
    return null;
}
```

### 3.5 Phase 5: 실제 애니메이션 실행

이제 OUT과 IN 애니메이션이 **동시에** 시작됩니다:

#### OUT 애니메이션 (홈페이지)

```typescript
// slide transition의 out 부분
const slide = ({direction = "left"}) => ({
    out: element => ({
        spring: {stiffness: 300, damping: 30},
        prepare: element => {
            // 요소가 사라질 준비
            prepareOutgoing(element);
        },
        tick: progress => {
            // progress: 1 → 0 (OUT 애니메이션)
            const translateX = direction === "left" ? -100 * progress : 100 * progress;
            element.style.transform = `translateX(${translateX}%)`;
            element.style.opacity = (1 - progress).toString();
        },
        onEnd: () => {
            // 애니메이션 완료 후 정리
            element.style.transform = "";
            element.style.opacity = "";
        }
    })
});
```

**실행 과정:**

1. **prepare 단계**: 요소를 애니메이션 준비 상태로 설정
2. **tick 호출**: 매 프레임마다 호출되어 스타일 업데이트
    - `progress: 1.0` → 원래 위치 (transform: translateX(0%), opacity: 1)
    - `progress: 0.5` → 중간 위치 (transform: translateX(-50%), opacity: 0.5)
    - `progress: 0.0` → 완전히 숨김 (transform: translateX(-100%), opacity: 0)

#### IN 애니메이션 (상세페이지)

```typescript
// slide transition의 in 부분
const slide = ({direction = "left"}) => ({
    in: element => ({
        spring: {stiffness: 300, damping: 30},
        prepare: element => {
            // 초기 위치 설정 (화면 오른쪽에서 시작)
            element.style.transform = "translateX(100%)";
            element.style.opacity = "0";
        },
        tick: progress => {
            // progress: 0 → 1 (IN 애니메이션)
            const translateX = (1 - progress) * 100;
            element.style.transform = `translateX(${translateX}%)`;
            element.style.opacity = progress.toString();
        },
        onEnd: () => {
            // 애니메이션 완료 후 정리
            element.style.transform = "";
            element.style.opacity = "";
        }
    })
});
```

**실행 과정:**

1. **prepare 단계**: 요소를 화면 오른쪽에 위치 (translateX(100%))
2. **tick 호출**: 매 프레임마다 호출되어 스타일 업데이트
    - `progress: 0.0` → 화면 밖 (transform: translateX(100%), opacity: 0)
    - `progress: 0.5` → 중간 위치 (transform: translateX(50%), opacity: 0.5)
    - `progress: 1.0` → 최종 위치 (transform: translateX(0%), opacity: 1)

### 3.6 Phase 6: 스프링 물리 엔진을 통한 자연스러운 움직임

```typescript
// packages/core/src/lib/animator.ts
// Popmotion의 spring을 사용한 애니메이션

const animator = Animator.fromState(setup.state, {
    from: 0, // OUT: 1, IN: 0
    to: 1, // OUT: 0, IN: 1
    spring: {stiffness: 300, damping: 30},
    onUpdate: progress => {
        // 매 프레임마다 tick 콜백 호출
        config.tick?.(progress);
    },
    onComplete: () => {
        // 애니메이션 완료
        config.onEnd?.();
    }
});

// 물리적으로 자연스러운 곡선으로 애니메이션
animator.forward();
```

**스프링 물리 특성:**

- **stiffness (300)**: 스프링의 강성도 - 높을수록 빠른 애니메이션
- **damping (30)**: 감쇠율 - 높을수록 덜 진동하는 애니메이션
- **자연스러운 가속/감속**: 선형이 아닌 물리적으로 자연스러운 움직임

### 3.7 Phase 7: 동시 실행 및 완료

```
시간축:
0ms     OUT 애니메이션 시작 ──────┐
        IN 애니메이션 시작 ────────┤ 동시 시작
        │                        │
50ms    ├─ 홈페이지 50% 이동     ├─ 상세페이지 50% 이동
        │                        │
100ms   ├─ 홈페이지 80% 이동     ├─ 상세페이지 80% 이동
        │                        │
120ms   OUT 애니메이션 완료 ──────┘
        IN 애니메이션 완료 ───────┘ 거의 동시 완료
```

**완료 후 정리:**

1. **스타일 초기화**: 모든 transform과 opacity 스타일 제거
2. **메모리 정리**: 애니메이션 인스턴스와 이벤트 리스너 정리
3. **스크롤 복원**: 새 페이지의 저장된 스크롤 위치로 복원
4. **상태 초기화**: pendingTransition을 null로 설정

## 4. IN과 OUT 애니메이션의 원리

### 4.1 OUT 애니메이션 (퇴장)

```typescript
// OUT 애니메이션의 핵심 원리
out: element => ({
    tick: progress => {
        // progress는 1에서 0으로 변함
        // 1.0 = 완전히 보임 (초기 상태)
        // 0.5 = 50% 투명
        // 0.0 = 완전히 숨김 (최종 상태)

        element.style.opacity = progress.toString();

        // direction이 'left'인 경우:
        // progress 1.0: translateX(0%) - 원래 위치
        // progress 0.5: translateX(-50%) - 왼쪽으로 절반 이동
        // progress 0.0: translateX(-100%) - 완전히 왼쪽으로 사라짐
        const translateX = direction === "left" ? -100 * (1 - progress) : 100 * (1 - progress);
        element.style.transform = `translateX(${translateX}%)`;
    }
});
```

**OUT 애니메이션 특징:**

- **진행 방향**: `1 → 0` (완전히 보임 → 완전히 숨김)
- **시각적 효과**: 요소가 점점 사라지면서 화면 밖으로 이동
- **타이밍**: 새 페이지 마운트와 동시에 시작

### 4.2 IN 애니메이션 (입장)

```typescript
// IN 애니메이션의 핵심 원리
in: (element) => ({
  prepare: (element) => {
    // 애니메이션 시작 전 초기 상태 설정
    element.style.transform = 'translateX(100%)'; // 화면 오른쪽에서 시작
    element.style.opacity = '0'; // 투명한 상태로 시작
  },
  tick: (progress) => {
    // progress는 0에서 1로 변함
    // 0.0 = 숨김 상태 (초기)
    // 0.5 = 50% 표시
    // 1.0 = 완전히 보임 (최종 상태)

    element.style.opacity = progress.toString();

    // 화면 오른쪽에서 왼쪽으로 슬라이드
    // progress 0.0: translateX(100%) - 화면 밖 (오른쪽)
    // progress 0.5: translateX(50%) - 중간 위치
    // progress 1.0: translateX(0%) - 최종 위치 (화면 안)
    const translateX = (1 - progress) * 100;
    element.style.transform = `translateX(${translateX}%)`;
  }
})
```

**IN 애니메이션 특징:**

- **진행 방향**: `0 → 1` (완전히 숨김 → 완전히 보임)
- **시각적 효과**: 요소가 화면 밖에서 안으로 슬라이드하며 나타남
- **타이밍**: 이전 페이지 언마운트와 동시에 시작

### 4.3 동기화 메커니즘

```typescript
// OUT과 IN이 동시에 실행되는 원리
Promise.all([executeOutTransition(homeElement, "/"), executeInTransition(itemElement, "/item/123")]).then(() => {
    // 두 애니메이션이 모두 완료되면 정리
    cleanupTransition();
});
```

**동기화의 핵심:**

1. **대기 메커니즘**: OUT 애니메이션은 IN 애니메이션을 기다림
2. **동시 시작**: 두 애니메이션이 정확히 같은 시점에 시작
3. **독립적 실행**: 각각의 요소에서 독립적으로 진행
4. **자연스러운 전환**: 한 요소가 사라지는 동안 다른 요소가 나타남

## 5. 전환 설정과 패턴 매칭

### 5.1 전환 설정 구조

```typescript
const config = {
    transitions: [
        {
            from: "/", // 출발점: 정확한 경로
            to: "/item/*", // 도착점: 와일드카드 패턴
            transition: slide({direction: "left"}),
            symmetric: false // 역방향 자동 생성 안 함
        }
    ],
    defaultTransition: fade() // 매칭되지 않는 경우 기본 전환
};
```

### 5.2 패턴 매칭 로직

```typescript
// findMatchingTransition 함수의 동작
function findMatchingTransition(from: "/", to: "/item/123", transitions) {
    for (const config of transitions) {
        // from 매칭: "/" === "/" ✅
        const fromMatches = matchPath("/", config.from);

        // to 매칭: "/item/123"이 "/item/*" 패턴과 매칭되는가? ✅
        const toMatches = matchPath("/item/123", config.to);

        if (fromMatches && toMatches) {
            return config.transition; // slide({ direction: 'left' })
        }
    }

    return null; // 매칭되지 않으면 defaultTransition 사용
}

function matchPath(path: string, pattern: string): boolean {
    if (pattern === "*") return true; // 모든 경로 매칭
    if (pattern === path) return true; // 정확한 매칭

    // 와일드카드 패턴 처리
    if (pattern.endsWith("/*")) {
        const prefix = pattern.slice(0, -2); // "/item/*" → "/item"
        return path.startsWith(prefix + "/") || path === prefix;
    }

    return false;
}
```

## 6. 성능 최적화 및 메모리 관리

### 6.1 메모리 누수 방지

```typescript
// createTransitionCallback에서의 정리 로직
const cleanup = () => {
    // 1. 애니메이션 중단
    if (currentAnimation) {
        currentAnimation.animator.stop();
        currentAnimation = null;
    }

    // 2. 클론 요소 제거
    if (currentClone) {
        currentClone.remove();
        currentClone = null;
    }

    // 3. 전환 정의 제거
    unregisterTransition(key);

    // 4. 이벤트 리스너 정리
    options?.onCleanupEnd?.();
};
```

### 6.2 성능 최적화

```typescript
// 1. useMemo를 통한 설정 캐싱
const contextValue = useMemo<SsgoiContext>(() => createSggoiTransitionContext(config), [config]);

// 2. requestAnimationFrame을 통한 부드러운 애니메이션
const updateFrame = progress => {
    requestAnimationFrame(() => {
        config.tick?.(progress);
    });
};

// 3. 조건부 애니메이션 실행
if (!setup.config) {
    return; // 설정이 없으면 애니메이션 실행 안 함
}
```

## 7. 디버깅 및 문제 해결

### 7.1 일반적인 문제들

1. **애니메이션이 실행되지 않는 경우**

    ```typescript
    // 디버깅: pendingTransition 상태 확인
    console.log("Pending transition:", pendingTransition);

    // 원인: SsgoiTransition의 id가 설정과 매칭되지 않음
    // 해결: 패턴 매칭 확인
    ```

2. **애니메이션이 끊어지는 경우**

    ```typescript
    // 원인: 스프링 설정이 너무 빠름
    spring: { stiffness: 1000, damping: 10 } // ❌ 너무 강함
    spring: { stiffness: 300, damping: 30 }  // ✅ 적절함
    ```

3. **메모리 누수**
    ```typescript
    // 원인: cleanup 함수가 제대로 호출되지 않음
    // 해결: React의 Strict Mode 확인, useLayoutEffect 의존성 배열 확인
    ```

### 7.2 개발 도구

```typescript
// 개발 모드에서의 로깅
if (process.env.NODE_ENV === "development") {
    console.group("🎬 SSGOI Transition");
    console.log("From:", from);
    console.log("To:", to);
    console.log("Matched transition:", transition);
    console.log("Animation progress:", progress);
    console.groupEnd();
}
```

## 8. 결론

"/" → "/item/123" 전환 과정은 다음과 같은 핵심 원리로 동작합니다:

1. **생명주기 기반 감지**: React의 useLayoutEffect를 통한 마운트/언마운트 감지
2. **지연 동기화**: OUT 애니메이션이 IN 애니메이션을 기다려 동시 실행
3. **패턴 매칭**: 설정된 전환 규칙을 통한 적절한 애니메이션 선택
4. **물리 기반 애니메이션**: Popmotion 스프링을 통한 자연스러운 움직임
5. **메모리 안전성**: 자동적인 리소스 정리 및 상태 초기화

이러한 설계를 통해 SSGOI는 기존 React Router나 Next.js 라우터를 변경하지 않고도 네이티브 앱 수준의 페이지 전환 경험을 제공합니다.
