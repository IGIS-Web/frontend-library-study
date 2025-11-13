## 🧩 extractConfigs함수 자세히 보기

이 `resolveConfig()` 함수는 **Tailwind 설정 파일 여러 개를 합쳐서 하나의 최종 설정 객체를 만드는 과정**.

```ts
for (let file of files) {
  extractConfigs(ctx, file);
}
```

`files`에는 여러 Tailwind 설정 파일(`ConfigFile`)이 들어있고,
각 파일을 하나씩 꺼내서 `extractConfigs()`로 처리합니다.

---

## 🧱 1단계: `extractConfigs()` 호출 흐름

이 함수는 Tailwind 설정을 쭉 따라가며 아래 네 가지 일을 순서대로 진행합니다.

| 단계 | 역할               | 설명                                            |
|----|------------------|-----------------------------------------------|
| 1  | **플러그인 정규화**     | 플러그인을 모두 같은 형태(`PluginWithConfig`)로 맞춤        |
| 2  | **preset 재귀 탐색** | 설정 안에 `presets`가 있으면 다시 `extractConfigs()` 호출 |
| 3  | **plugin 재귀 탐색** | 앞서 정규화한 plugins 를 순회 하면서 `extractConfigs()` 호출                     |
| 4  | **content 병합**   | 설정에서 `content` 배열(스캔할 파일 경로들)을 꺼내 누적          |
| 5  | **config 저장**    | 실제 설정 객체를 `ctx.configs` 리스트에 추가               |

즉,
**한 설정 파일 → preset들 → plugin들의 config → content 경로 → ctx.configs에 저장**
이 순서로 쭉 모아두는 것.

---

## 🔍 2단계: 코드로 따라가기

```ts
function extractConfigs(ctx, { config, base, path, reference, src }) {
  let plugins = [];

  // 플러그인 정규화
  for (let plugin of config.plugins ?? []) {
    if ("__isOptionsFunction" in plugin) {
      plugins.push({ ...plugin(), reference, src });
    } else if ("handler" in plugin) {
      plugins.push({ ...plugin, reference, src });
    } else {
      plugins.push({ handler: plugin, reference, src });
    }
  }

  // presets 재귀 탐색
  for (let preset of config.presets ?? []) {
    extractConfigs(ctx, { path, base, config: preset, reference, src });
  }

  // plugins 안의 config 재귀 탐색
  for (let plugin of plugins) {
    ctx.plugins.push(plugin);

    if (plugin.config) {
      extractConfigs(ctx, {
        path,
        base,
        config: plugin.config,
        reference: !!plugin.reference,
        src: plugin.src ?? src,
      });
    }
  }

  // content 경로 통합
  let content = config.content ?? [];
  let files = Array.isArray(content) ? content : content.files;

  for (let file of files) {
    ctx.content.files.push(
      typeof file === "object" ? file : { base, pattern: file }
    );
  }

  // config 자체 저장
  ctx.configs.push(config);
}
```

##  ✍️ `extractConfigs` 함수 흐름(재귀 포함) 상세 설명
 
`resolveConfig` 는 여러 개의 설정 파일(`ConfigFile`)을 순서대로 돌며 `extractConfigs` 를 호출합니다. `extractConfigs` 는 (1) preset 들, (2) plugin 들이 내장한 config, (3) 현재 사용자 config 자체를 순차적으로 펼쳐서 하나의 누적 컨텍스트(`ResolutionContext`)에 기록합니다. 이후 최종 병합은 다른 단계(`mergeTheme`, 상위 옵션 병합 루프)에서 수행되며, 여기서 중요한 것은 "누가 먼저 push 되는가" 와 "override 우선순위" 입니다.

컨텍스트 구조 핵심
- `ctx.configs`: 최종 병합 대상이 되는 모든 UserConfig 들이 순서대로 축적. 뒤에 push 된 항목이 나중 병합되므로 우선권(덮어쓰기)을 가짐.
- `ctx.plugins`: 정규화된 plugin 목록.
- `ctx.content.files`: content 경로 패턴 목록(모든 config 에서 누적).
- `ctx.theme` / `ctx.extend`: 실제 테마 병합은 나중(`mergeTheme`)에 처리. 여기서는 테마 관련 직접 처리 없음.

처리 순서
1. Plugin 정규화

2. Preset 검증

3. Preset 재귀 호출
  - `config.presets` 순회하며 각 preset 을 동일한 방식으로 `extractConfigs` 재귀 처리.
  - 이 시점에서 "preset 들의 config" 가 `ctx.configs` 에 먼저 push 됨 → 후속(현재) config 가 덮어쓰기를 가질 수 있는 순서 확보.

4. Plugin 재귀 처리
  - 앞서 정규화한 `plugins` 를 순회:  
    a. `ctx.plugins.push(plugin)` 로 목록 축적.  
    b. `plugin.config` 존재 시 재귀 호출(플러그인이 제공하는 추가 설정).  
    이로 인해 "플러그인 내장 config" 또한 현재 사용자 config 보다 먼저 `ctx.configs` 에 들어감.

5. Content 병합
  - 각 항목을 `ctx.content.files` 에 push.  
    문자열 → `{ base, pattern: string }` 로 정규화.  
    객체 → 그대로(사용자가 이미 상세 지정 가능).
  - Content 는 override 개념 없이 누적만 됨.

6. 현재 사용자 config 등록
  - 마지막에 `ctx.configs.push(config)` 실행.
  - 따라서 "현재 config" 가 presets, plugin.config 들보다 뒤에 위치 → 덮어쓰기 우선권 가짐.
  - 여러 파일(`files` 매개)에서 호출된다면 파일 처리 순서대로 `ctx.configs` 뒤에 이어 붙음. 최후에 등장한 파일이 동일 키를 덮어씀.

### 재귀 전체 그림 (우선순위 관점)

Preset configs → Plugin-provided configs → Current config  
(→ 다음 파일의 동일 순서 반복)  
최종 병합 시 루프는 `ctx.configs` 삽입 순서를 따라가며 단순 대입(shallow assign) 형태를 취하므로 "나중" 이 항상 승리.

요약  
`extractConfigs` 는 설정 트리(presets + plugins + 사용자)를 깊이 우선으로 펼쳐 순서를 확정하고, 병합 로직을 단순하게 만들기 위해 모든 요소를 표준화·누적하는 "수집기" 역할을 한다. Preset 과 plugin 내장 config 를 먼저 처리한 뒤 사용자 config 를 push 함으로써 기대된 override 규칙을 보장한다.

---

## 🧭 3단계: `ctx`가 뭐하는 친구인가?

`ctx`는 "ResolutionContext"로, 모든 설정 정보를 모으는 임시 저장소.

```ts
interface ResolutionContext {
  design: DesignSystem;
  configs: UserConfig[]; // 👉 지금까지 모은 모든 config
  plugins: PluginWithConfig[];
  content: { files: [] }; // 👉 content 경로 모음
  theme: Record<string, ThemeValue>;
  extend: Record<string, ThemeValue[]>;
  result: ResolvedConfig; // 👉 최종 결과를 담을 그릇
}
```

`extractConfigs()`가 실행될 때마다 이 `ctx`에

- `ctx.plugins.push()`
- `ctx.content.files.push()`
- `ctx.configs.push(config)`
  이런 식으로 데이터를 쌓음.

즉, `ctx`는 “모든 설정들을 누적 저장하는 곳”.

---

## 🧩 4단계: “Top-level key 병합” 단계 (resolveConfig())

이제 모든 설정이 `ctx.configs`에 모였어.
그 다음에 이런 코드가 실행됩니다. 👇

```ts
for (let config of ctx.configs) {
  if ("darkMode" in config && config.darkMode !== undefined) {
    ctx.result.darkMode = config.darkMode ?? null;
  }

  if ("prefix" in config && config.prefix !== undefined) {
    ctx.result.prefix = config.prefix ?? "";
  }

  if ("blocklist" in config && config.blocklist !== undefined) {
    ctx.result.blocklist = config.blocklist ?? [];
  }

  if ("important" in config && config.important !== undefined) {
    ctx.result.important = config.important ?? false;
  }
}
```

여기서도 여러 설정 파일 중 **마지막 설정이 우선권을 갖도록 병합**하고 있습니다.

| 속성        | 의미                       | 병합 방식            |
| ----------- | -------------------------- | -------------------- |
| `darkMode`  | 다크모드 설정              | 마지막 값으로 덮어씀 |
| `prefix`    | 클래스 이름 접두어         | 마지막 값으로 덮어씀 |
| `blocklist` | 사용 금지 클래스           | 마지막 값으로 덮어씀 |
| `important` | CSS `!important` 강제 여부 | 마지막 값으로 덮어씀 |

즉, 여러 설정이 있으면 “나중에 읽은 파일”이 이기게 됩니다. => **“최신 설정 우선”**

---

## 🔄 5단계 요약 흐름도

```
resolveConfig()
 ├─▶ for each file → extractConfigs()
 │     ├─ normalize plugins
 │     ├─ recurse into presets
 │     ├─ recurse into plugin.config
 │     ├─ merge content paths
 │     └─ push config to ctx.configs[]
 │
 ├─▶ merge top-level keys (darkMode, prefix, ...)
 ├─▶ mergeTheme() 호출
 └─▶ 최종 resolvedConfig 반환
```
