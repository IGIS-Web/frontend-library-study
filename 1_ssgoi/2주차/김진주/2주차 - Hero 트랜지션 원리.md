  # Hero 트랜지션 원리 (Home.tsx 기준)

Hero 트랜지션은 두 페이지 간에 동일한 요소(예: 색상 박스)가 자연스럽게 애니메이션으로 이동하는 효과입니다.  
SSGOI 라이브러리에서는 `data-hero-key` 속성을 활용해 Hero 트랜지션을 자동으로 연결합니다.

---

## 코드 예시
1. 리스트 페이지 (Home.tsx)
```
{/* Hero Transition Section */}
        <div className={styles.heroTransitionSection}>
          <h2 className={styles.sectionTitle}>Hero Transition</h2>
          <div className={styles.colorGrid}>
            {colors.map((item) => (
              <Link
                key={item.id}
                href={`/item/${item.id}`}
                className={styles.colorBox}
                style={{ backgroundColor: item.color }}
                data-hero-key={`color-${item.id}`}
              >
                <span className={styles.colorName}>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
```

2. 상세 페이지 (/item/[id]/page.tsx)
```
"use client";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

const colorMap = {
  1: { color: "#FF6B6B", name: "Coral" },
  2: { color: "#4ECDC4", name: "Turquoise" },
  3: { color: "#45B7D1", name: "Sky Blue" },
  4: { color: "#96CEB4", name: "Sage" },
  5: { color: "#FECA57", name: "Sunflower" },
  6: { color: "#DDA0DD", name: "Plum" },
};

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const id = Number(resolved.id);
  const item = colors.find((c) => c.id === id);

  if (!item) {
    return <div>Item not found</div>;
  }

  return (
    <SsgoiTransition id={`/item/${id}`}>
      <div
        className={styles.detailContainer}
        style={{ backgroundColor: item.color }}
        data-hero-key={`color-${item.id}`}
      >
        <Link href="/" className={styles.backButton}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
```

---

## 주요 포인트

- 각 색상 박스(`Link`)에 `data-hero-key` 속성을 부여합니다.  
  예: `data-hero-key="color-1"`
- 이 속성은 상세 페이지(`/item/[id]`)에서도 동일하게 사용되어야 합니다.

---

## 동작 원리

SsgoiTransition 컴포넌트는 Hero Transition 애니메이션의 컨트롤러 역할을 합니다.

주요 역할
1. Hero 요소 추적

내부적으로 data-hero-key 속성이 있는 DOM 요소를 감지합니다.
페이지 전환 전후로 같은 data-hero-key를 가진 요소를 찾아냅니다.

2. 애니메이션 관리

페이지가 바뀔 때, 이전 페이지의 Hero 요소와 새 페이지의 Hero 요소 위치/크기를 계산합니다.
두 요소 사이를 자연스럽게 애니메이션(이동, 크기 변화 등)으로 연결합니다.

3. 상태 관리

페이지 전환 시점에 애니메이션을 시작하고, 완료되면 새 페이지를 정상적으로 보여줍니다.

4. id prop

id prop은 페이지별로 고유하게 Hero Transition을 구분하는 데 사용됩니다.
``
<SsgoiTransition id={/item/${id}}>...</SsgoiTransition>
``

=> SsgoiTransition은 Hero 애니메이션의 시작/종료, 대상 요소 추적, 애니메이션 실행을 담당합니다.
Hero 요소(data-hero-key)를 감지하고, 페이지 전환 시 애니메이션을 적용합니다.

---

## Hero 트랜지션의 핵심

- `data-hero-key`: Hero 트랜지션의 연결 고리 역할
- 자동 위치/크기 계산: SSGOI가 두 요소의 DOM 정보를 비교해 애니메이션 경로를 만듦
- 페이지 이동 시 애니메이션: 사용자는 부드럽게 요소가 이동하는 효과를 경험

---

## 예시 흐름

1. `/` 페이지에서 `data-hero-key="color-1"` 박스를 클릭  
2. `/item/1` 페이지에도 동일한 `data-hero-key="color-1"` 박스가 있음  
3. SSGOI가 두 박스를 연결해, 리스트에서 상세로 자연스럽게 박스가 이동하는 애니메이션을 보여줌

---

Hero 트랜지션은 이렇게 `data-hero-key`를 활용해 두 페이지의 동일 요소를 연결하고, SSGOI가 자동으로 애니메이션을 처리하는 방식입니다.  
상세 페이지에도 반드시 같은 `data-hero-key`가 있어야 효과가 적용됩니다.
