# SSGOI 페이지 전환 감지 및 애니메이션 실행 흐름 분석

## 개요

SSGOI는 기존 라우터를 변경하지 않고도 페이지 전환 애니메이션을 제공하는 라이브러리입니다. 이 문서는 **페이지 전환을 어떻게 감지하는지**, **감지 후 애니메이션을 어떻게 실행하는지**, **애니메이션 완료 후 어떻게 자연스럽게 페이지 이동이 되는지**에 대한 완전한 흐름을 분석합니다.

## 1. 페이지 전환 감지 메커니즘

### 1.1 프레임워크별 감지 방식

SSGOI는 라우터 이벤트를 직접 가로채지 않고, **프레임워크의 생명주기 이벤트**를 통해 페이지 전환을 감지합니다.

#### React - useLayoutEffect를 통한 감지

```tsx
// packages/react/src/lib/ssgoi-transition.tsx
export function SsgoiTransition({id, children}: SsgoiTransitionProps) {
    const transitionContext = useContext(TransitionContext);
    const elementRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        if (!transitionContext || !elementRef.current) return;

        // 컴포넌트가 마운트될 때 전환 컨텍스트에 등록
        const cleanup = transitionContext.register(elementRef.current, id);
        return cleanup;
    }, [transitionContext, id]);

    return <div ref={elementRef}>{children}</div>;
}
```

**React 감지 흐름:**

1. `SsgoiTransition` 컴포넌트의 `useLayoutEffect`가 DOM 변경을 감지
2. 새로운 페이지가 마운트되면 `transitionContext.register()` 호출
3. 이전 페이지가 언마운트되면 cleanup 함수 실행

#### Svelte - onMount/onDestroy를 통한 감지

```svelte
<!-- packages/svelte/src/lib/ssgoi-transition.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getContext } from 'svelte';

  let element: HTMLElement;
  let cleanup: (() => void) | undefined;

  onMount(() => {
    const transitionContext = getContext('ssgoi-context');
    if (transitionContext && element) {
      cleanup = transitionContext.register(element, id);
    }
  });

  onDestroy(() => {
    cleanup?.();
  });
</script>

<div bind:this={element}>
  <slot />
</div>
```

#### Vue - mounted/unmounted 훅을 통한 감지

```vue
<!-- packages/vue/src/lib/ssgoi-transition.vue -->
<template>
    <div ref="elementRef">
        <slot />
    </div>
</template>

<script setup>
import {onMounted, onUnmounted, inject, ref} from "vue";

const elementRef = ref();
let cleanup;

onMounted(() => {
    const transitionContext = inject("ssgoi-context");
    if (transitionContext && elementRef.value) {
        cleanup = transitionContext.register(elementRef.value, id);
    }
});

onUnmounted(() => {
    cleanup?.();
});
</script>
```

### 1.2 전환 컨텍스트 관리

모든 프레임워크에서 공통으로 사용하는 `create-ssgoi-transition-context.ts`가 실제 전환 로직을 담당합니다.

```typescript
// packages/core/src/lib/create-ssgoi-transition-context.ts
export function createSsgoiTransitionContext(config: SsgoiConfig = {}) {
    let pendingTransition: {
        promise: Promise<void>;
        toId: string;
        toElement: HTMLElement;
    } | null = null;

    return {
        register(element: HTMLElement, id: string) {
            // 새로운 페이지가 등록되면 전환 처리
            if (pendingTransition && pendingTransition.toId === id) {
                // 대기 중인 전환이 있고 ID가 일치하면 IN 애니메이션 시작
                pendingTransition.toElement = element;
                checkAndResolve();
            }

            return () => {
                // 페이지가 언마운트되면 OUT 애니메이션 시작
                if (currentElement === element) {
                    startOutTransition(element, id);
                }
            };
        }
    };
}
```

## 2. 페이지 전환 애니메이션 실행 흐름

### 2.1 전환 감지 및 시작

페이지 전환이 감지되면 다음과 같은 순서로 실행됩니다:

```typescript
// 1. 이전 페이지 언마운트 감지 (OUT 전환 시작)
function startOutTransition(element: HTMLElement, fromId: string) {
    // 현재 스크롤 위치 저장
    saveScrollPosition(fromId);

    // 전환 설정 검색
    const transition = findMatchingTransition(fromId, pendingToId);

    // OUT 애니메이션 실행
    if (transition) {
        const outAnimation = await transition.out(element);
        executeAnimation(outAnimation);
    }
}

// 2. 새로운 페이지 마운트 감지 (IN 전환 시작)
function startInTransition(element: HTMLElement, toId: string) {
    // 전환 설정 검색
    const transition = findMatchingTransition(pendingFromId, toId);

    // IN 애니메이션 실행
    if (transition) {
        const inAnimation = await transition.in(element);
        executeAnimation(inAnimation);
    }

    // 스크롤 위치 복원
    restoreScrollPosition(toId);
}
```

### 2.2 비동기 전환 동기화

SSGOI의 핵심은 OUT과 IN 애니메이션의 **동기화**입니다:

```typescript
// checkAndResolve 함수에서 OUT/IN 동기화
async function checkAndResolve() {
    if (!pendingTransition) return;

    const {toElement, toId} = pendingTransition;

    // OUT 애니메이션과 IN 애니메이션을 병렬로 실행
    const [outResult, inResult] = await Promise.all([executeOutTransition(currentElement, currentId), executeInTransition(toElement, toId)]);

    // 두 애니메이션이 모두 완료되면 정리
    cleanupTransition();
}
```

### 2.3 애니메이션 실행 엔진

실제 애니메이션은 Popmotion 스프링 물리 엔진을 사용합니다:

```typescript
// packages/core/src/lib/animator.ts
export async function executeTransition(transition: TransitionFunction, element: HTMLElement): Promise<void> {
    return new Promise(resolve => {
        const config = transition(element);

        // Popmotion spring을 사용한 애니메이션
        const animation = spring({
            from: 0,
            to: 1,
            stiffness: config.spring.stiffness,
            damping: config.spring.damping
        }).start({
            update: progress => {
                // 매 프레임마다 tick 콜백 호출
                config.tick?.(progress);
            },
            complete: () => {
                // 애니메이션 완료시 정리
                config.onEnd?.();
                resolve();
            }
        });
    });
}
```

## 3. 프레임워크별 구현 예시

### 3.1 React Demo 애플리케이션

```tsx
// apps/docs/src/components/demo/layout.tsx
export default function DemoLayout({children}: DemoLayoutProps) {
    const router = useDemoRouter();
    const currentPath = router.currentPath || "";

    // 스크롤 위치 관리
    const scrollPositions = useRef<Record<string, number>>({});

    useLayoutEffect(() => {
        // 페이지 변경시 스크롤 위치 복원
        if (!mainRef.current) return;
        const savedPosition = scrollPositions.current[currentPath] || 0;
        mainRef.current.scrollTop = savedPosition;
    }, [currentPath]);

    const config: SsgoiConfig = useMemo(
        () => ({
            transitions: [
                {
                    from: "/demo/posts",
                    to: "/demo/posts/*",
                    transition: {
                        in: async element => ({
                            spring: {stiffness: 300, damping: 30},
                            tick: progress => {
                                element.style.transform = `translateX(${30 * (1 - progress)}px)`;
                                element.style.opacity = progress.toString();
                            }
                        }),
                        out: async element => ({
                            spring: {stiffness: 300, damping: 30},
                            tick: progress => {
                                element.style.transform = `translateX(${-30 * progress}px)`;
                                element.style.opacity = (1 - progress).toString();
                            }
                        })
                    }
                }
            ]
        }),
        []
    );

    return (
        <Ssgoi config={config}>
            <main ref={mainRef}>{children}</main>
        </Ssgoi>
    );
}
```

### 3.2 페이지 컴포넌트 구현

```tsx
// apps/docs/src/components/demo/posts/index.tsx
export default function PostsDemo() {
    return (
        <SsgoiTransition id="/demo/posts">
            <div className="posts-container">{/* 포스트 목록 */}</div>
        </SsgoiTransition>
    );
}

// 상세 페이지
export default function PostDetail({slug}) {
    return (
        <SsgoiTransition id={`/demo/posts/${slug}`}>
            <article>{/* 포스트 내용 */}</article>
        </SsgoiTransition>
    );
}
```

## 4. 자연스러운 페이지 이동 완료 과정

### 4.1 애니메이션 완료 후 정리

```typescript
// 애니메이션 완료 후 상태 정리
function cleanupTransition() {
    // 1. 임시 스타일 제거
    if (currentElement) {
        currentElement.style.transform = "";
        currentElement.style.opacity = "";
        currentElement.style.position = "";
    }

    // 2. 전환 상태 초기화
    pendingTransition = null;
    currentElement = newElement;
    currentId = newId;

    // 3. 스크롤 위치 최종 조정
    restoreScrollPosition(newId);

    // 4. 브라우저 히스토리 동기화 (필요시)
    syncBrowserHistory();
}
```

### 4.2 스크롤 위치 관리

```typescript
// 스크롤 위치 저장 및 복원
const scrollPositions = new Map<string, number>();

function saveScrollPosition(pageId: string) {
    const scrollElement = getScrollElement();
    if (scrollElement) {
        scrollPositions.set(pageId, scrollElement.scrollTop);
    }
}

function restoreScrollPosition(pageId: string) {
    const scrollElement = getScrollElement();
    const savedPosition = scrollPositions.get(pageId) || 0;

    if (scrollElement) {
        // 애니메이션 완료 후 스크롤 위치 복원
        requestAnimationFrame(() => {
            scrollElement.scrollTop = savedPosition;
        });
    }
}
```

## 5. 고급 전환 패턴

### 5.1 Hero 전환 (Shared Element)

```typescript
// packages/core/src/lib/view-transitions/hero.ts
export const hero = (): SggoiTransition => {
    let fromNode: HTMLElement | null = null;

    return {
        in: async element => {
            // 들어오는 페이지에서 hero 요소 찾기
            const heroElements = element.querySelectorAll("[data-hero-key]");

            heroElements.forEach(heroEl => {
                const key = heroEl.getAttribute("data-hero-key");
                const fromEl = fromNode?.querySelector(`[data-hero-key="${key}"]`);

                if (fromEl) {
                    // 위치와 크기 계산
                    const fromRect = fromEl.getBoundingClientRect();
                    const toRect = heroEl.getBoundingClientRect();

                    // 변형 애니메이션 적용
                    const dx = fromRect.left - toRect.left;
                    const dy = fromRect.top - toRect.top;
                    const scaleX = fromRect.width / toRect.width;
                    const scaleY = fromRect.height / toRect.height;

                    return {
                        prepare: () => {
                            heroEl.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
                        },
                        tick: progress => {
                            const currentDx = dx * (1 - progress);
                            const currentDy = dy * (1 - progress);
                            const currentScaleX = scaleX + (1 - scaleX) * progress;
                            const currentScaleY = scaleY + (1 - scaleY) * progress;

                            heroEl.style.transform = `translate(${currentDx}px, ${currentDy}px) 
                 scale(${currentScaleX}, ${currentScaleY})`;
                        }
                    };
                }
            });
        },

        out: async element => {
            fromNode = element; // 나가는 요소 저장
            return {
                tick: progress => {
                    element.style.opacity = (1 - progress).toString();
                }
            };
        }
    };
};
```

### 5.2 Pinterest 스타일 전환

```typescript
// packages/core/src/lib/view-transitions/pinterest.ts
export const pinterest = (): SggoiTransition => {
    return {
        in: async element => {
            // 클릭된 요소 위치에서 확장되는 애니메이션
            const clickPosition = getLastClickPosition();

            return {
                prepare: () => {
                    element.style.clipPath = `circle(0% at ${clickPosition.x}px ${clickPosition.y}px)`;
                },
                tick: progress => {
                    const radius = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2));
                    const currentRadius = radius * progress;

                    element.style.clipPath = `circle(${currentRadius}px at ${clickPosition.x}px ${clickPosition.y}px)`;
                }
            };
        },

        out: async element => {
            return {
                tick: progress => {
                    element.style.transform = `scale(${1 - progress * 0.05})`;
                    element.style.opacity = (1 - progress).toString();
                }
            };
        }
    };
};
```

## 6. 라우터 통합 패턴

### 6.1 Next.js App Router

```tsx
// app/layout.tsx
import {Ssgoi} from "@ssgoi/react";

export default function RootLayout({children}) {
    return (
        <html>
            <body>
                <Ssgoi config={ssgoiConfig}>
                    <div style={{position: "relative", minHeight: "100vh"}}>{children}</div>
                </Ssgoi>
            </body>
        </html>
    );
}

// app/page.tsx
import {SsgoiTransition} from "@ssgoi/react";

export default function HomePage() {
    return (
        <SsgoiTransition id="/">
            <main>홈 페이지 내용</main>
        </SsgoiTransition>
    );
}
```

### 6.2 SvelteKit

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
  <main>홈 페이지 내용</main>
</SsgoiTransition>
```

## 7. 성능 최적화

### 7.1 지연 로딩 및 프리페치

```tsx
// 페이지 프리페치
useEffect(() => {
    // 중요한 페이지들 미리 로드
    router.prefetch("/products");
    router.prefetch("/about");
}, []);

// 조건부 프리페치
const handleProductHover = (productId: string) => {
    router.prefetch(`/products/${productId}`);
};
```

### 7.2 메모리 관리

```typescript
// 전환 완료 후 리소스 정리
function cleanupTransition() {
    // 애니메이션 인스턴스 해제
    currentAnimation?.stop();
    currentAnimation = null;

    // 임시 DOM 요소 제거
    document.querySelectorAll(".ssgoi-temp").forEach(el => el.remove());

    // 이벤트 리스너 제거
    window.removeEventListener("beforeunload", handleBeforeUnload);
}
```

## 8. 디버깅 및 개발 도구

### 8.1 전환 상태 모니터링

```typescript
// 개발 모드에서 전환 상태 로깅
if (process.env.NODE_ENV === "development") {
    console.log("SSGOI Transition:", {
        from: fromId,
        to: toId,
        transition: transitionName,
        duration: Date.now() - startTime
    });
}
```

### 8.2 성능 메트릭

```typescript
// 전환 성능 측정
const performanceObserver = new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
        if (entry.name.startsWith("ssgoi-transition")) {
            console.log(`${entry.name}: ${entry.duration}ms`);
        }
    });
});

performanceObserver.observe({entryTypes: ["measure"]});
```

## 결론

SSGOI의 페이지 전환 시스템은 다음과 같은 핵심 원리로 동작합니다:

1. **프레임워크 생명주기 기반 감지**: 라우터를 변경하지 않고 컴포넌트 마운트/언마운트 이벤트를 활용
2. **비동기 전환 동기화**: OUT과 IN 애니메이션을 병렬로 실행하여 부드러운 전환
3. **물리 기반 애니메이션**: Popmotion 스프링을 사용한 자연스러운 움직임
4. **상태 관리**: 스크롤 위치, 전환 상태, 애니메이션 컨텍스트의 체계적 관리
5. **프레임워크 독립성**: 각 프레임워크의 특성을 활용하면서도 공통 코어 유지

이러한 설계를 통해 SSGOI는 기존 라우팅 시스템을 그대로 유지하면서도 네이티브 앱 수준의 페이지 전환 경험을 제공합니다.
