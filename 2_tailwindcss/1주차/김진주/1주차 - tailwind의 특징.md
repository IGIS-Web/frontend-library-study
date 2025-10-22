# Tailwind CSS의 유틸리티 퍼스트(Utility-First) 접근 방식

Tailwind CSS의 **유틸리티 퍼스트 접근 방식**은 기존의 CSS 작성 방식과는 완전히 다른 철학을 기반으로 한 CSS 방법론입니다. 이 접근 방식을 이해하기 위해 전통적인 CSS 방식과 비교해보겠습니다.

## 전통적인 CSS vs 유틸리티 퍼스트

### 전통적인 CSS 방식

기존의 CSS 개발에서는 의미 있는 클래스명을 만들고 별도의 CSS 파일에서 스타일을 정의합니다:

```css
.btn {
  padding: 0.5rem 1rem;
  background-color: #3490dc;
  color: white;
  border-radius: 0.25rem;
}
```

```html
<button class="btn">Click me</button>
```


### 유틸리티 퍼스트 방식

Tailwind CSS의 유틸리티 퍼스트 접근 방식에서는 HTML에서 직접 미리 정의된 유틸리티 클래스들을 조합하여 스타일을 적용합니다:

```html
<button class="px-4 py-2 bg-blue-500 text-white rounded">
  Click me
</button>
```


## 유틸리티 퍼스트 접근 방식의 핵심 개념

**유틸리티 클래스란** 하나의 특정한 CSS 속성만을 담당하는 작은 단위의 클래스입니다. 예를 들어:

- `bg-blue-500`: 배경색을 파란색으로 설정
- `text-white`: 텍스트 색상을 흰색으로 설정
- `px-4`: 좌우 패딩을 1rem(16px)로 설정
- `py-2`: 상하 패딩을 0.5rem(8px)로 설정
- `rounded`: 모서리를 둥글게 처리


## 유틸리티 퍼스트 접근 방식의 장점

### 1. **빠른 개발 속도**

HTML과 CSS 파일을 오가며 작업할 필요 없이 HTML에서 직접 스타일링이 가능하여 개발 속도가 크게 향상됩니다.

### 2. **일관성 있는 디자인**

미리 정의된 디자인 시스템의 제약된 옵션들을 사용하기 때문에 프로젝트 전반에 걸쳐 일관성 있는 디자인을 유지할 수 있습니다.

### 3. **클래스명 고민 불필요**

"이 버튼의 클래스명을 뭐라고 할까?"와 같은 고민이 필요 없어집니다. 개발자는 네이밍 컨벤션에 대한 고민 대신 실제 스타일링에 집중할 수 있습니다.

### 4. **CSS 파일 크기 최적화**

사용하지 않는 스타일은 빌드 시 자동으로 제거되어(PurgeCSS) 최종 CSS 파일 크기가 매우 작아집니다.

### 5. **반응형 디자인 간편화**

`md:text-xl`, `lg:px-8`과 같은 반응형 유틸리티 클래스로 쉽게 반응형 디자인을 구현할 수 있습니다.

## 유틸리티 퍼스트 접근 방식의 단점

### 1. **HTML 가독성 저하**

많은 유틸리티 클래스들로 인해 HTML이 복잡해 보일 수 있습니다:

```html
<div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
```


### 2. **초기 학습 곡선**

유틸리티 클래스들의 이름과 규칙을 익히는 데 시간이 필요합니다.

### 3. **관심사 분리 원칙과의 충돌**

HTML은 구조, CSS는 스타일이라는 전통적인 관심사 분리 원칙에 어긋난다는 비판이 있습니다.

## 실제 사용 예시

카드 컴포넌트를 만드는 예시를 통해 차이점을 확인해보겠습니다:

### 전통적인 방식

```css
.chat-notification {
  display: flex;
}
.chat-notification-logo-wrapper {
  flex-shrink: 0;
}
.chat-notification-content {
  margin-left: 1.5rem;
  padding-top: 0.25rem;
}
```


### 유틸리티 퍼스트 방식

```html
<div class="flex">
  <div class="shrink-0">
    <img src="/img/logo.svg" alt="Logo">
  </div>
  <div class="ml-6 pt-1">
    <div class="text-xl font-medium text-black">Title</div>
    <p class="text-slate-500">Message</p>
  </div>
</div>
```


## 왜 "유틸리티 퍼스트"인가?

Tailwind CSS가 "유틸리티 퍼스트"라고 불리는 이유는 개발자들이 커스텀 CSS를 작성하는 대신 유틸리티 클래스를 사용하여 컴포넌트를 스타일링하도록 권장하기 때문입니다. 이는 기존의 컴포넌트 중심 프레임워크(Bootstrap 등)와는 반대되는 접근 방식입니다.

유틸리티 퍼스트 접근 방식은 **"많은 작은 목적별 클래스를 사용하여 스타일을 구축하는 CSS 방법론"**으로, 개발자가 빠르고 일관성 있게 UI를 구축할 수 있도록 돕는 현대적인 CSS 철학입니다.

---

# PurgeCSS와 Tailwind CSS의 통합

**PurgeCSS**는 사용하지 않는 CSS를 제거하여 최종 CSS 파일의 크기를 줄여주는 도구입니다. Tailwind CSS와 함께 사용하면 개발 환경에서는 수백만 개의 유틸리티 클래스를 사용할 수 있지만, 프로덕션 빌드에서는 실제로 사용한 클래스만 포함된 최적화된 CSS 파일을 생성할 수 있습니다.

## PurgeCSS가 필요한 이유

Tailwind CSS는 개발 시 매우 방대한 CSS 파일을 생성합니다. 모든 유틸리티 클래스(색상, 여백, 패딩 등의 모든 조합)를 포함하면 CSS 파일 크기가 **수백 KB에서 수 MB**까지 커질 수 있습니다. 하지만 실제 프로젝트에서는 이 중 일부만 사용하기 때문에, 사용하지 않는 클래스들을 제거하여 파일 크기를 줄일 필요가 있습니다.

## PurgeCSS의 작동 원리

PurgeCSS는 **콘텐츠 인식 방식**(content-aware strategy)으로 작동합니다:

### 1. **파일 스캔 단계**

PurgeCSS는 프로젝트의 HTML, JavaScript, Vue, React 컴포넌트 등의 파일들을 스캔하여 실제로 사용되는 CSS 클래스명을 추적합니다.

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.html", "./src/**/*.vue", "./src/**/*.jsx"],
  // ...
};
```

### 2. **매칭 단계**

스캔한 파일에서 발견된 CSS 선택자(클래스명)를 CSS 파일의 선택자와 비교합니다.

### 3. **제거 단계**

매칭되지 않은(사용되지 않은) CSS 규칙들을 최종 CSS 파일에서 제거합니다.

### 실제 예시

예를 들어, HTML 파일에 다음과 같은 코드가 있다면:

```html
<div class="bg-blue-500 text-white p-4">Hello World</div>
```

PurgeCSS는 `bg-blue-500`, `text-white`, `p-4` 클래스만 사용된다는 것을 파악하고, 나머지 수천 개의 Tailwind CSS 클래스들(예: `bg-red-500`, `text-black`, `p-8` 등)은 최종 CSS 파일에서 제거합니다.

## Tailwind CSS와 PurgeCSS 통합 설정

### Tailwind v2 이전

Tailwind CSS v2 이전에는 별도로 PurgeCSS를 설치하고 설정해야 했습니다:

```javascript
// tailwind.config.js
module.exports = {
  purge: ["./src/**/*.html", "./src/**/*.js"],
  theme: {},
  variants: {},
  plugins: [],
};
```

### Tailwind v2.1 이후 (JIT 엔진)

Tailwind CSS v2.1부터는 **JIT(Just-In-Time) 엔진**이 도입되어 PurgeCSS가 내장되었습니다. 이제는 `content` 옵션만 설정하면 자동으로 최적화가 이루어집니다:

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx,vue}"],
  theme: {},
  plugins: [],
};
```

## 최적화 효과

PurgeCSS를 사용하면 놀라운 파일 크기 감소 효과를 볼 수 있습니다:

- **최적화 전**: 약 900KB
- **최적화 후**: 약 6.5-10KB
- **감소율**: 약 **90-99% 감소**

실제 사례로, Netflix Top 10은 Tailwind CSS를 사용하면서도 전체 CSS 파일이 단 **6.5KB**에 불과합니다.

## 프로덕션 빌드 프로세스

PurgeCSS는 주로 **프로덕션 빌드 시에만** 실행됩니다:

### 개발 환경

```bash
npm run dev
# PurgeCSS 비활성화 - 모든 클래스 사용 가능
```

### 프로덕션 환경

```bash
npm run build
# 또는
NODE_ENV=production npm run build
# PurgeCSS 활성화 - 사용된 클래스만 포함
```

개발 중에는 다양한 클래스를 시도해볼 수 있도록 모든 클래스를 유지하고, 프로덕션 빌드 시에만 최적화를 수행하는 것이 권장됩니다.

## 주의사항

### 동적 클래스명 문제

PurgeCSS는 정적 분석을 통해 클래스명을 찾기 때문에, **문자열 결합으로 동적 클래스명을 생성하면 안 됩니다**:

**❌ 잘못된 방법:**

```javascript
<div class={`text-${error ? "red" : "green"}-600`}></div>
```

**✅ 올바른 방법:**

```javascript
<div class={error ? "text-red-600" : "text-green-600"}></div>
```

클래스명이 파일 내에 **완전한 형태로 존재**해야 PurgeCSS가 인식할 수 있습니다.

## Safelist (안전 목록)

데이터베이스에서 가져온 콘텐츠나 동적으로 생성되는 클래스처럼, 코드에서 직접 찾을 수 없지만 보존해야 하는 클래스가 있다면 `safelist` 옵션을 사용할 수 있습니다:

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.html"],
  safelist: [
    "bg-blue-500",
    "text-center",
    /^hover:/, // hover로 시작하는 모든 클래스
  ],
};
```

## 정리

PurgeCSS는 Tailwind CSS의 핵심 최적화 도구로, 프로젝트에서 실제로 사용하는 CSS 클래스만 남기고 나머지를 제거하여 최종 CSS 파일 크기를 **90-99%까지 줄여줍니다**. 이를 통해 웹사이트의 로딩 속도를 개선하고 성능을 향상시킬 수 있습니다. Tailwind CSS v2.1 이후부터는 JIT 엔진에 내장되어 있어 별도 설치 없이 `content` 옵션만 설정하면 자동으로 최적화가 이루어집니다.



