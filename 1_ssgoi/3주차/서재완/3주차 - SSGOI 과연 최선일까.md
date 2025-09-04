## 0. TL;DR (한 줄 요약)

-   **RTG**는 _전이 상태 관리기_: `enter/exit` 단계와 마운트/언마운트 타이밍, 클래스 토글을 제공한다. 자체 애니메이션 엔진은 없고 **CSS/JS 애니메이션과 결합**한다.

-   **페이지 전환도 가능**: `key` 변화 + `TransitionGroup`의 **언마운트 지연** 덕분에 **이전 화면(Out)**과 **새 화면(In)**을 *잠시 동시 렌더*하며 애니메이션.

-   **StrictMode 핵심**: `nodeRef` 필수. 리스트 전이에선 항목별로 별도 `nodeRef`.

-   **히어로 전환(공유 요소)**: RTG만으로도 **가능**하지만 **FLIP 수작업**이 필요. 복잡하면 **SSGOI/Framer Motion**이 현실적.

-   **SSGOI vs RTG**: 브라우저 지원 범위의 차이보다는 **기능 포장/추상화 수준**의 차이. _단순 전환=RTG_, _복잡 전환=SSGOI_ 권장.

---

## 1. React Transition Group(RTG) 개요

-   **정체**: React 컴포넌트의 **등장/퇴장(enter/exit)** 전이를 관리하는 경량 래퍼. 실제 애니메이션은 **CSS transition/animation** 또는 JS(예: Web Animations)로 수행.

-   **주요 제공 컴포넌트**

    -   `Transition`: `in` 플래그 변화에 의해 `entering → entered → exiting → exited` 상태 머신 구동. `mountOnEnter`, `unmountOnExit`, `onEnter/onExited` 등 콜백 제공.

    -   `CSSTransition`: 전이 단계에 맞춘 **접두어 기반 클래스 토글** (`{name}-enter`, `{name}-enter-active`, `{name}-exit-active`, …).

    -   `TransitionGroup`: **자식 추가/제거**를 감지해 **사라지는 자식을 즉시 언마운트하지 않고** `exit`를 끝낼 때까지 유지. (언마운트 **지연**)

    -   `SwitchTransition`: 단일 자식을 `key` 교체로 바꿀 때 `out-in` / `in-out` 제어.

-   **버전 메모**: 4.x 안정 라인(오랜 기간 유지). 타입은 `@types/react-transition-group` 별도.

---

## 2. 왜 페이지 전환 애니메이션이 가능한가?

### 2.1 핵심 아이디어 (키 + 존재 제어)

1. **`key` 변화**로 React는 **서로 다른 자식**으로 인식한다.

2. `TransitionGroup`은 **지난 렌더의 자식 맵**과 **이번 렌더의 자식 맵**을 **병합**한다.

    - 새 렌더에 **없는** 옛 자식(=사라질 자식)은 **`in=false`**로 두고 **`exit` 애니메이션**을 시작하지만, **렌더 목록에서 즉시 제거하지 않는다**.

    - 새로 **생긴** 자식은 **`in=true`**로 **`enter`**를 시작한다.

3. 그 결과 **이전 화면과 새 화면이 한동안 공존**하고, **Out ↔ In이 겹쳐 보이는** 페이지 전환이 성립한다.

4. `onExited`가 호출되는 **종료 시점**에만 **실제 언마운트**가 발생한다.

### 2.2 내부 동작(의사 코드)

```tsx
function TransitionGroup({children}) {
    const [childMap, setChildMap] = useState(() => mapByKey(children)); // 이전 렌더 보관

    useLayoutEffect(() => {
        const nextMap = mapByKey(children);
        const merged = mergeChildMappings(childMap, nextMap); // "사라질 자식"도 당장 제거하지 않음

        setChildMap(merged);
    }, [children]);

    return (
        <>
            {Object.entries(childMap).map(([key, el]) =>
                cloneElement(el, {
                    in: key in mapByKey(children),

                    onExited: () => setChildMap(prev => removeKey(prev, key)) // exit 끝에만 제거
                })
            )}
        </>
    );
}
```

> **포인트**: DOM을 복제하지 않는다. **이전 엘리먼트 트리**를 *state로 보존*해 **언마운트 지연**을 구현하는 “존재(presence) 제어” 패턴이다.

### 2.3 Routes와 location이 바뀌는데도 PageA가 남는 이유

-   새 트리(newKey)의 `<Routes location={newLocation}>`는 **PageB**를 렌더.

-   **옛 트리(oldKey)**는 `TransitionGroup`이 **지난 렌더의 엘리먼트**를 그대로 렌더 목록에 남겨 두므로, 그 안의 `<Routes>`는 **`oldLocation`**을 유지 → **PageA**가 **exit**를 수행.

---

## 3. 실전 사용법

### 3.1 React Router(v6) 정석 패턴

```tsx
// App.tsx
import {Routes, Route, useLocation} from "react-router-dom";
import {CSSTransition, TransitionGroup} from "react-transition-group";
import {useMemo, useRef} from "react";

const PageA = () => <div className="page">A</div>;
const PageB = () => <div className="page">B</div>;

export default function App() {
    const location = useLocation();
    const refs = useMemo(() => new Map<string, React.RefObject<HTMLDivElement>>(), []);
    const getRef = (k: string) => refs.get(k) ?? (refs.set(k, useRef<HTMLDivElement>(null)), refs.get(k)!);
    const key = location.key; // 또는 pathname

    return (
        <TransitionGroup component={null}>
            <CSSTransition key={key} timeout={250} classNames="fade" nodeRef={getRef(key)} mountOnEnter unmountOnExit>
                <div ref={getRef(key)}>
                    <Routes location={location}>
                        <Route path="/" element={<PageA />} />
                        <Route path="/b" element={<PageB />} />
                    </Routes>
                </div>
            </CSSTransition>
        </TransitionGroup>
    );
}
```

```css
/* classNames="fade" 규칙 */
.fade-enter {
    opacity: 0;
    transform: translateY(8px);
}
.fade-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.25s;
}
.fade-exit {
    opacity: 1;
    transform: translateY(0);
}
.fade-exit-active {
    opacity: 0;
    transform: translateY(-8px);
    transition: all 0.25s;
}
.page {
    min-height: 100vh;
}
```

**체크포인트**

-   전환 트리거: `key={location.key}`(권장) / 또는 `pathname`.

-   **StrictMode**: 화면마다 **고유 `nodeRef`**.

-   **시간 싱크**: CSS `transition-duration` ↔ `timeout`.

### 3.2 Next.js(App Router) 적용

```tsx
// app/transition-wrapper.tsx (Client Component)
"use client";
import {CSSTransition, SwitchTransition} from "react-transition-group";
import {useRef} from "react";
import {usePathname} from "next/navigation";

export default function TransitionWrapper({children}: {children: React.ReactNode}) {
    const pathname = usePathname();
    const nodeRef = useRef<HTMLDivElement>(null);
    return (
        <SwitchTransition mode="out-in">
            <CSSTransition key={pathname} timeout={250} classNames="page" nodeRef={nodeRef} mountOnEnter unmountOnExit>
                <div ref={nodeRef}>{children}</div>
            </CSSTransition>
        </SwitchTransition>
    );
}
```

```css
.page-enter {
    opacity: 0;
    transform: translateY(8px);
}
.page-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.25s;
}
.page-exit {
    opacity: 1;
    transform: translateY(0);
}
.page-exit-active {
    opacity: 0;
    transform: translateY(-8px);
    transition: all 0.2s;
}
```

**주의**: 클라이언트 컴포넌트에서만 사용, `key`가 바뀌도록 설계, 데이터 로딩 타이밍 고려(Suspense/로딩 UI).

---

## 4. StrictMode & `findDOMNode` 경고

-   RTG는 기본적으로 내부에서 타깃 DOM을 찾기 위해 `findDOMNode`에 의존하던 시절이 있었다. React 18 StrictMode에선 경고가 뜬다.

-   **해결**: 각 전이 항목에 **`nodeRef`**를 제공하고, 해당 DOM에 동일한 `ref`를 꽂는다. 리스트 전이에선 **항목별로 별도 `nodeRef`**를 관리.

---

## 5. 핵심 props/옵션 요약

-   `in`: 전이 트리거(boolean)

-   `timeout`: ms 단위 지속시간(enter/exit 분리 가능)

-   `mountOnEnter` / `unmountOnExit`: 등장 전 미마운트 / 퇴장 후 언마운트

-   `appear`: 첫 마운트 시 `enter` 적용

-   `classNames`: `CSSTransition` 접두어(클래스 세트 자동 적용)

-   `nodeRef`: StrictMode 권장

-   콜백: `onEnter`, `onEntering`, `onEntered`, `onExit`, `onExiting`, `onExited`

---

## 6. 흔한 오류/함정

-   **클래스 적용 안 됨**: `className`이 아니라 **`classNames`**.

-   **전환 안 보임**: CSS 전환 시간보다 `timeout`이 짧음 / 0. `addEndListener`나 `transitionend`로 마무리 제어.

-   **리스트 꼬임**: `key` 중복/불안정, 빠른 추가/삭제 시 상태 경합. 키/노드 참조 안정화.

-   **초기 등장 제어**: `appear` 필요 여부 확인.

---

## 7. 페이지 전환에서의 레이아웃/성능 팁

1. **겹치기 레이아웃**: 전환 중 두 화면을 겹쳐 보여야 자연스러움 → 부모 `position: relative`, 자식 `position: absolute` + 같은 좌표.

2. **합성 경로**: `transform/opacity` 위주. `top/left/height` 변경은 reflow/paint 비용 ↑.

3. **레이어 분리**: `will-change: transform, opacity`.

4. **이미지 최적화**: 히어로에 큰 이미지라면 미리 로드/고정 크기.

5. **React 18 협업**: 데이터 로딩과 전환 분리(`useTransition`), `Suspense`로 로딩 UI 제공.

---

## 8. 히어로 전환(공유 요소) — RTG만으로 구현하기

> **가능**하지만 **FLIP(First–Last–Invert–Play)**을 직접 구성해야 한다.

### 8.1 로드맵

-   **First**: 사라질 페이지에서 히어로의 BCR(위치/크기) 측정 → 스냅샷 저장

-   **Last**: 새 페이지에서 히어로의 BCR 측정

-   **Invert**: 두 상태 차이를 `transform: translate/scale`로 역적용한 **오버레이 복제 노드**를 `position: fixed/absolute`로 띄움

-   **Play**: `transform`을 0으로 애니메이션 → 자연스럽게 이동/확대 축소

-   전환 종료 시 **오버레이 제거**, 실제 대상 표시

### 8.2 의사 코드 스니펫

```tsx
// 전환 래퍼 (핵심 훅만 발췌)
<TransitionGroup component={null}>
    <SwitchTransition mode="out-in">
        <CSSTransition
            key={location.key}
            timeout={400}
            classNames="page"
            nodeRef={pageRef}
            onExit={node => handleExit(node)} // First 캡처
            onEnter={node => handleEnter(node)} // Last 캡처 + Invert + Play
            onEntered={() => cleanup()} // 정리
            mountOnEnter
            unmountOnExit
        >
            <div ref={pageRef}>
                <Routes location={location}>{/* ... */}</Routes>
            </div>
        </CSSTransition>
    </SwitchTransition>
</TransitionGroup>
```

**보정 팁**: 스크롤 위치, `devicePixelRatio`, `border-radius/mask`, 스택 컨텍스트(z-index), 이미지 로딩 상태를 세심히 처리.

---

## 9. SSGOI와의 비교 (브라우저 지원/성능/생산성)

-   **브라우저 지원**: 두 라이브러리 모두 **View Transition API 비의존적**이며 모던 브라우저 전반에서 동작. “SSGOI가 더 넓다”기보다는 **페이지 전환 UX를 일관되게 포장**했다는 의미.

-   **성능**: *라이브러리 자체*보다 **DOM 규모·레이아웃 변화·애니메이션 프로퍼티**가 병목.

    -   **단순 전환**: RTG가 **더 가볍거나 최소 동등**.

    -   **복잡 전환(히어로/상태 보존/패턴 매핑)**: SSGOI가 **안정적 경로** 제공으로 실전 성능/유지보수 유리.

-   **생산성(DX)**: RTG는 **저수준 도구**(직접 설계 필요), SSGOI는 **페이지 전환 특화**(선언적 규칙, 히어로 프리셋 등).

---

## 10. 도입 체크리스트

1. **전이 단위 선택**: 단건 `Transition/CSSTransition`, 리스트 `TransitionGroup`.

2. **키 전략**: `key={location.key}`(권장) 또는 `key={pathname}`.

3. **StrictMode**: 모든 전이에 `nodeRef` 도입(리스트는 항목별 별도 관리).

4. **CSS 세트**: `*-enter/enter-active/enter-done`, `*-exit/exit-active/exit-done` 6종 정의.

5. **시간 싱크**: CSS 전환 시간 ↔ `timeout`.

6. **레이아웃 겹치기**: 페이지 전환 중 두 화면이 겹치도록 배치.

---

## 11. 설치/타입/버전

```bash
npm i react-transition-group
# TypeScript
npm i -D @types/react-transition-group
```

-   장기간 안정 버전(4.x). 새 기능 추가보다는 **유지/호환** 관점으로 이해하는 것이 안전.

---

## 12. FAQ 요약 (대화에서 나온 질문 정리)

**Q1. RTG로 페이지 전환 가능?** → 네. `TransitionGroup`이 **언마운트 지연**으로 Out/In을 겹치게 해 준다.

**Q2. Routes가 새 location으로 바뀌면 왜 A가 남나?** → `TransitionGroup`이 **지난 렌더 엘리먼트**를 state에 보존해 **oldLocation**을 가진 트리를 잠시 더 렌더.

**Q3. key가 필수인가?** → 사실상 **핵심 트리거**. 키가 바뀌어야 “이전/새 자식”을 구분해 동시 렌더가 성립.

**Q4. DOM을 복제하나?** → 아니오. DOM 복제가 아니라 **엘리먼트 보존**. exit 종료까지 **존재 제어**.

**Q5. 히어로 전환은 RTG로 못 하나?** → **가능**. 다만 **FLIP 수작업**(측정/오버레이/동기화/보정)이 필요.

**Q6. RTG vs SSGOI 성능?** → 단순=RTG 유리/동등, 복잡=SSGOI가 실전에서 유리한 경향.

**Q7. 브라우저 지원 차이?** → 본질적 차이보다 **기능 포장**의 차이. 둘 다 View Transition API 비의존.

---

## 13. 참고 키워드

-   **FLIP**(First–Last–Invert–Play) 패턴

-   **React 18 StrictMode**와 `nodeRef`, `findDOMNode` 경고

-   **TransitionGroup**의 **존재(presence) 제어**

-   **View Transition API**와 무관하게 동작하는 전환 구성

> 끝. (질문은 언제든!)
