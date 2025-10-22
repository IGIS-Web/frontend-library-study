# JIT(Just-In-Time) 엔진

## 1. 동작 과정
1. content 경로의 모든 파일(HTML, TSX 등)을 정규식으로 스캔
2. bg-red-500, text-center 같은 문자열 리터럴을 추출
3. 해당 토큰을 기반으로 PostCSS AST를 생성 후 CSS 빌드
4. 빌드 결과 캐시 후 변경 감시

## 2. 핵심 도구
### 2.1 JIT 나오기 이전 (Tailwind 2.x: PurgeCSS)
- 전체 CSS를 한번에 생성하고 코드에 안 쓰인 부분을 삭제하는 방식
- 개발 중엔 CSS 파일이 너무 큼 (50MB도 흔함)
- 코드 수정 시마다 purge 결과를 다시 만들어야 함

### 2.2 JIT 나온 이후 (Tailwind 3.x: Content Scanner)
- 필요할 때 CSS를 즉석에서 만드는 방식
- top-[113px] 같은 임의 값을 지정 가능함
- content 설정에서 명시한 파일을 실시간 감시 (watcher)
- 코드 안에서 "bg-red-500" 같은 문자열 리터럴이 발견되면 그 CSS만 생성해서 인메모리 캐시에 추가

## 3. 문제가 되었던 상황
```html
<div className={${!sidebarWidth ? "left-[10px]" : `left-[${sidebarWidth + 10}px]`} />
```
sidebarWidth가 50일때, 브라우저 개발자도구에서 className을 확인했을 땐 "left-[60px]",
하지만 CSS 스타일 적용은 되지 않았음.

### 3.1 이유
- JIT는 **빌드 타임**에 텍스트만을 읽어서 정규식으로 문자열을 찾음
- 하지만 sidebarWidth는 **런타임(실행) 시점**에야 계산되는 값
- 빌드 시점에도 코드에 존재하는 **정적 문자열**이 아니면 CSS를 만들 수 없음
```html
<!-- 같은 이유로 문자열 연결도 올바른 감지 불가능 -->
<div className={`mt-[${size === 'lg' ? '22px' : '17px' }]`}></div>
```
```html
<!-- 수정된 코드 -->
<div className={ size === 'lg' ? 'mt-[22px]' : 'mt-[17px]' }></div>
```

### 3.2 해결 방법
**공식 문서**: 이러한 상황에서는 **인라인 스타일**을 사용하거나, 프로젝트에 적합하다면 Tailwind를 Emotion과 같은 **CSS-in-JS 라이브러리**와 함께 사용하세요.
```html
<!-- style 태그 사용하기 -->
<div style={{ left: `${sidebarWidth + 10}px` }} />
```
```html
<!-- CSS 변수 사용하기 -->
<div
  className="left-[var(--sidebar-offset)]"
  style={{ "--sidebar-offset": `${sidebarWidth + 10}px` }}
/>
<!-- 무조건 sidebar-offset이라는 변수를 참조하도록 만들어두고, 런타임 이후에 CSS 변수의 값을 바꾸는 방법. -->
```

## 4. 기본 클래스 vs 임의 값
| 항목          | `p-2` (기본 클래스) | `p-[12px]` (임의 값) |
| ----------- | -------------- | ----------------- |
| 빌드 시 JIT 처리 | 없음 (미리 정의됨)    | 있음 (매번 CSS 생성)    |
| 런타임 성능      | 동일             | 동일                |
| 빌드 캐시 효율    | 좋음             | 상대적으로 나쁨          |
| 번들 사이즈      | 미미하지만 더 작음     | 값이 많을수록 커짐        |
| 유지보수성       | 직관적            | 헷갈릴 수 있음          |

- 앱 성능 면에서는 거의 차이 없음
- 하지만 임의 값이 많아지면 JIT가 빌드 시점에 클래스별로 CSS를 생성하기 때문에 **빌드 속도가 느려지고 번들 용량이 커질 수 있음**.
