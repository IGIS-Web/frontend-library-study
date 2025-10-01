# CSS로 간단한 커스텀 애니메이션 구현

**css**
```css
.fade {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  opacity: 0;
  transition: opacity 2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade.show {
  opacity: 1;
}
```

**fade 페이지 전환 애니메이션** 
```ts
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

const Home = () => {
  const navigate = useNavigate();
  return (
    <FadePage>
      <div>Home Page</div>
      <button onClick={() => navigate("/about")}>About</button>
    </FadePage>
  );
};

const About = () => {
  const navigate = useNavigate();
  return (
    <FadePage>
      <div>About Page</div>
      <button onClick={() => navigate("/")}>Home</button>
    </FadePage>
  );
};

// 공통으로 사용할 컴포넌트
const FadePage = ({ children }: { children: React.ReactNode }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    return () => setShow(false);
  }, []);

  return <div className={`fade${show ? " show" : ""}`}>{children}</div>;
}
```

**Fade 모달**

```ts
function App() {
  const [active, setActive] = useState(true);

  return (
    <BrowserRouter>
      <Fade visible={active}>
        <div>Fading Content</div>
      </Fade>

      <button onClick={() => setActive((v) => !v)}>fade()</button>
    </BrowserRouter>
  );
}

const Fade = ({ children, visible }: { children: React.ReactNode, visible: boolean }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) setShouldRender(true);
  }, [visible]);

  const handleTransitionEnd = () => {
    if (!visible) setShouldRender(false);
  };

  return shouldRender ? (
    <div className={`fade${visible ? " show" : ""}`} onTransitionEnd={handleTransitionEnd}>
      {children}
    </div>
  ) : null;
};
```
**동작 방식**   
1. visible이 true가 되면 shouldRender를 true로 바꿔서 Fade 컴포넌트가 렌더링됨.  
2. fade show 클래스가 붙으면서 CSS 트랜지션(예: opacity)이 실행됨.   
3. visible이 false가 되면, 트랜지션이 끝날 때까지 컴포넌트는 계속 렌더링됨.   
4. 트랜지션이 끝나면 onTransitionEnd가 호출되어 shouldRender를 false로 바꿔, Fade 컴포넌트가 DOM에서 사라짐.


**onTransitionEnd**   
- onTransitionEnd는 CSS 트랜지션(transition)이 끝났을 때 자동으로 호출되는 React 이벤트 핸들러입니다.   
- 예를 들어, opacity나 transform 등 CSS 속성에 트랜지션이 적용되어 있고, 해당 속성이 변경되어 애니메이션이 끝나면 이 핸들러가 실행됩니다.  
- 용도: 트랜지션이 끝난 뒤에 상태를 변경하거나, DOM을 정리할 때 사용합니다.

**자매품 onAnimationEnd**
- @keyframes 기반 animation이 끝났을 때 발생
- CSS 애니메이션 자체가 완료될 때
- 한 번 정의한 애니메이션(@keyframes)을 실행 → 완료되면 딱 한 번 발생 / 반복(infinite)이면 반복마다 이벤트 발생

```css
@keyframes fadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.box {
  animation: fadeOut 0.5s forwards;
}
```

```react
<div
  className="box"
  onAnimationEnd={() => console.log("animation 끝!")}
/>

```

- 단순 show/hide 같은 경우엔 transition + transitionend가 더 간단하고 자연스러움.
- 복잡한 연속 동작이나 프로그래밍된 애니메이션은 animation + animationend가 더 적합.

---

** 예시2 **

<img width="1194" height="927" alt="image" src="https://github.com/user-attachments/assets/7c8b88c2-d8dc-4d40-8731-e0906568bbc4" />
예시 GIF ![20251001-0257-36 6863974](https://github.com/user-attachments/assets/12ecea8a-1828-453c-a821-5d064b49da29)   

---

** onTransition 추가 사항 **
``` ts
  onTransitionStart={() => console.log("START")}
  onTransitionRun={() => console.log("RUN")}
  onTransitionCancel={() => console.log("CANCEL")}
  onTransitionEnd={() => console.log("END")}
```

- 실제 실행 시
<img width="143" height="145" alt="image" src="https://github.com/user-attachments/assets/f9e6a3b4-8ea5-4f15-9b56-a594c236ba57" />
- 마우스 오버 시 transition 애니메이션, 마우스 올렸다가 바로 땐 상황 ( css에 2s 설정 )
