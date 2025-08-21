## React 페이지 전환 애니메이션: SSGOI vs 일반 CSS
1. SSGOI란?
SSGOI는 React 등 프론트엔드 프레임워크에서 페이지 전환, 컴포넌트 애니메이션을 쉽게 구현할 수 있도록 도와주는 라이브러리입니다.
상태 관리, 트랜지션 컨텍스트, 다양한 애니메이션 효과를 지원합니다.

2. 일반 CSS로 페이지 전환 애니메이션 구현
일반적으로 React에서 페이지 전환 애니메이션을 구현하려면 CSS와 상태 관리가 필요합니다.

### css활용 예시코드 (1) - setTimeOut + css을 이용한 animation
```
// App.tsx
// setTimeout을 이용한 opactity (페이드 아웃 애니메이션)

function App() {
    const location = useLocation();
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 400);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className={`page-wrapper${animate ? " fade" : ""}`}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </div>
    );
}

// index.css

.page-wrapper {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.4s;
  opacity: 1;
}

.page-wrapper.fade {
  opacity: 0;
}

```

### css활용 예시코드 (2) - 

```
// App.tsx

function App() {
    const location = useLocation();
    return (
        <div className="page-wrapper fade-in" key={location.pathname}>
            <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </div>
    );
}

// index.css

.fade-in {
    animation: fadeIn 0.4s;
}

@keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
}

```

### CSS 만으로 구현 시 한계점

- 여러 페이지/컴포넌트에 적용하려면 반복 작업이 많음
- 직접 상태를 관리해야 하며, 복잡한 애니메이션은 코드가 길어짐
- 해당 Element와 해당 css 클래스명이 다를 경우 애니메이션이 정상적으로 적용되지 않음
- 페이지 이동 시, 이전/다음 페이지의 트랜지션을 자연스럽게 연결하기 어렵고, 여러 컴포넌트가 동시에 전환될 때 관리가 복잡함
- React Router 등 라우팅 라이브러리와 연동 시, 애니메이션 타이밍 제어가 까다로울 수 있음
- 사용자 상호작용(예: 뒤로가기, 빠른 클릭 등)에 따라 애니메이션이 꼬일 수 있음
- SSR(서버사이드 렌더링) 환경에서는 애니메이션이 정상적으로 동작하지 않을 수 있음

### SSGOI로 페이지 전환 애니메이션 구현 에시
#### 1. 페이지 전환

```
const ssgoiConfig: SsgoiConfig = {
    defaultTransition: fade(),
    transitions: [
        {from: "/", to: "/about", transition: slide({direction: "left"})},
        {from: "/about", to: "/", transition: slide({direction: "right"})},
        // 필요시 추가 transition
    ],
};

function App() {
    const location = useLocation();
    return (
        <Ssgoi config={ssgoiConfig}>
            <div
                style={{
                    position: "relative",
                    minHeight: "100vh",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Routes location={location}>
                    <Route
                        path="/"
                        element={
                            <SsgoiTransition id="/">
                                <HomePage />
                            </SsgoiTransition>
                        }
                    />
                    <Route
                        path="/about"
                        element={
                            <SsgoiTransition id="/about">
                                <AboutPage />
                            </SsgoiTransition>
                        }
                    />
                </Routes>
            </div>
        </Ssgoi>
    );
}    

```

#### 2. 버튼 클릭시 바운스 효과

```
- ssgoi
export default function AboutPage() {
    const [isActiveBounceButton, setIsActiveBounceButton] = useState(false);

    return (
        <SsgoiTransition id="/about">
            <main className="about-page">
                <h1>소개 페이지</h1>

                {isActiveBounceButton && (
                    <div
                        ref={transition({
                            key: "my-element", // ref 속성에 transition()을 전달할 때는, key와 in 또는 out 중 하나를 설정 ( ...bounce() 시 둘다 사용)
                            ...bounce(),
                        })}
                    >
                        바운스!
                    </div>
                )}

                <button
                    onClick={() => setIsActiveBounceButton((prev) => !prev)}
                >
                    <span>Click</span>
                </button>
            </main>
        </SsgoiTransition>
    );
}

- css

{isActiveBounceButton && <div className="bounce">바운스!</div>}

.bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}
```

- 모든 브라우저에서 동작 
- 트랜지션 관리가 자동화되어 있고, 다양한 애니메이션 효과를 쉽게 적용 가능
- 복잡한 페이지 구조에서도 일관된 애니메이션 제공
- 코드가 간결해지고 유지보수가 쉬움 
- 서버사이드 렌더링 완벽 지원
- TypeScript 완벽 지원
- 스프링 기반 물리 애니메이션으로 자연스러운 움직임
> 스프링 물리엔진 - 애니메이션이 실제 물리 법칙처럼 작동하도록 시뮬레이션하는 방식   
stiffness가 높을수록: 더 빠르고 강하게 반응 / damping이 낮을수록: 많이 흔들림 (감쇠 적음 → 더 오래 튕김)

```
spring: {
  stiffness: number; // 강성도 (탄력의 강도)
  damping: number;   // 감쇠 (얼마나 빨리 멈추는지)
} 

ex) bounce({
  spring: {
    stiffness: 300,
    damping: 20,
  }
})

```


### SSGOI vs CSS

| 항목                     | ssgoi 사용                                              | 일반 CSS (예: `@keyframes`, `transition`)                      |
|--------------------------|---------------------------------------------------------|------------------------------------------------------------------|
| **설정 방식**            | 선언적 설정 (JS/TS 객체로)                             | CSS 클래스나 스타일 직접 작성                                   |
| **페이지 전환 지원**     | ✅ 기본 내장 (`<SsgoiTransition id="...">`)             | ❌ 직접 라우팅과 연동 처리 필요                                 |
| **요소 전환 지원**       | ✅ `transition({ ... })`로 요소별 전환                  | ❌ 조건부 렌더링 시 CSS로 직접 애니메이션 처리 필요             |
| **상태 기반 트랜지션**   | `in`, `out`, `key` 값으로 상태 전환 관리              | 상태 감지 후 클래스 토글 로직 수동 구현 필요                   |
| **애니메이션 조합**      | `fade + slide + bounce` 등 쉽게 조합 가능              | 여러 애니메이션을 조합하려면 복잡한 CSS 작성 필요             |
| **타이밍 제어 (spring 등)**| `spring` 파라미터로 물리 기반 애니메이션 제공         | 기본 `ease`, `linear` 등 CSS 제한된 기능만 가능                |
| **코드 위치**            | JS/TS 안에서 모든 애니메이션 제어                      | CSS 파일 분리, 유지보수 어려움                                  |
| **개발자 경험 (DX)**     | 타입 지원, 코드 컴플리션, 리팩토링 용이               | CSS는 추론 불가, JS 연동 어려움                                 |
| **의존성 분리**          | UI 트랜지션만 담당하는 경량 모듈                      | CSS 유틸/프레임워크와 충돌 위험                                 |


---

### 그렇다면 꼭 SSGOI여야만 하나~??
반드시 SSGOI만 사용해야 하는 것은 아닙니다.   
SSGOI는 라우팅 기반 페이지 전환에 특화되어 있어 쉽고 일관된 효과를 제공합니다.
하지만 React Transition Group, Framer Motion, GSAP, Anime.js 등 다른 라이브러리들도 페이지 전환 애니메이션을 충분히 구현할 수 있습니다.   

SPA(싱글 페이지 애플리케이션)에서 라우팅 기반 페이지 전환에 집중한다면 SSGOI가 편리합니다.   

컴포넌트별 다양한 애니메이션, 복잡한 인터랙션이 필요하다면 Framer Motion, GSAP 등 범용 라이브러리가 더 적합할 수 있습니다.   
즉, "페이지 전환에 SSGOI만 써야 한다"는 것은 아니며, 프로젝트 성격과 요구사항에 따라 다양한 라이브러리를 선택할 수 있습니다.

