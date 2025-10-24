# N-API 동작 원리: Rust를 JavaScript로 노출하는 방법

> N-API가 Rust 코드를 JavaScript에서 사용 가능하게 만드는 자동화 과정 상세 분석

## 핵심 이해

**맞습니다!** 당신의 이해가 정확합니다:

1. **N-API는 Node.js의 기본 기능** - Node.js가 C/C++/Rust 등 네이티브 코드를 로드할 수 있는 표준 인터페이스
2. **Rust에서 처리하는 것** - `napi-rs` 라이브러리가 Rust 코드를 N-API 호환 형태로 변환
3. **JavaScript에서는 일반 import** - Node.js가 자동으로 `.node` 바이너리를 로드
4. **특별한 Node 코드 불필요** - 빌드 과정에서 자동 생성된 `index.js`가 모든 것을 처리

---

## 전체 흐름

```
┌──────────────────────────────────────────────────────────────┐
│ 1. 개발자가 작성하는 Rust 코드                                │
│    crates/node/src/lib.rs                                     │
│                                                               │
│    #[napi]                                                    │
│    impl Scanner {                                             │
│      #[napi(constructor)]                                     │
│      pub fn new() -> Self { ... }                             │
│                                                               │
│      #[napi]                                                  │
│      pub fn scan(&mut self) -> Vec<String> { ... }            │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
                         ↓
                 napi build --release
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. napi-rs CLI가 자동 생성하는 것들                           │
│                                                               │
│    ✅ tailwindcss-oxide.darwin-arm64.node  (Rust → C → 바이너리) │
│    ✅ index.js                             (JavaScript 래퍼)  │
│    ✅ index.d.ts                           (TypeScript 타입)  │
└──────────────────────────────────────────────────────────────┘
                         ↓
                  npm install @tailwindcss/oxide
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. 사용자가 작성하는 JavaScript 코드                          │
│    packages/@tailwindcss-vite/src/index.ts                   │
│                                                               │
│    import { Scanner } from '@tailwindcss/oxide'  ← 일반 import! │
│                                                               │
│    let scanner = new Scanner()  ← 마치 JS 클래스처럼!        │
│    let result = scanner.scan()  ← 내부는 Rust 실행!          │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. Rust 코드 작성 (개발자가 작성)

```rust
// crates/node/src/lib.rs

#[macro_use]
extern crate napi_derive;

// ✅ JavaScript 객체로 변환될 구조체
#[derive(Debug, Clone)]
#[napi(object)]  // ← 이 매크로가 마법을 부림!
pub struct SourceEntry {
  pub base: String,
  pub pattern: String,
  pub negated: bool,
}

// ✅ JavaScript 클래스로 노출될 Rust 구조체
#[derive(Debug, Clone)]
#[napi]  // ← 이 매크로가 JavaScript 클래스로 만들어줌!
pub struct Scanner {
  scanner: tailwindcss_oxide::Scanner,
}

// ✅ JavaScript에서 사용할 메서드들
#[napi]
impl Scanner {
  // JavaScript: new Scanner({ sources: [...] })
  #[napi(constructor)]
  pub fn new(opts: ScannerOptions) -> Self {
    Self {
      scanner: tailwindcss_oxide::Scanner::new(...)
    }
  }

  // JavaScript: scanner.scan()
  #[napi]
  pub fn scan(&mut self) -> Vec<String> {
    self.scanner.scan()
  }

  // JavaScript: scanner.scanFiles([...])
  #[napi]
  pub fn scan_files(&mut self, input: Vec<ChangedContent>) -> Vec<String> {
    self.scanner.scan_content(...)
  }
}
```

**핵심:**
- `#[napi]` 매크로만 붙이면 끝!
- Rust 함수 → JavaScript 함수 자동 변환
- Rust 타입 → JavaScript 타입 자동 매핑

---

## 2. 빌드 프로세스 (napi-rs CLI가 자동 처리)

### 2.1 빌드 명령어

```bash
cd crates/node
pnpm run build
```

실제 실행:
```json
// crates/node/package.json
{
  "scripts": {
    "build:platform": "napi build --platform --release"
  }
}
```

### 2.2 napi-rs CLI가 생성하는 파일들

#### (1) `tailwindcss-oxide.darwin-arm64.node`
- **Rust 코드를 컴파일한 네이티브 바이너리**
- macOS ARM64용 `.node` 파일
- Node.js가 직접 로드할 수 있는 형식

**내부 구조:**
```
tailwindcss-oxide.darwin-arm64.node
  ↓
ELF/Mach-O 바이너리 (기계어)
  ↓
N-API 호환 C ABI
  ↓
Node.js가 dlopen()으로 로드
```

#### (2) `index.js` (자동 생성!)
- **JavaScript 래퍼 파일**
- 플랫폼 감지 및 적절한 `.node` 파일 로드
- 사용자는 이 파일을 `import`함

**자동 생성된 index.js 예시:**
```javascript
// crates/node/index.js (빌드 후 자동 생성됨)

const { platform, arch } = require('os')

let nativeBinding = null
let localFileExisted = false
let loadError = null

// 1. 현재 플랫폼 감지
function getPlatform() {
  if (platform() === 'darwin' && arch() === 'arm64') {
    return '@tailwindcss/oxide-darwin-arm64'
  } else if (platform() === 'linux' && arch() === 'x64') {
    return '@tailwindcss/oxide-linux-x64-gnu'
  } else if (platform() === 'win32' && arch() === 'x64') {
    return '@tailwindcss/oxide-win32-x64-msvc'
  }
  // ... 기타 플랫폼
}

// 2. 해당 플랫폼의 .node 파일 로드
function loadBinding() {
  let platformPackage = getPlatform()

  try {
    // node_modules/@tailwindcss/oxide-darwin-arm64/tailwindcss-oxide.darwin-arm64.node
    return require(platformPackage)
  } catch (e) {
    loadError = e
  }

  // Fallback: WASM
  try {
    return require('@tailwindcss/oxide-wasm32-wasi')
  } catch (e) {
    throw new Error('Failed to load native binding')
  }
}

// 3. 바인딩 로드
nativeBinding = loadBinding()

// 4. JavaScript에 노출 (사용자가 import하는 것들)
module.exports.Scanner = nativeBinding.Scanner
module.exports.ChangedContent = nativeBinding.ChangedContent
module.exports.SourceEntry = nativeBinding.SourceEntry
```

**핵심:**
- 이 파일은 **개발자가 작성하지 않음!**
- `napi build` 명령어가 **자동으로 생성**
- Rust 코드의 `#[napi]` 매크로를 분석해서 자동 생성

#### (3) `index.d.ts` (자동 생성!)
- **TypeScript 타입 정의**
- Rust 타입을 TypeScript 타입으로 변환

**자동 생성된 index.d.ts 예시:**
```typescript
// crates/node/index.d.ts (빌드 후 자동 생성됨)

/** Rust: #[napi(object)] pub struct SourceEntry */
export interface SourceEntry {
  base: string
  pattern: string
  negated: boolean
}

/** Rust: #[napi(object)] pub struct ChangedContent */
export interface ChangedContent {
  file?: string
  content?: string
  extension: string
}

/** Rust: #[napi] pub struct Scanner */
export class Scanner {
  /** Rust: #[napi(constructor)] */
  constructor(opts: ScannerOptions)

  /** Rust: #[napi] pub fn scan() -> Vec<String> */
  scan(): Array<string>

  /** Rust: #[napi] pub fn scan_files() -> Vec<String> */
  scanFiles(input: Array<ChangedContent>): Array<string>
}
```

**Rust → TypeScript 타입 매핑:**
```rust
Vec<String>        → Array<string>
Option<String>     → string | undefined
i64                → number
bool               → boolean
struct             → interface
impl               → class
```

### 2.3 .gitignore에 생성 파일 등록

```gitignore
# crates/node/.gitignore

# Generated by napi-rs
*.node            # 네이티브 바이너리
index.js          # JavaScript 래퍼
index.d.ts        # TypeScript 타입
browser.js        # 브라우저용 (필요시)
*.wasm            # WebAssembly (필요시)
```

**이유:**
- 이 파일들은 **소스코드가 아님**
- 빌드할 때마다 **자동 생성됨**
- Git에 커밋하지 않음

---

## 3. Node.js의 역할 (런타임)

### Node.js가 .node 파일을 로드하는 방법

```javascript
// 사용자 코드
import { Scanner } from '@tailwindcss/oxide'
```

**내부 동작:**

```
1. Node.js가 '@tailwindcss/oxide' 해석
   ↓
2. node_modules/@tailwindcss/oxide/index.js 실행
   ↓
3. index.js가 플랫폼 감지 (macOS ARM64)
   ↓
4. require('@tailwindcss/oxide-darwin-arm64') 호출
   ↓
5. Node.js가 .node 확장자 인식
   ↓
6. process.dlopen() 호출 (C 레벨)
   ↓
7. tailwindcss-oxide.darwin-arm64.node 로드
   ↓
8. N-API 초기화 함수 호출
   ↓
9. Rust 함수들이 JavaScript 객체로 등록됨
   ↓
10. JavaScript에서 사용 가능!
```

**Node.js 내부 (C++):**
```cpp
// Node.js 소스코드 (대략적인 개념)

// .node 파일 로드
void* handle = dlopen("tailwindcss-oxide.darwin-arm64.node", RTLD_LAZY);

// N-API 초기화 함수 호출
napi_module* mod = (napi_module*)dlsym(handle, "napi_register_module_v1");

// JavaScript 객체로 등록
napi_value exports;
mod->nm_register_func(env, exports);

// 이제 JavaScript에서 사용 가능
```

---

## 4. 사용자 관점 (JavaScript)

### 사용자는 그냥 일반 JavaScript처럼 사용

```typescript
// packages/@tailwindcss-vite/src/index.ts

// 1. 일반 import (내부가 Rust인지 모름!)
import { Scanner } from '@tailwindcss/oxide'

// 2. 일반 클래스처럼 생성
let scanner = new Scanner({
  sources: [
    { base: '/project', pattern: '**/*', negated: false }
  ]
})

// 3. 일반 메서드처럼 호출
let candidates = scanner.scan()
// → 실제로는 Rust 코드 실행!
// → ["flex", "bg-blue-500", "px-4", ...]

// 4. TypeScript 타입 체크도 작동!
scanner.scanFiles([
  { file: 'App.tsx', content: '...', extension: 'tsx' }
])
```

**사용자 입장:**
- Rust인지 JavaScript인지 **구분 불가능**
- 그냥 일반 NPM 패키지처럼 사용
- TypeScript 자동완성도 완벽하게 작동

---

## 5. 핵심 구성 요소별 역할

### 5.1 N-API (Node.js 기본 기능)

**제공하는 것:**
```c
// Node.js의 N-API 함수들 (C)
napi_create_object()
napi_create_function()
napi_define_class()
napi_set_property()
napi_get_value_string_utf8()
// ...
```

**역할:**
- C/C++/Rust가 JavaScript 값을 조작할 수 있게 해줌
- Node.js 버전에 관계없이 안정적인 ABI 제공

### 5.2 napi-rs (Rust 라이브러리)

**제공하는 것:**
```rust
// Rust에서 사용
#[napi]                    // 매크로
#[napi(object)]            // 매크로
#[napi(constructor)]       // 매크로

napi::bindgen_prelude::*   // 타입 변환 유틸
```

**역할:**
- Rust 코드를 N-API 호출로 변환
- `#[napi]` 매크로가 컴파일 타임에 코드 생성
- Rust 타입 ↔ JavaScript 타입 자동 변환

**매크로 확장 예시:**
```rust
// 개발자가 작성
#[napi]
pub fn scan(&mut self) -> Vec<String> {
    self.scanner.scan()
}

// 매크로가 확장 (대략적인 개념)
extern "C" fn __napi_scan(
    env: napi_env,
    cb_info: napi_callback_info
) -> napi_value {
    // 1. JavaScript this 가져오기
    let this = napi_get_cb_info(env, cb_info);

    // 2. Rust Scanner 객체 추출
    let scanner = napi_unwrap::<Scanner>(env, this);

    // 3. Rust 함수 호출
    let result: Vec<String> = scanner.scan();

    // 4. Vec<String> → JavaScript Array 변환
    let js_array = napi_create_array(env);
    for (i, s) in result.iter().enumerate() {
        let js_string = napi_create_string_utf8(env, s);
        napi_set_element(env, js_array, i, js_string);
    }

    // 5. JavaScript로 반환
    js_array
}
```

### 5.3 @napi-rs/cli (빌드 도구)

**제공하는 것:**
```bash
napi build         # Rust → .node 컴파일
napi build --wasm  # Rust → WASM 컴파일
```

**역할:**
- Cargo로 Rust 컴파일
- `index.js`, `index.d.ts` 자동 생성
- 플랫폼별 바이너리 패키징

**생성 로직:**
```javascript
// @napi-rs/cli 내부 (대략적인 개념)

// 1. Rust 소스 분석
const rustAst = parseRustFile('src/lib.rs')

// 2. #[napi] 매크로 찾기
const napiItems = rustAst.items.filter(item =>
  item.attrs.some(attr => attr.path === 'napi')
)

// 3. index.js 생성
generateIndexJs(napiItems)

// 4. index.d.ts 생성
generateTypeDefinitions(napiItems)
```

---

## 6. 전체 흐름 요약

### 개발 시간 (Development Time)

```
개발자
  ↓ 작성
Rust 코드 (#[napi] 매크로 사용)
  ↓ napi build
@napi-rs/cli
  ↓ 컴파일 + 자동 생성
.node 바이너리 + index.js + index.d.ts
  ↓ npm publish
NPM 레지스트리
```

### 런타임 (Runtime)

```
사용자: import { Scanner } from '@tailwindcss/oxide'
  ↓
Node.js: require() 해석
  ↓
index.js: 플랫폼 감지 + .node 로드
  ↓
Node.js: process.dlopen()
  ↓
.node 바이너리: N-API 초기화
  ↓
Rust 함수들이 JavaScript 객체로 등록
  ↓
사용자: scanner.scan() 호출
  ↓
N-API: JavaScript → Rust 변환
  ↓
Rust 코드 실행
  ↓
N-API: Rust → JavaScript 변환
  ↓
사용자: 결과 받음
```

---

## 7. 다른 언어와의 비교

### C++ 네이티브 애드온 (전통적 방식)

```cpp
// binding.cc
#include <node.h>

void Scan(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();

  // 복잡한 V8 API 사용...
  v8::Local<v8::Array> result = v8::Array::New(isolate);
  // ...

  args.GetReturnValue().Set(result);
}

void Initialize(v8::Local<v8::Object> exports) {
  NODE_SET_METHOD(exports, "scan", Scan);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

**문제점:**
- V8 API 직접 사용 (복잡함)
- Node.js 버전 바뀌면 재컴파일 필요
- 타입 안전성 없음

### Rust + N-API (현대적 방식)

```rust
// lib.rs
#[napi]
pub fn scan() -> Vec<String> {
  vec!["flex".to_string(), "px-4".to_string()]
}
```

**장점:**
- 간결한 코드
- 타입 안전
- ABI 안정성
- 자동 타입 변환

---

## 8. 핵심 질문에 대한 답변

### Q1: N-API는 Node.js 기능인가?
**A:** 네, N-API는 Node.js가 제공하는 C API입니다.

### Q2: Rust에서 특별한 처리를 하는가?
**A:** 네! `napi-rs` 라이브러리가:
- `#[napi]` 매크로로 Rust → N-API 변환 코드 자동 생성
- 타입 변환 자동화
- `index.js`, `index.d.ts` 자동 생성

### Q3: Node.js에서 특별한 코드가 필요한가?
**A:** 아니오!
- `index.js`가 자동 생성되어 모든 것을 처리
- 사용자는 일반 `import`만 사용
- Node.js는 `.node` 확장자를 보고 자동으로 `dlopen()` 호출

### Q4: Tailwind는 어떻게 사용하는가?
**A:** 그냥 일반 JavaScript처럼:
```typescript
import { Scanner } from '@tailwindcss/oxide'  // 일반 import!
let scanner = new Scanner()                    // 일반 클래스!
let result = scanner.scan()                    // 일반 메서드!
```

---

## 9. 정리

### 역할 분담

| 구성 요소 | 역할 | 누가 작성? |
|----------|------|-----------|
| **N-API** | C ABI 제공 | Node.js 팀 |
| **napi-rs** | Rust → N-API 변환 | napi-rs 팀 |
| **#[napi] 매크로** | 컴파일 타임 코드 생성 | napi-rs 팀 |
| **@napi-rs/cli** | 빌드 + 파일 생성 | napi-rs 팀 |
| **Rust 코드** | 비즈니스 로직 | **Tailwind 개발자** |
| **index.js** | 플랫폼별 로딩 | **자동 생성** |
| **index.d.ts** | TypeScript 타입 | **자동 생성** |
| **.node 바이너리** | 컴파일된 코드 | **자동 생성** |
| **JavaScript 사용** | 일반 import | **사용자** |

### 핵심 포인트

1. **개발자는 Rust만 작성** - `#[napi]` 매크로만 붙임
2. **빌드 시 모든 것이 자동 생성** - `index.js`, `index.d.ts`, `.node`
3. **사용자는 일반 JavaScript처럼 사용** - 내부가 Rust인지 모름
4. **Node.js는 자동으로 처리** - `.node` 확장자 인식 후 `dlopen()`

### 마법 같지만 실제로는

```
Rust #[napi] 매크로
  ↓ (컴파일 타임)
N-API C 코드 생성
  ↓ (컴파일)
.node 바이너리
  ↓ (런타임)
Node.js dlopen()
  ↓
JavaScript에서 사용!
```

**결론:** 모든 복잡함은 `napi-rs`가 처리하고, 개발자와 사용자는 간단한 인터페이스만 사용합니다!
