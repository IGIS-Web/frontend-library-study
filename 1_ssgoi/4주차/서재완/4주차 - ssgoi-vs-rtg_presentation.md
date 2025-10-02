# 페이지 전환 애니메이션: **SSGOI vs React Transition Group (RTG)**

> 발표용 요약 문서 — 2025-10-02 (Asia/Seoul)

---

## TL;DR

-   **둘 다 60fps 가능**: `transform`/`opacity`만 쓰면 보통 **합성(Compositor) 단계**에서 돌아가므로 부드럽다.
-   **핵심 차이**
    -   **RTG**: 애니메이션 **주체가 원본 DOM**. `exit` 동안 **원본 A를 유지**해야 하며, 그 사이 **A의 이펙트/리스너/리렌더**와 **B의 마운트/데이터 로드**가 **같은 타임슬라이스**에서 경쟁할 수 있음.
    -   **SSGOI**: 애니메이션 **주체가 복제 레이어(스냅샷)**. **원본 A는 즉시 언마운트** 가능 → **JS/레이아웃/페인트 타이밍 압박**을 낮춰 **프레임 안정성**을 확보하기 쉬움(대신 복제 비용 존재).
-   **언제 무엇을?**
    -   **단순 슬라이드/가벼운 화면**: RTG가 **단순/경량**.
    -   **전환 시점에 무거운 렌더/데이터**가 겹치거나 **공유요소(히어로) 전환**이 많다면: **SSGOI**가 유리.

---

## 1) 브라우저 파이프라인과 Compositor

1. **Style**: CSS 계산
2. **Layout**: 박스의 위치/크기 계산(= 리플로우)
3. **Paint**: 비트맵(텍스처)로 그리기(래스터)
4. **Compositor**: 여러 **레이어**를 **GPU**에서 합성(행렬/클리핑/알파)

### 왜 `transform`/`opacity`가 빠른가?

-   요소가 **합성 레이어**로 존재하면, 이미 그려둔 비트맵을 **다시 칠하지 않고** Compositor가 **행렬 변환/알파 합성**만 수행 → **Layout/Paint 없이** 프레임 생성 가능.
-   단, **첫 프레임**에 레이어 승격/설치 때문에 **1회 Paint**가 발생할 수 있음.

---

## 2) 동작 모델 비교

### RTG (React Transition Group)

-   **원리**: 컴포넌트의 `enter/exit` 상태를 노출하고, `CSSTransition`이 단계별 클래스를 부착. 실제 애니메이션은 **원본 DOM**에서 CSS 전환으로 수행.
-   **타임라인**
    1. 라우팅 → `*-exit` 클래스 부착
    2. **원본 A**가 직접 애니메이션
    3. `transitionend/onExited` → **A 언마운트**
    4. B는 병렬/직렬로 `enter`
-   **특징**
    -   전환 중 **A와 B가 모두 생존**(A는 exit 중, B는 마운트 중).
    -   **초기 프레임**에 클래스 토글/승격/첫 페인트 + B 마운트가 겹치면 **히치(hitch)** 가능.
    -   별도의 복제 레이어가 없어 **메모리/페인트 표면적**은 상대적으로 적음.

### SSGOI

-   **원리**: 라우트 매칭으로 `out → in` 동기화. **원본 A를 측정/복제(스냅샷)** 후, **복제 레이어가 out 애니메이션**을 담당. **원본 A는 즉시 언마운트** 가능.
-   **타임라인**
    1. A 측정 → **복제 레이어** 생성/삽입
    2. 복제 레이어가 **out**(합성 중심) / 원본 A는 **즉시 정리**
    3. B 준비되면 **in** 시작
    4. 종료 후 **복제 레이어 cleanup**
-   **특징**
    -   **애니메이션(합성)**과 **React 생명주기(언마운트/정리)**를 **분리** → 바쁜 프레임에서 안정성↑
    -   대가: **초기 1회 측정/페인트** + **복제 레이어 한 장**으로 인한 **페인트/합성/메모리** 비용 가능.

---

## 3) 리플로우/리페인트 관점

-   **리플로우(reflow)**: 레이아웃에 영향이 있는 변경이 있어야 발생. 전환을 `position:absolute; inset:0` + `transform/opacity`로 구성하면 **전환 중 리플로우는 거의 없음**.
-   **SSGOI**: 복제 레이어 **삽입 시점**에 **1회 레이아웃/스타일 계산**은 필요.
-   **RTG**: B 마운트 시점에 해당 뷰의 레이아웃/페인트가 필요.
-   **결론**: 전환 프레임 그 자체는 보통 **합성(Composite-only)**. 초기 프레임의 **작업 겹침**이 히치의 원인.

---

## 4) 성능 트레이드오프 요약

| 항목                             | RTG                                   | SSGOI                                               |
| -------------------------------- | ------------------------------------- | --------------------------------------------------- |
| 애니메이션 주체                  | **원본 DOM**                          | **복제 레이어(스냅샷)**                             |
| 전환 시 동시 생존                | A(원본, exit) + B                     | B + 복제 A (원본 A는 내려도 됨)                     |
| 초기 비용                        | 클래스 토글/승격/첫 페인트 + B 마운트 | **측정/복제/삽입(1회)**                             |
| 전환 중 비용                     | 합성 중심(가벼움)                     | 합성 중심(가벼움) + 복제 레이어로 합성/메모리 약간↑ |
| 프레임 안정성(무거운 JS 동반 시) | **상대적 약세**(경쟁 ↑)               | **상대적 강점**(역할/스케줄 분리)                   |
| 구현 복잡도                      | 간단(리스트/모달/기본 페이지 전환)    | 높음(복제/동기화/클린업)                            |
| 히어로/공유요소                  | 수작업 부담 큼                        | 프리셋/패턴으로 유리                                |

---

## 5) 선택 가이드

-   **단순 슬라이드/페이드 + 가벼운 화면** → **RTG**로 충분(의존성 가볍고 단순).
-   **전환 타이밍에 무거운 JS/데이터 로드/이펙트 정리**가 겹침 → **SSGOI** 고려(원본 즉시 정리 + 합성 중심 애니메이션).
-   **히어로/공유 요소 전환 또는 라우트별 다양한 패턴 관리** → **SSGOI**가 유지보수 유리.

---

## 6) RTG 실전 패턴 (Next.js App Router 예시)

```tsx
// app/page-transition.tsx
"use client";
import {usePathname} from "next/navigation";
import {TransitionGroup, CSSTransition} from "react-transition-group";
import {useRef} from "react";

export default function PageTransition({children}: {children: React.ReactNode}) {
    const pathname = usePathname();
    const nodeRef = useRef<HTMLDivElement>(null);

    return (
        <div className="page-frame">
            <TransitionGroup component={null}>
                <CSSTransition key={pathname} nodeRef={nodeRef} classNames="fade" timeout={250} unmountOnExit>
                    <div ref={nodeRef} className="page">
                        {children}
                    </div>
                </CSSTransition>
            </TransitionGroup>
        </div>
    );
}
```

```css
.page-frame {
    position: relative;
    overflow: hidden;
}
.page {
    position: absolute;
    inset: 0;
}

.fade-enter {
    opacity: 0;
    transform: translateX(10%);
}
.fade-enter-active {
    opacity: 1;
    transform: translateX(0);
    transition: opacity 250ms, transform 250ms;
}
.fade-exit {
    opacity: 1;
    transform: translateX(0);
}
.fade-exit-active {
    opacity: 0;
    transform: translateX(-10%);
    transition: opacity 250ms, transform 250ms;
}
```

**팁**

-   전환 프레임에 **무거운 상태 업데이트/측정** 피하기.
-   전환 직전 **레이어 승격 힌트**(`will-change: transform`) 사용(과용 금지).
-   `SwitchTransition mode="out-in"`으로 동시 경쟁 완화 가능.

---

## 7) SSGOI 안전 가드(개념 체크리스트)

-   **원본 DOM 불변 원칙**: 복제 레이어만 조작, 원본 DOM은 건드리지 않기.
-   **접근성/포인터**: `aria-hidden="true"`, `pointer-events:none`로 복제가 인터랙션·포커스에 끼어들지 않게.
-   **레이아웃 고정**: 오버레이는 `position:absolute; inset:0`, 크기 명시로 내재적 계산 최소화.
-   **복제 비용 관리**: `backdrop-filter`, 큰 그림자/반투명, 초고해상도 비트맵은 비용↑ → 전환용 스타일 단순화.
-   **정리(cleanup) 철저**: 애니메이션 종료 후 **복제 레이어 제거**, 전역 리스너 해제.

---

## 8) 프로파일링 체크리스트

-   **Performance**: Frames(초반 hitch), Scripting, Rendering(Paint), GPU(Composite) 비율 확인
-   **Layers**: 요소가 **별도 합성 레이어**인지, 텍스처 크기/수
-   **Rendering**: Paint flashing로 재페인트 영역 체크
-   **Memory**: 복제 레이어 추가 시 텍스처 사용량 변화

---

## 9) FAQ 빠른 정리

-   **`cloneNode()`를 쓰면 리플로우가 생기나요?**  
    → **삽입 시점에 1회** 스타일/레이아웃 계산이 필요. 전환 자체를 `transform/opacity`로 하면 **전환 중 리플로우는 거의 없음**.

-   **RTG도 `transform/opacity`면 충분히 부드럽죠?**  
    → 네. 다만 **exit 동안 원본 A 유지**로 인해 **초기 프레임에 경쟁**이 생길 수 있음. 구조/부하에 따라 SSGOI가 더 안정적일 수 있음.

-   **SSGOI가 항상 더 빠른가요?**  
    → **아니요.** DOM/스타일이 크거나 복제 레이어가 비싸지면 **RTG가 가볍고 빠를 수 있음**. 실측으로 판단.

---

## 10) 의사결정 트리(요약)

```
전환이 단순(slide/fade) & 화면 가벼움? ── 예 → RTG
                                     └─ 아니오
전환 시점에 무거운 JS/데이터/정리가 겹침? ── 예 → SSGOI(원본 즉시 정리 + 복제 out)
                                     └─ 아니오 → RTG 또는 SSGOI(요구사항/취향)
히어로/공유 요소 많음? ─────────────── 예 → SSGOI
```

---

### 부록: 용어

-   **합성(Compositor)**: 이미 그려진 레이어를 **GPU**로 겹쳐 최종 화면을 만드는 단계.
-   **리플로우(Layout)**: 레이아웃 트리를 다시 계산.
-   **리페인트(Paint)**: 픽셀을 다시 칠(래스터)하는 단계.
-   **Composite-only Update**: Layout/Paint 없이 합성 단계만 갱신.

---

_Prepared for internal presentation — FE 성능/애니메이션 설계 토론 요약_
