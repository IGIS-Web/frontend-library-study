### fade 트랜지션 분석 및 물리엔진 vs css

**예시 - fade**

```ts
import type {SpringConfig, SggoiTransition} from "../types";
import {prepareOutgoing, sleep} from "../utils";

const DEFAULT_OUT_SPRING = {stiffness: 400, damping: 20};
const DEFAULT_IN_SPRING = {stiffness: 40, damping: 8};
const DEFAULT_TRANSITION_DELAY = 100;

interface FadeOptions {
    inSpring?: SpringConfig;
    outSpring?: SpringConfig;
    transitionDelay?: number;
}

export const fade = (options: FadeOptions = {}): SggoiTransition => {
    const {
        inSpring = DEFAULT_IN_SPRING,
        outSpring = DEFAULT_OUT_SPRING,
        transitionDelay = DEFAULT_TRANSITION_DELAY,
    } = options;
    // OUT 애니메이션이 종료됨을 알리는 Promise
    let outAnimationComplete: Promise<void>;
    let resolveOutAnimation: (() => void) | null = null;

    return {
        in: (element) => {
            return {
                spring: inSpring,
                prepare: (element) => {
                    element.style.opacity = "0";
                },
                wait: async () => {
                    // wait 역할:  OUT 애니메이션이 끝날때까지 기다림
                    if (outAnimationComplete) {
                        await outAnimationComplete;
                        // 직전 OUT이 완전히 끝난 후 지연 처리
                        await sleep(transitionDelay);
                    }
                },
                tick: (progress) => {
                    element.style.opacity = progress.toString();
                },
            };
        },
        out: (element) => {
            // OUT 애니메이션 완료시 resolve 실행
            outAnimationComplete = new Promise((resolve) => {
                resolveOutAnimation = resolve;
            });

            return {
                spring: outSpring,
                tick: (progress) => {
                    element.style.opacity = progress.toString();
                prepare: prepareOutgoing, // OUT 애니메이션 초기화
                onEnd: () => {
                    if (resolveOutAnimation) {
                        resolveOutAnimation(); // OUT 애니메이션이 끝났다고 알려줌
                    }
                },
            };
        },
    };
};
```

**각 필드/함수의 역할**

- spring: 물리 스프링 설정값. 엔진이 이 값을 보고 시간 대비 progress(진행률)을 계산해 tick(progress)를 반복 호출합니다.
- prepare(element): 애니메이션 시작 “직전” 1회 호출. 초기 스타일을 세팅하는 곳.
- wait(): IN 전용 훅. 필요 시 어떤 비동기 작업(이전 OUT 완료 + 지연)을 기다립니다.
- tick(progress): 프레임마다 호출. progress를 이용해 스타일을 갱신합니다.
- onEnd(): 해당 애니메이션이 끝났을 때 1회 호출. 여기서 OUT 완료를 resolve()로 알려줍니다.

**개선 되면 좋을 것 같은 점**

-   outAnimationComplete, resolveOutAnimation 이 두개가 fade() 함수 내부의 공유 상태인데, 여러 요소가 동시에 fade 트랜지션을 쓸 경우 **충돌**위험 ( 동시 호출 시 덮어쓸 위험) - 이렇게 쓸일이 잘없긴함..
  > const sharedFade = fade() 이렇게 변수에 할당해서 사용 시 하나의 클로저 상태를 공유하기에 -> 서로 동시에 다른 요소에서 실행 시 Promise가 덮어 씌워버려서 마지막 out만 유효
-   WeakMap 이용하면 좋을 듯 (요소별 개별 상태 저장)

**WeakMap이란 ?**

-   key는 객체만 가능 (주로 DOM 요소, {} 등)
-   키가 약하게 참조됨 (weak) - 객체가 다른 곳에서 더 이상 참조되지 않으면 자동으로 GC(가비지 컬렉션) 됨
-   순회불가 - forEach, .keys(), .values() 같은 메서드 없음
-   은밀한 저장소처럼 사용가능 - 객체에 데이터를 숨겨서 저장할 때 유용함

**WeakMap 예시**

```ts
const animationState = new WeakMap<Element, { started: boolean }>();

export const fade = (options: FadeOptions = {}): SggoiTransition => {
  // ...existing code...

  return {
    in: (element) => {
      animationState.set(element, { started: true }); // 애니메이션 시작 표시
      return {
        // ...existing code...
        tick: (progress) => {
          element.style.opacity = progress.toString();
          // 필요시 상태 활용
          // const state = animationState.get(element);
        },
        // ...existing code...
      };
    },
    out: (element) => {
      animationState.set(element, { started: false }); // OUT 애니메이션 시작
      return {
        // ...existing code...
        onEnd: () => {
          animationState.delete(element); // 애니메이션 끝나면 상태 삭제
          // ...existing code...
        },
      };
    },
  };
};

```

### 물리법칙 Spring Physics 과 일반 CSS 차이

CSS cubic/keyframes → “미리 정의된 경로대로 움직임” (타임라인 기반).  
Spring physics → “실시간 물리 시뮬레이션” (상호작용 기반).

**CSS cubic-bezier**

- cubic-bezier : cubic-bezier(x1,y1,x2,y2)
- x1, x2는 "시간의 진행"을, y1, y2는 "애니메이션 값의 변화"를 의미합니다.
- (0,0)에서 (1,1)까지의 곡선을 그리는데,  
  - x1, y1: 시작점에서 첫 번째 제어점의 위치  
  - x2, y2: 두 번째 제어점의 위치  
- 이 값에 따라 가속/감속, 튕김 등 다양한 움직임을 만들 수 있습니다.

```css

.fade {
    animation: fadeInOut 1s cubic-bezier(0.68, -0.55, 0.27, 1.55); // x1, y1, x2, y2
} 

@keyframes fadeInOut {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

ease: cubic-bezier(0.25, 0.1, 0.25, 1.0)
linear: cubic-bezier(0.0, 0.0, 1.0, 1.0)
ease-in: cubic-bezier(0.42, 0, 1.0, 1.0)
ease-out: cubic-bezier(0.0, 0.0, 0.58, 1.0)
ease-in-out: cubic-bezier(0.42, 0, 0.58, 1.0)
```

```html
cubic-bezier를 tailwind-css에서 쓸 시 
<div className="transition-all duration-150 ease-[cubic-bezier(0,0.53,1.2,1.2)]">
    <span className="font-bold text-green">아령하세요</span>
</div>
```

-   베지어 곡선(bezier curves) - 부드러운 곡선을 모델링하기 위해 컴퓨터 그래픽에서 널리 사용되는 기술

-   **장점**
    -   거의 모든 상황에서 충분히 "부드러운" 효과 구현 가능.
    -   성능 최적화 잘 되어 있음 (브라우저가 GPU 가속해줌).
    -   직관적: "시작~끝까지 어떻게 움직일지"를 직접 그릴 수 있음.
-   **단점**
    -   애니메이션 경로가 미리 고정됨 → 예측 불가한 상황(드래그 취소, 중간에 값 변경 등)에 대응하기 어려움.
    -   duration이 고정되어 있음 → 중간에 상태가 바뀌면 어색한 "재시작" 느낌이 생김.

**ssgoi Spring Physics 예시**

```ts
import {fade} from "./fade";

// fade 트랜지션을 적용할 때, SpringConfig로 물리엔진 기반 애니메이션을 제어
const mySpring = {
    stiffness: 300, // 스프링 강성
    damping: 25,    // 감쇠
};

const transition = fade({
    inSpring: mySpring,
    outSpring: mySpring,
    transitionDelay: 80,
});

// 실제로는 트랜지션 시스템에서 element에 적용됨
transition.in(element); // in 애니메이션 (물리엔진 기반)
transition.out(element); // out 애니메이션 (물리엔진 기반)
```

-   **특징**
    -   `stiffness`, `damping` 값을 바꿔가며 실시간으로 애니메이션의 속도/탄력/진동을 조절 가능
    -   중간에 상태가 바뀌어도 자연스럽게 이어짐 (예: fade 중에 다시 fade-in/out)
    -   duration이 고정이 아니라, 물리 시뮬레이션에 따라 "자연스럽게" 종료

-   **stiffness** (강성): 스프링의 단단함 (1-1000)
    -   높을수록 빠르고 탄력적인 움직임
    -   낮을수록 느리고 부드러운 움직임
-   **damping** (감쇠): 진동을 억제하는 정도 (0-100)

    -   높을수록 빠르게 안정화
    -   낮을수록 더 많이 진동

- 추가 설명:
    - fade 트랜지션은 "상태 기반"으로 동작하며, IN/OUT 각각의 애니메이션을 독립적으로 제어합니다.
    - Promise와 wait()을 활용해 OUT이 끝난 뒤 IN이 자연스럽게 이어지도록 동기화합니다.
    - spring 파라미터를 바꿔주면, 같은 fade 효과라도 다양한 속도/탄력/감쇠로 연출할 수 있습니다.
    - 이런 구조는 단순 CSS keyframes와 달리, 중간에 상태가 바뀌거나 여러 요소가 동시에 애니메이션될 때도 자연스럽게 이어질 수 있게 해줍니다.
