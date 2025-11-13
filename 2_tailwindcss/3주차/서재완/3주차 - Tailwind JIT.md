# JIT

본론으로 들어가기 전에, 먼저 **JIT(Just-in-Time)**이 무엇인지 짚고 가겠습니다.

> **JIT**는 프로그램을 **실행 시점**에 **네이티브 기계어로 컴파일**해 실행하는 기법입니다.

전통적으로 프로그램 실행 모델은 크게 두 가지로 나뉩니다.

-   인터프리터 :
    소스 코드를 **한 줄(한 명령)씩 해석하며 즉시 실행**. 실행 기록을 남기지 않거나 제한적으로만 남김, **같은 코드를 반복 실행해도 매번 해석 비용**이 듦.
-   정적 컴파일 :
    실행 전에 **전체 프로그램을 기계어로 번역**. 실행 중 추가 해석·컴파일 비용이 적지만, 런타임 특성에 맞춘 세밀한 최적화는 어렵다.

설명만 봤을 때는 인터프리터 방식과 JIT 방식은 크게 차이가 없어 보입니다. 둘 다 실행하는 시점에 기계어로 번역해주는 방식이기 때문입니다.

## JIT vs 인터프리터

앞서 이야기한 것처럼 JIT와 인터프리터는 실행 중 프로그래밍 언어를 기계어로 번역하는 기능을 가지고 있습니다. 그렇다면 JIT의 어떤 점이 인터프리터와 다를까요?

-   **인터프리터**
    -   실행 단위: **명령(문) 단위 해석 → 즉시 실행**
    -   캐시: 주로 **해석을 빠르게 하기 위한 메타 캐시**(예: 인라인 캐시) 중심
    -   특성: **매번 해석**이 필요하므로 **반복 실행 시 해석 비용 누적**
-   **JIT**
    -   실행 단위: **함수/루프 등 블록 단위**로 **네이티브 코드 생성**
    -   캐시: 생성한 **기계어 자체를 코드 캐시에 저장** → **재실행 시 해석을 완전히 생략**
    -   특성: **핫 경로**(자주 실행되는 코드)에 **집중 투자**해 성능 상득

인터프리터도 “**인라인 캐시**” 같은 ‘해석 자체를 빠르게 하는 캐시’는 가지고 있습니다. 하지만 **‘기계어 코드 자체를 만들어 두고 재사용’**하는 JIT와는 다른 방식으로 사용됩니다.

> JIT은 “자주 도는 코드만 뽑아 **네이티브로 만들어 저장**하고, 다음부턴 **그걸 바로 실행**한다.”

## 언제 같은 코드를 반복할까?

JIT와 인터프리터의 차별점으로 같은 코드를 반복한다는 부분에서 동작하는 방식이 달라집니다. 그렇다면 여기서 같은 코드를 반복하는 상황이란게 어떤 상황이 있을까요?

-   **루프/반복문**: `for/while` 내부 연산, 정렬·필터 같은 반복 로직
-   **이벤트 핸들러**: 스크롤/마우스 이동/입력 이벤트로 **동일 콜백 다회 호출**
-   **핫 라우트**: 페이지 전환마다 재실행되는 공통 유틸/파이프라인

저는 기본적으로 프론트엔드 개발자이기 때문에 프론트 관점의 예시를 가지고 왔습니다. 말 그대로 이미 실행한 전적이 있는 코드를 다시 실행하는 경우 동작의 차이가 발생합니다.

## JIT 성능으로써 안녕할까?

전체적인 틀은 이해가 되었습니다. 그렇다면 성능적인 문제는 없을까요? 캐시에 저장이 된다면 언젠가는 저장소가 꽉차게 되는 경우가 발생할 수 있을텐데, 프로젝트가 크면 클수록 금방 저장소가 꽉 차는게 아닐까? 생각이 들었습니다.

결론부터 **말하자면 그럴 수 있고, 아닐 수 있습니다.**

핵심은 JIT가 **“모든 기계어”를 캐싱하지는 않는다**는 점입니다. 모든 것을 무차별 캐싱하는 것이 아니라, 실행 통계를 보고 **“핫한 것만” 네이티브로 캐싱**합니다.

그래도 느려질 수 있긴 합니다.

-   **코드 캐시가 꽉 차는 경우** :
    많은 핫 경로가 생기면 코드 캐시가 압박되면서 자체적으로 정리가 되기 전까지 느려질 수 있습니다.
-   **컴파일 오버헤드** :
    핫 코드가 많아질수록 컴파일 비용이 늘 수 밖에 없어 성능상 압박을 받을 수 있습니다.

# Tailwind CSS JIT

Tailwind CSS는 2.1 버전부터 JIT(Just-In-Time) 컴파일러를 도입했습니다. 기존처럼 빌드 시점에 **모든 유틸리티 클래스를 한꺼번에 만들어 두는 방식**이 아니라, **템플릿에 등장하는 클래스만 실시간으로 생성하는 방식**으로 바뀐 거죠.

## 장점

그렇다면 JIT 도입 이후에는 어떤 변화들이 있었을까요? [공식 문서](https://v2.tailwindcss.com/docs/just-in-time-mode)에 따르면 대표적으로 다음과 같은 장점들을 이야기합니다.

### 1. 훨씬 빨라진 빌드 속도

JIT 이전에는 초기 컴파일에만 3–8초가 걸리고, webpack 기반 프로젝트에서는 CSS 파일이 커질수록 30–45초까지도 걸리곤 했습니다.

하지만 JIT 도입 이후에는 어떤 빌드 도구를 쓰든 **큰 규모의 프로젝트도 약 800ms 정도**에 컴파일할 수 있고, **최대 3ms 수준**까지 줄어든다고 합니다.

### 2. 모든 variant 기본 활성화

`focus-visible`, `active`, `disabled` 같은 variant들은 CSS 파일 크기를 줄이기 위해 기본 설정에서는 꺼져 있었습니다.

JIT 환경에서는 **“쓰는 순간에”** 필요한 스타일만 생성하기 때문에, 이제는 어떤 variant든 별도 설정 없이 곧바로 사용할 수 있습니다. `sm:hover:active:disabled:opacity-75`처럼 variant를 겹겹이 쌓아도 문제없죠.

### 3. 커스텀 CSS 없이도 임의의 값 사용

마찬가지로 “필요한 순간에 생성”한다는 특성 덕분에, `top-[-113px]`처럼 대괄호 표기법을 사용해서 디자인 시스템에 없는 값도 유틸리티 클래스로 바로 쓸 수 있습니다.

예를 들어 `md:top-[-113px]`처럼 브레이크포인트와 함께 조합하는 것도 가능합니다.

이 외에도 **개발 환경과 프로덕션 환경에서의 CSS가 완전히 동일**하고, **개발 중 브라우저 성능도 더 좋아지는** 등의 장점이 있습니다.

그렇다면 이렇게 동작하는 Tailwind CSS의 JIT 컴파일러 내부에서는 **어떤 방식으로 클래스를 파싱하고, 언제 CSS를 생성해서 브라우저에 전달** 하고 있을까요?

다음으로는 그 구현 관점에서 JIT를 한 번 들여다보려고 합니다.

## 어떤 방법 방향으로 구현했을까?

Tailwind CSS v3는 이제 **JIT(Just-In-Time) 모드만 지원**합니다.

즉, “빌드할 때 전부 한 번에 CSS를 뽑는 도구”라기보다, **템플릿을 훑어보면서 필요한 유틸리티 클래스를 그때그때 만들어내는 엔진**에 가깝습니다.

이 JIT 엔진이 내부에서 어떤 흐름으로 동작하는지, 코드를 통해 단계별로 살펴보겠습니다.

### **1. 설정 파일 로드**

가장 먼저 `tailwind.config.js` 파일을 찾아서 불러옵니다.

```jsx
// src/util/resolveConfigPath.js
export default function resolveConfigPath(pathOrConfig) {
    // ...
    for (const configFile of ["./tailwind.config.js", "./tailwind.config.cjs"]) {
        try {
            const configPath = path.resolve(configFile);
            fs.accessSync(configPath);
            return configPath;
        } catch (err) {}
    }

    return null;
}
```

여기서는 프로젝트 루트 기준으로:

-   `tailwind.config.js`
-   `tailwind.config.cjs`

두 파일 중 존재하는 것을 찾아서 경로를 반환합니다.

이 설정 파일에서 JIT 엔진이 **어디를 스캔해야 할지**, **어떤 옵션을 기준으로 클래스를 만들어야 할지**를 읽어옵니다.

대표적으로 중요한 필드가 바로 `content`입니다.

```jsx
// tailwind.config.js
module.exports = {
    content: ["./src/**/*.{html,js,jsx,tsx}", "./pages/**/*.{html,js}"]
    // ...
};
```

여기 적힌 glob 패턴이 **“이 파일들을 돌아다니면서 클래스 이름을 찾으라”**는 JIT의 탐색 범위가 됩니다.

### 2. 파일 목록 구체화

`content` 필드에는 glob 패턴(`./src/**/*.jsx` 등)만 적혀 있기 때문에,
실제로는 이걸 **실제 파일 경로 목록**으로 풀어줘야 합니다.

```jsx
// src/lib/setupTrackingContext.js
function resolveChangedFiles(candidateFiles, fileModifiedMap) {
    let changedFiles = new Set();

    // fast-glob으로 파일 검색
    let files = fastGlob.sync(candidateFiles);
    // 예: ['src/index.html', 'src/App.jsx', 'pages/home.js', ...]

    for (let file of files) {
        let prevModified = fileModifiedMap.has(file) ? fileModifiedMap.get(file) : -Infinity;

        let modified = fs.statSync(file).mtimeMs;

        if (modified > prevModified) {
            changedFiles.add(file);
            fileModifiedMap.set(file, modified);
        }
    }

    return changedFiles;
}
```

여기서 핵심 포인트는 두 가지입니다.

1. **`fast-glob`으로 후보 파일 목록을 싹 긁어온다.**

    → `candidateFiles`(glob 패턴 배열) → 실제 파일 경로 배열

2. **`fileModifiedMap`으로 변경된 파일만 골라낸다.**
    - `fileModifiedMap`에는 “이 파일을 마지막으로 봤을 때의 수정 시간(mtimeMs)”이 저장됩니다.
    - 처음 보는 파일이면 `prevModified`를 `Infinity`로 두고,
      현재 `mtimeMs`가 더 크기 때문에 “변경된 파일”로 간주합니다.
    - 이후에는 `modified > prevModified`인 경우에만 다시 읽습니다.

즉, JIT는 **매번 모든 파일을 다시 읽지 않고**,

“지난 빌드 이후로 수정된 파일만” 다시 파싱해서 속도를 끌어올립니다.

### 3. 파일 스캔 및 읽기

변경된 파일이 정해졌다면, 이제 실제로 내용을 읽어서 “분석 대상”으로 올립니다.

```jsx
// src/lib/setupTrackingContext.js
function resolvedChangedContent(context, candidateFiles, fileModifiedMap) {
    let changedContent = [];

    // 1. raw content (설정에서 직접 제공한 문자열)
    changedContent = context.tailwindConfig.content.files
        .filter(item => typeof item.raw === "string")
        .map(({raw, extension = "html"}) => ({content: raw, extension}));

    // 2. 파일 시스템에서 읽기
    for (let changedFile of resolveChangedFiles(candidateFiles, fileModifiedMap)) {
        let content = fs.readFileSync(changedFile, "utf8");
        let extension = path.extname(changedFile).slice(1);
        changedContent.push({content, extension});
    }

    return changedContent;
}
```

여기서는 두 종류의 소스를 한꺼번에 다룹니다.

1. **config에 직접 문자열로 적어둔 `raw` 콘텐츠**

```jsx
// tailwind.config.js 예시
content: [
    {
        raw: '<div class="text-pink-500">Hello</div>',
        extension: "html"
    }
];
```

이런 식으로 “파일 없이도 이 문자열에서 클래스를 뽑아라”라고 직접 줄 수도 있기 때문에,
먼저 `raw` 값을 가진 항목들을 `changedContent`에 넣습니다.

1. **실제 파일에서 읽은 콘텐츠**

    `resolveChangedFiles`로 뽑힌 변경 파일들에 대해:

    - `fs.readFileSync`로 내용을 읽고
    - 확장자를 따서(`.jsx` → `jsx`)
    - `{ content, extension }` 형태로 `changedContent`에 추가합니다.

최종적으로 이 정보는 `context.changedContent`에 저장됩니다.

```jsx
// src/lib/setupTrackingContext.js
if (tailwindDirectives.size > 0) {
    let fileModifiedMap = getFileModifiedMap(context);

    for (let changedContent of resolvedChangedContent(context, candidateFiles, fileModifiedMap)) {
        context.changedContent.push(changedContent);
    }
}

// 결과 예시:
context.changedContent = [
    {content: '<div class="bg-blue-500">...', extension: "html"},
    {content: 'export default () => <div className="px-4">', extension: "jsx"}
    // ...
];
```

정리하면, 이 단계까지는:

-   “**어디서 Tailwind 클래스를 찾아야 하는지**”를
-   `{ content, extension }` 묶음으로 **JIT 엔진이 처리하기 좋은 형태로 정리**해 둔 상태입니다.

### 4. 클래스 후보 추출

이제 본격적으로 파일 내용에서 **Tailwind 유틸리티 클래스 후보 문자열**을 뽑아냅니다.

```jsx
// src/lib/expandTailwindAtRules.js
const PATTERNS = [
    /([^<>"'`\s]*\[\w*'[^"`\s]*'?\])/, // font-['Inter']
    /([^<>"'`\s]*\[\w*"[^"`\s]*"?\])/, // font-["Inter"]
    /([^<>"'`\s]*\[\w*\('[^"'`\s]*'\)\])/, // bg-[url('...')]
    /([^<>"'`\s]*\[\w*\("[^"'`\s]*"\)\])/, // bg-[url("...")]
    /([^<>"'`\s]*\['[^"'`\s]*'\])/, // content-['hello']
    /([^<>"'`\s]*\["[^"'`\s]*"\])/, // content-["hello"]
    /([^<>"'`\s]*\[[^<>"'`\s]*:'[^"'`\s]*'\])/, // [content:'hello']
    /([^<>"'`\s]*\[[^<>"'`\s]*:"[^"'`\s]*"\])/, // [content:"hello"]
    /([^<>"'`\s]*\[[^"'`\s]+\][^<>"'`\s]*)/, // bg-[#bada55]
    /([^<>"'`\s]*[^"'`\s:])/ // px-4, hover:bg-blue-500
].join("|");
```

이 정규식들이 하는 일은 한 줄로 요약하면:

> “**HTML 문법이나 문자열 리터럴은 피해 가면서, Tailwind 유틸리티일 가능성이 있는 토큰들을 최대한 많이 긁어 모으기**”

-   대괄호 표기법(`bg-[url('...')]`, `top-[-113px]`, `content-['hello']`, `bg-[#bada55]` 등)
-   일반 유틸리티(`px-4`, `hover:bg-blue-500` 등)
-   variant와 결합된 형태(`sm:hover:active:disabled:opacity-75` 등)

까지 모두 “후보”로 뽑아낼 수 있도록 패턴들을 조합해 둔 모습입니다.

여기서 중요한 점은:

-   이 단계에서 **“정확히 유효한 Tailwind 클래스인지”를 아직 완전히 판단하지 않는다.**
-   일단 “그럴 듯한 것들”을 전부 후보로 수집한 뒤,
-   **다음 단계에서 Tailwind의 core 엔진이 프리셋/플러그인 설정을 기준으로 해석하고, 실제 CSS 규칙을 생성**합니다.

즉, 지금은 **“문자열 레벨에서 후보 토큰들을 뽑는 전처리 단계”**라고 볼 수 있습니다.

### 5. 클래스 캐싱

앞 단계까지는 템플릿에서 `px-4`, `bg-blue-500`, `md:hover:bg-red-500` 같은 **클래스 후보(candidates)** 문자열을 뽑아냈습니다.
이 후보들을 실제 CSS 규칙으로 바꾸는 단계에서, 같은 클래스에 대한 작업을 중복해서 하지 않도록 캐싱을 적극적으로 사용합니다.

```jsx
// src/lib/generateRules.js:461-483
function generateRules(candidates, context) {
  let allRules = []

  for (let candidate of candidates) {
    // 1단계: 유효하지 않은 클래스 건너뛰기
    if (context.notClassCache.has(candidate)) {
      continue
    }

    // 2단계: 이미 생성한 클래스는 재사용!
    if (context.classCache.has(candidate)) {
      allRules.push(context.classCache.get(candidate))
      continue  // 생성 건너뛰기!
    }

    // 3단계: 처음 보는 클래스만 생성
    let matches = Array.from(resolveMatches(candidate, context))

    if (matches.length === 0) {
      context.notClassCache.add(candidate)  // 유효하지 않음 기록
      continue
    }

    // 4단계: 생성된 클래스를 캐시에 저장
    context.classCache.set(candidate, matches)
    allRules.push(matches)
  }

  return allRules.flat(1).map(...)
}
```

이 코드를 단계별로 풀어보면:

1. `notClassCache`: “이건 클래스 아님” 캐싱

```jsx
if (context.notClassCache.has(candidate)) {
  continue
}
```

-   `candidate`가 예전에 한 번 검사됐는데,
-   Tailwind가 이해할 수 있는 유틸리티 클래스가 **아니라**고 판정된 경우,
-   `notClassCache`에 기록해 둡니다.
-   다음에 똑같은 문자열이 또 나와도 **다시 해석하지 않고 바로 스킵**합니다.

예를 들어 템플릿 안에 이상한 문자열이 섞여 있어서

`foo-bar-baz`처럼 Tailwind와 관계없는 토큰이 계속 나와도:

-   첫 번째 한 번만 `resolveMatches`를 돌려보고
-   “유효한 매칭 없음”이면 `notClassCache`에 넣고
-   그 이후로는 공짜로 건너뛰는 구조입니다.

1. `classCache`: “이미 컴파일한 클래스” 재사용

```jsx
if (context.classCache.has(candidate)) {
  allRules.push(context.classCache.get(candidate))
  continue
}
```

-   반대로, 어떤 `candidate`는 이전에 이미 **성공적으로 CSS 규칙을 만들어 본 적이 있는** 문자열입니다.
    -   예: `bg-blue-500`, `md:px-4`, `hover:underline` 등
-   그런 애들은 `classCache`에 `candidate → 생성된 규칙 목록(matches)` 형태로 저장되어 있고,
-   다시 등장했을 때는 `resolveMatches`를 다시 돌리지 않고 **캐시된 결과만 배열에 추가**합니다.

이 덕분에:

-   템플릿 곳곳에서 같은 클래스(`px-4`, `flex`, `gap-2`…)가 수십, 수백 번 등장해도,
-   **실제 “클래스를 해석해서 CSS로 바꾸는 작업”은 딱 한 번만 수행**됩니다.

1. `resolveMatches`: 처음 보는 클래스만 실제로 해석

```jsx
let matches = Array.from(resolveMatches(candidate, context))

if (matches.length === 0) {
  context.notClassCache.add(candidate)
  continue
}
```

-   여기서가 진짜 비용이 큰 부분입니다.
-   `resolveMatches`는:
    -   `candidate` 문자열을 파싱하고
    -   variant(`hover:`, `md:` 등)를 적용하고
    -   `theme`, `plugins` 설정을 참고해서
    -   최종적으로 **“어떤 CSS 규칙들로 풀려야 하는지”** 계산합니다.
-   결과(`matches`)가 비어 있다면:
    -   Tailwind에서 지원하지 않는 클래스거나
    -   오타 등으로 잘못 쓴 문자열이므로
    -   `notClassCache`에 기록하고 스킵.

1. 생성 결과를 `classCache`에 저장

```jsx
context.classCache.set(candidate, matches);
allRules.push(matches);
```

-   `matches`에 하나 이상의 CSS 규칙이 들어 있다면:
    -   `classCache`에 저장해서, 다음에 같은 문자열이 나왔을 때 재사용할 수 있게 합니다.
    -   이번 루프에서는 `allRules`에 추가해서 최종 결과에 포함시킵니다.
-   마지막에 `allRules.flat(1).map(...)`으로 한 번 평탄화해서
    실제 CSS AST나 문자열로 변환하는 단계로 넘어갑니다.

## 그렇다면 인터프리터와 다른점은?

JIT에 대해서 이해하기 위해서 Tailwind CSS를 확인한거지 사실 전체적인 내용을 모두 이해할 필요는 없습니다. 하지만 위 설명을 보면 한 가지 의문이 생길 수 있습니다.

> “이게 그냥 ‘매번 해석하는 인터프리터’랑 뭐가 다르지?”
>
> "결국 변경 없으면 캐시된 걸 쓰는 그 지점이 JIT인 거야?”

### 지금까지 본 Tailwind JIT의 흐름 정리

위에 정리한 내용은 대략 다음과 같은 일을 하고 있습니다 :

1. `tailwind.config.js` → `content` 에서 glob 패턴 읽기
2. `fast-glob`으로 실제 파일 목록 만들기
3. `fileModifiedMap`으로 **수정된 파일**만 골라내기
4. 골라낸 파일만 `fs.readFileSync`로 읽어서
5. 정규식으로 **클래스 후보 토큰** 뽑기
6. 이걸 `context.changedContent`에 쌓기

여기까지는 말 그대로:

> “어떤 파일이 바뀌었는지 추적하면서, 바뀐 애들만 다시 스캔 후 유틸리티 후보를 모으는 작업”

입니다.

### 이걸 “인터프리터 스타일”로 한다면 어떻게 될까?

Tailwind를 진짜 인터프리터처럼 만든다고 생각하면 다음과 같이 동작합니다.

-   코드를 “실행 시점마다” 처음부터 끝까지 쭉 읽는다.
-   읽을 때마다 클래스 문자열을 해석해서 필요한 CSS를 생성한다.
-   **이전 결과를 따로 기억해 두지 않는다.**

즉, **변경 여부 상관없이 전체를 매번 해석하는 방식**이 인터프리터스러운 방식입니다.

### Tailwind JIT의 “캐싱” 포인트

Tailwind JIT는 인터프리터와 반대로 **“날먹할 수 있는 건 최대한 날먹”**하는 쪽입니다.

1. **파일 단위 캐싱**
   `fileModifiedMap`이 하는 일입니다.

-   이 파일을 언제 봤는지(mtimeMs) 기억해둔다.
-   파일 리스트를 다시 돌 때,
    -   수정 시간이 **예전과 같으면 ⇒ 안 바뀐 파일 ⇒ 다시 읽지 않음**
    -   수정 시간이 **커졌으면 ⇒ 바뀐 파일 ⇒ 다시 읽어서 파싱**

> **“변경이 없으면 캐싱한 걸 그대로 사용한다”**

가 정말 맞는 말입니다.

1. **클래스 규칙 단위 캐싱**
   `generateRules`이 하는 일입니다.

-   `bg-blue-500`이 처음 등장했을 때
    -   Tailwind core 엔진이 클래스를 파싱해서
    -   “background-color: theme(’colors.blue.500’) 같은 CSS 룰을 만듭니다.
-   같은 빌드 세션 안에서 `bg-blue-500`이 다른 파일에서 또 등장하더라도
    -   이미 만들어 둔 CSS 규칙을 또 만들 필요가 없다.
    -   “이 클래스는 이미 존재함”으로 끝

즉, **“이미 본 클래스 → 다시 컴파일하지 않음”** 이라는 의미에서도 캐싱이 들어가 있습니다.

## 그렇다면 Tailwind의 JIT는?

지금까지 살펴본 바로는 JIT 라는 기능은 거창한 로직을 구현하는게 아닌 **실시간 처리 + 캐싱 = JIT** 라고 이해가 될 수 있다. 이 부분을 조금 더 심화적으로 살펴보자.

### CS 쪽에서 말하는 “JIT”의 핵심

일반적으로 CS에서 말하는 JIT는 다음과 같은 요소를 말합니다 :

-   **컴파일을 “미리(빌드 타임)” 하는 게 아니라, 실행 시점에 한다**
    -   AOT(앞에서 싹 다 컴파일) vs JIT(필요할 때 그때그때 컴파일)
-   **실행을 더 빠르게 하기 위한 ‘다른 표현(더 빠른 코드)’로 바꾼다**
    -   예: 바이트코드/AST → 네이티브 머신 코드
    -   단순히 “그때그때 해석”만 하면 그건 여전히 인터프리터에 가까움
-   **“자주 쓰이는 것만” 골라서 컴파일하고, 그 결과를 캐싱해서 재사용한다**
    -   통계 + 캐싱이 붙어서
    -   “핫한 코드”는 점점 더 최적화된 형태로 실행됨

즉, **“실시간 처리”**랑 **“캐싱”**은 JIT가 자주 쓰는 기법이지만 둘만 있다고 JIT라고 부르지는 않습니다.

예를 들어 :

-   **DB 쿼리 캐싱**
    -   쿼리가 들어오는 시점에 실행됨 ⇒ 실시간 처리
    -   결과를 메모리에 저장해 두고, 다음부터는 DB 연산을 생략하고 돌려줌 ⇒ 캐싱
-   **React의 memoization**
    -   렌더링이 시작될 때 호출 ⇒ 실시간 처리
    -   deps 배열의 값을 비교해서 결과 재사용 ⇒ 캐싱
-   **HTTP 응답 캐시**
    -   요청이 들어온 **“그 시점에”** 서버가 처리 ⇒ 실시간 처리
    -   응답을 저장해두고, 같은 요청이 오면 재사용 ⇒ 캐싱

을 JIT라고 부르지는 않습니다.

### 인터프리터 + 캐싱은 JIT일까?

다음과 같은 경우를 예를 들어 봅시다:

-   인터프리터가 존재
-   코드를 한 줄씩 읽어서 실행
-   이미 본 줄은 “전에 해석했군” 하면서 해석 결과를 캐싱
-   네이티브 코드로 컴파일하지는 않고, 내부적으로 “해석 비용”만 줄여줌

이 경우에는 :

-   “캐싱을 잘 하는 인터프리터”
-   “JIT-lite 같은 최적화된 인터프리터”

라고 부를 수 있어도 “JIT 컴파일러”라고 부를지는 확실하지 못한 애매한 영역입니다.

### Tailwind CSS가 “JIT”라고 부르는 맥락

Tailwind 쪽은 느슨한 의미로 JIT를 사용하고 있는 것 같습니다 :

> **“CSS를 미리 만들어두지 않고, 템플릿에서 필요해졌을 때 생성하는 엔진”**

이라는 느낌으로요.

여기서 Tailwind의 JIT 특징을 다시 보자면 :

-   **빌드 전 전체 유틸리티 CSS를 풀셋으로 생성하지 않고**
-   템플릿에서 **후보 클래스를 뽑아서**
-   **처음 나온 클래스만 규칙을 생성해서 캐시에 쌓고**
-   다시 나오는 클래스는 캐시된 규칙만 재사용

즉, Tailwind는 “머신 코드로 컴파일” 같은 건 없지만 :

-   **타이밍** : 미리 한 방에 다 안 만들고, “필요할 때 그때그때” 생성
-   **캐싱** : 생성한 결과는 context에 넣어두고 재사용
-   **불필요한 것** : 안 쓰는 클래스는 애초에 만들지도 않음

이 구조가 전통적인 CSS 빌드와 대비되기 때문에 **“JIT 컴파일러”**라고 붙인게 아닐까 생각됩니다.
