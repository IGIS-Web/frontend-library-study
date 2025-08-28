  # Hero 트랜지션 원리 (Home.tsx 기준)

Hero 트랜지션은 두 페이지 간에 동일한 요소(예: 색상 박스)가 자연스럽게 애니메이션으로 이동하는 효과입니다.  
SSGOI 라이브러리에서는 `data-hero-key` 속성을 활용해 Hero 트랜지션을 자동으로 연결합니다.

---

## 코드 예시
1. 리스트 페이지 (Home.tsx)
```
<div className={styles.colorGrid}>
  {colors.map((item) => (
    <Link
      key={item.id}
      href={`/item/${item.id}`}
      className={styles.colorBox}
      style={{ backgroundColor: item.color }}
      data-hero-key={`color-${item.id}`} // Hero 트랜지션 연결용 key
    >
      <span className={styles.colorName}>{item.name}</span>
    </Link>
  ))}
</div>
```

2. 상세 페이지 (예시: /item/[id]/page.tsx)
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

export default function ItemDetail() {
  const params = useParams();
  const item = colorMap[params.id as keyof typeof colorMap];

  return (
    <div className={styles.detailContainer}>
      <div
        className={styles.detailColorBox}
        style={{ backgroundColor: item.color }}
        data-hero-key={`color-${params.id}`} // 리스트와 동일한 key
      >
        <span className={styles.detailColorName}>{item.name}</span>
      </div>
      <p>상세 페이지 내용...</p>
    </div>
  );
}
```
이렇게 두 페이지 모두 같은 data-hero-key를 사용하면, SSGOI가 Hero 트랜지션을 자동으로 적용합니다.
색상 박스를 클릭하면 리스트에서 상세 페이지로 박스가 부드럽게 이동하는 애니메이션이 실행됩니다.
---

## 주요 포인트

- 각 색상 박스(`Link`)에 `data-hero-key` 속성을 부여합니다.  
  예: `data-hero-key="color-1"`
- 이 속성은 상세 페이지(`/item/[id]`)에서도 동일하게 사용되어야 합니다.

---

## 동작 원리

### Hero Key 매칭
- 두 페이지(리스트/상세) 모두 같은 `data-hero-key`를 가진 요소가 있으면, SSGOI가 이 두 요소를 연결합니다.

### 페이지 이동 시
- 사용자가 색상 박스를 클릭하면 Next.js 라우터가 `/item/1` 등으로 이동합니다.
- SSGOI는 이전 페이지와 새 페이지의 `data-hero-key`가 같은 요소를 찾아 위치, 크기, 스타일을 계산합니다.

### 애니메이션 실행
- SSGOI가 두 요소의 위치/크기 차이를 계산해, 자연스럽게 이동하는 애니메이션을 자동으로 적용합니다.
- spring 파라미터(`stiffness`, `damping` 등)는 `layout.tsx`의 `Ssgoi` 설정에서 조절할 수 있습니다.
```
const ssgoiConfig: SsgoiConfig = {
  transitions: [
    // Use hero transition between main and item detail pages
    {
      from: "/",
      to: "/item/*",
      transition: hero({ spring: { stiffness: 5, damping: 1 } }),
      symmetric: true,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Ssgoi config={ssgoiConfig}>
          <div
            style={{ position: "relative", minHeight: "100vh", width: "100%" }}
          >
            {children}
          </div>
        </Ssgoi>
      </body>
    </html>
  );
}
```

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
