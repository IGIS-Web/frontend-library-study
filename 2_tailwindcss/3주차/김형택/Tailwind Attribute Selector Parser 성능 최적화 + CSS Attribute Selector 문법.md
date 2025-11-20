# Tailwind Attribute Selector Parser 성능 최적화 + CSS Attribute Selector 문법

---

## 1. 성능 최적화 포인트

이 파서는 Tailwind CSS 내부에서 **JIT 모드로 클래스와 선택자를 빠르게 파싱**하기 위해 설계되어 있습니다.

### 1.1 문자 코드 기반 처리
- `input.charCodeAt(i)`를 사용하여 **문자 코드 단위로 비교**
- 문자열 비교 또는 정규식 비교보다 **숫자 비교가 훨씬 빠릅니다**
- 예: `if (currentChar >= LOWER_A && currentChar <= LOWER_Z) continue`

### 1.2 루프 최소화 및 버퍼 누적
- 입력 문자열을 **한 번 순회**하면서 attribute 이름, 연산자, 값, sensitivity 등을 판별
- `buffer` 누적 후 필요 시 `slice()` 호출 → 문자열 재생산 최소화
- 백슬래시(`\`) 처리 시만 인덱스를 건너뛰어 추가 비용 최소화
```ts
start = i
for (; i < end; i++) {
    let currentChar = input.charCodeAt(i)
    // Skip escaped character
    if (currentChar === BACKSLASH) {
        i++
        continue
    }
    if (currentChar >= UPPER_A && currentChar <= UPPER_Z) continue
    if (currentChar >= LOWER_A && currentChar <= LOWER_Z) continue
    if (currentChar >= ZERO && currentChar <= NINE) continue
    if (currentChar === DASH || currentChar === UNDERSCORE) continue
    break
}
let attribute = input.slice(start, i)
```
- 루프 안에서는 단순히 인덱스(`i`)만 이동.
- 나중에 `slice` 한 번만 호출하여 문자열을 추출.
- 불필요한 문자열 누적을 피해 메모리 효율 및 속도 향상.

#### 안좋은 예: 루프 내 문자열 누적
```ts
let buffer = ""
for (; i < end; i++) {
    let currentChar = input.charCodeAt(i)
    if ((currentChar >= UPPER_A && currentChar <= UPPER_Z) ||
        (currentChar >= LOWER_A && currentChar <= LOWER_Z) ||
        (currentChar >= ZERO && currentChar <= NINE) ||
        currentChar === DASH || currentChar === UNDERSCORE) {
        buffer += input[i]  // 매 루프마다 새로운 문자열 객체 생성
    } else if (currentChar === BACKSLASH) {
        i++
        buffer += input[i]
    } else {
        break
    }
}
let attribute = buffer
```
- 루프 안에서 `+=` 연산 사용 시 매번 새로운 문자열 생성.
- 입력이 길면 O(n^2) 비용 발생.
- 메모리 비효율 및 GC 부담.

### 1.3 공백 처리 전용 함수
- `isAsciiWhitespace(code)` 함수로 공백 문자 검사
- 반복문 내에서 빈번히 호출돼도 **switch 기반 단순 비교**로 빠름

### 1.4 조기 종료 (early‑exit)
- 형식이 맞지 않을 경우 즉시 `null` 반환
  - 예: 입력이 `[`로 시작하지 않거나 `]`로 끝나지 않을 때
  - operator가 올바르지 않거나 value가 없을 때
- 불필요한 처리를 피하고 루프 비용 절감

### 1.5 연산자 판별 최적화
- `=` 단일 연산자 및 `~=`, `|=`, `^=`, `$=`, `*=` 같은 **두 글자 연산자**를 코드 조건문으로 처리
- 문자열 연산이나 정규식을 쓰지 않고 **코드값 비교 + 인덱스 이동**으로 빠르게 처리

### 1.6 Sensitivity(대소문자 구분) 처리
- `[attr=value i]`, `[attr=value s]` 같은 선택자를 위한 처리
- `switch (input.charCodeAt(i))` 구조로 `'i'` 또는 `'s'`를 판별
- 잘못된 값이면 즉시 종료 → 불필요한 연산 제거

---

## 2. CSS Attribute Selector 문법 정리

### 2.1 기본 구조
```css
[attribute]           /* 속성 존재 여부 */
[attribute=value]     /* 정확히 일치 */
[attribute~=value]    /* 공백으로 구분된 단어 포함 */
[attribute|=value]    /* value‑나 value‑하이픈 접두사 포함 */
[attribute^=value]    /* 시작 부분 일치 */
[attribute$=value]    /* 끝 부분 일치 */
[attribute*=value]    /* 부분 문자열 포함 */
[attribute=value i]   /* 대소문자 구분 없음 */
[attribute=value s]   /* 대소문자 구분 있음 */
```

### 2.2 연산자 설명

| 연산자 | 의미 | 예시 |
|--------|------|------|
| `=`    | 정확히 일치 | `[type="text"]` |
| `~=`   | 공백으로 구분된 단어 포함 | `[class~=btn]` → class="btn primary" |
| `|=`   | 접두사 포함 (하이픈 구분) | `[lang|=en]` → lang="en-US" |
| `^=`   | 시작 부분 일치 | `[title^="Hello"]` |
| `$=`   | 끝 부분 일치 | `[href$=".com"]` |
| `*=`   | 부분 문자열 포함 | `[class*="btn"]` |

### 2.3 Sensitivity (대소문자 구분)

| 값 | 의미 |
|-----|------|
| `i` | 대소문자 구분 없음 (insensitive) |
| `s` | 대소문자 구분 있음 (sensitive) |

예:
```css
[lang="en" i] { /* insensitive */ }
[lang="en" s] { /* sensitive */ }
```

---

## 참고 링크  
- [tailwindlabs/tailwindcss ‑ attribute‑selector‑parser.ts](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/attribute-selector-parser.ts)