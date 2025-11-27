# 🎨 인터랙티브 UI

> **Tailwind CSS**는 인터랙티브 UI를 **HTML 단**에서 빠르고 효율적으로 구축할 수 있게 돕습니다.

---

# 🖱️ 기본 상호작용: Hover & Focus 상태 스타일링

## 🎯 `hover:`와 `focus:` 접두사 활용하기

Tailwind는 CSS의 가상 클래스(Pseudo-classes)를 **HTML 클래스 접두사** 형태로 제공합니다.

### 📋 주요 접두사

- `hover:` 마우스 커서가 요소 위에 있을 때 적용 (CSS `:hover`)
- `focus:` ⌨요소가 포커스 상태일 때 적용 (CSS `:focus`)
- `active:` 클릭하는 순간 적용 (CSS `:active`)
- `group-hover:` 부모 `group` 클래스에서 자식 스타일 변경

---

# 🌊 3. 부드러운 움직임: Transition 유틸리티

### 🔄 `transition-*` 속성 정의

- `transition-colors` 🎨 색상 변화
- `transition-opacity` 👻 투명도 변화
- `transition-shadow` 🌓 그림자 변화
- `transition-transform` 🔄 변환 변화

### ⏱️ `duration-*` & `ease-*`

| 지속시간                        | 타이밍 함수      |
| ------------------------------- | ---------------- |
| `duration-75` ~ `duration-1000` | `ease-in-out` 🌊 |
| (ms 단위)                       | `ease-linear` ➡️ |

---

# ⚡ 4. 애니메이션: 내장 `animate-*` 클래스

### 🎨 제공되는 애니메이션

| 애니메이션            | 효과          | 용도        |
| --------------------- | ------------- | ----------- |
| `animate-spin` ↻️     | 무한 회전     | 로딩 스피너 |
| `animate-ping` 📡     | 크기확대+투명 | 알림 효과   |
| `animate-pulse` 💓    | 깜빡임        | 스켈레톤 UI |
| `animate-bounce` ⬆️⬇️ | 위아래 튕김   | 스크롤 안내 |

---

# 🛠️ 5. 나만의 애니메이션 만들기: `tailwind.config.js`

## ⚙️ 환경 설정 파일로 커스텀 @keyframes 정의

기본 애니메이션으로 부족하다면, Tailwind의 **설정 파일**을 통해 **새로운 애니메이션**을 유틸리티 클래스로 추가할 수 있습니다! 🔧

