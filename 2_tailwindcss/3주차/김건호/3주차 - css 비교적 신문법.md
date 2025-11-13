
# 🎶 3주차 CSS 비교적 신문법 소개

---

## 1. `:is()` & `:where()` Pseudo-Classes (2020년)

### ✅ 기존 여러 선택자 지정 방법

```css
div,
h1,
h2,
h3 {
    color: blue;
}

div a,
h1 a,
h2 a,
h3 a {
    color: red;
}
```

---

### ✅ `:is` 또는 `:where` 사용 예시

```css
:is(div, h1, h2, h3) {
    color: blue;
}

:is(div, h1, h2, h3) a {
    color: red;
}

:where(div, h1, h2, h3) {
    color: blue;
}

:where(div, h1, h2, h3) a {
    color: red;
}
```

---

### ⚡️ `:is()` vs `:where()` 차이

| 구분      | :is()                                      | :where()                        |
|-----------|--------------------------------------------|---------------------------------|
| 우선순위  | 선택자 그룹의 **가장 높은 우선순위**         | **항상 0** (가장 낮음)           |
| 스타일 충돌 | 우선순위가 높아 덮어쓸 수 있음               | 항상 다른 선택자에 밀림           |

> **정리:** 기능은 비슷하지만, 우선순위(specificity)에서 차이가 있습니다. 스타일 우선순위가 중요하지 않으면 `:where()`를, 우선순위를 유지하고 싶으면 `:is()`를 사용하세요.

---

### 선택자 우선 순위 비교

```css
:is(h1, h2, h3, h4) {
    color: red;
}

:where(h1, h2, h3, h4) {
    color: blue;
}

h1 {
    color: green;
}

._h1 {
    color: orange;
}

#__h1 {
    color: slateblue;
}
```

## 2. `:has()` Pseudo-Class (2022년)

> 부모 요소가 특정 자식 요소를 포함하는지 여부로 스타일을 지정할 수 있습니다.

### ✅ `:has()` 사용 예시

```css
/* .container 안에 h1이 있을 때만 container에 배경 적용 */
.container:has(h1) {
    background-color: #09f;
}

/* form 안에 .error 클래스가 있을 때만 form 배경색 변경 */
form:has(.error) {
    background: red;
}
```

---

## 3. CSS Nesting (2023년)

> CSS에서 중첩 문법을 사용할 수 있게 되어, 구조적으로 더 깔끔한 스타일 작성이 가능합니다.

```css
.card {
    padding: 1rem;
    background-color: red;

    p {
        color: white;
        background-color: #09f;
    }

    .btn {
        border: none;
        outline: none;
        width: 5rem;

        &.active {
            border: 1px solid #09f;
            width: 8rem;
        }

        &:hover {
            background-color: blue;
            color: #FEFEFE;
            transition: all 0.3s ease-in-out;
        }
        
        /* 기본적으로 containerQuery 적용 */
        @container (max-width: 600px) {
            .container_query>div {
                background: #ffd700;
                color: #222;
            }
        }

        /* test 이름적용 */
        @container test (min-width: 601px) {
            .container_query>div {
                background: #32cd32;
                color: #fff;
            }
        }
    }
}
```
            
## 4. 컨테이너 쿼리 (2023년 2월 모든 브라우저 제공)

> 요소의 부모(컨테이너) 크기에 따라 스타일을 다르게 적용할 수 있는 기능입니다. 
- **container-type**은 해당 요소를 "컨테이너"로 지정하는 속성입니다.   
inline-size : 가로 크기 기준(가장 많이 사용)   
size : 가로+세로 모두 기준   
- **container-name**은 컨테이너 쿼리에서 컨테이너에 이름을 붙여주는 속성입니다.  


```css
.container_query {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid #09f;
    container-type: inline-size;
    container-name: test;
}

.container_query > div {
    flex: 1 1 0;
    background: #eee;
    padding: 2rem;
    text-align: center;
    font-weight: bold;
    transition: background 0.3s;
}

/* 기본적으로 containerQuery 적용 */
@container (max-width: 600px) {
    .container_query>div {
        background: #ffd700;
        color: #222;
    }
}

/* test 이름적용 */
@container test (min-width: 601px) {
    .container_query>div {
        background: #32cd32;
        color: #fff;
    }
}

```
- container-type: inline-size; 이라면 가로값이 600px or 601px 기준
- container-type: size 라면 가로/세로 중 하나라도 600px or 601px 기준  


## ✅ 컨테이너 쿼리 vs 미디어 쿼리 비교

| 구분            | 미디어 쿼리(@media)                | 컨테이너 쿼리(@container)                |
|-----------------|------------------------------------|------------------------------------------|
| 기준            | 브라우저(뷰포트) 전체 크기          | 특정 컨테이너(부모 요소) 크기             |
| 사용 위치       | 전역(전체 레이아웃에 영향)          | 컴포넌트/로컬(부분적 스타일링에 유리)     |
| 대표 예시       | @media (max-width: 600px) { ... }  | @container (max-width: 600px) { ... }    |
| 활용 상황       | 반응형 웹 전체 레이아웃             | 컴포넌트 단위 반응형, 재사용성 높은 UI    |


### 정리
- 미디어 쿼리는 브라우저 전체 크기에 반응, 컨테이너 쿼리는 부모 요소(컨테이너) 크기에 반응합니다.
- 컨테이너 쿼리는 컴포넌트 단위의 독립적 반응형 UI 구현에 매우 유용합니다.