import fs from "fs/promises"; // 파일 읽기/쓰기용
import fg from "fast-glob";   // 파일 경로 패턴 매칭
import {generateRuleFor} from "./rules.js";

/**
 * class/className 토큰 추출 (간단 정규식)
 */
export function extractClassesFromContent(content) {
    const results = [];
    // match class="..." or class='...' or className="..." (simple)
    const regex = /(class(Name)?|className)=["'`]{1}([^"'`]+?)["'`]{1}/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
        const str = m[3];
        if (!str) continue;
        const tokens = str.split(/\s+/).filter(Boolean);
        results.push(...tokens);
    }
    return results;
}

/**
 * 토큰을 variant(hover/sm) 분리하고 CSS rule 생성
 * 지원하는 variant: hover:, sm:
 */
function parseTokenToRules(token) {
    // ":" 기준으로 분리 → variant:base 구조로 나눔
    // 예: "hover:bg-red-500" → ["hover", "bg-red-500"]
    const parts = token.split(":");

    // variants = 접두사 부분들 (hover, sm 등)
    // base = 실제 속성 부분 (bg-red-500, p-4 등)
    let variants = parts.slice(0, -1);
    const base = parts[parts.length - 1];

    // base 부분에 해당하는 실제 CSS 속성값 가져오기
    // generateRuleFor("p-4") → "padding: 1rem;"
    const baseRule = generateRuleFor(base);
    if (!baseRule) return null; // 알 수 없는 토큰이면 무시

    //------------------------------------------------------
    // [CSS 선택자(selector) 생성]
    //------------------------------------------------------
    // 기본적으로 클래스 이름을 그대로 사용하지만,
    // ":"나 특수문자는 CSS 셀렉터에서 escape 해야 함.
    let selector = `.${escapeClassName(token.replace(/:/g, "\\:"))}`;

    // hover/sm variant 처리를 위해 플래그 지정
    const isHover = variants.includes("hover");
    const isSm = variants.includes("sm");

    // hover 변형이 있다면 :hover 가상 선택자 추가
    if (isHover) {
        selector = `.${escapeClassName(parts.join("\\:"))}:hover`;
    } else {
        selector = `.${escapeClassName(parts.join("\\:"))}`;
    }

    //------------------------------------------------------
    // [CSS 문자열 생성]
    //------------------------------------------------------
    const ruleBody = baseRule; // "padding:1rem;" 같은 내용

    // sm 변형이 있다면 @media 쿼리로 감싸기
    if (isSm) {
        // sm은 Tailwind 기준 min-width: 640px
        const inner = `${selector} { ${ruleBody} }`;
        return {
            css: `@media (min-width: 640px) { ${inner} }`,
            key: token
        };
    } else {
        // 일반 규칙
        return {
            css: `${selector} { ${ruleBody} }`,
            key: token
        };
    }
}


function escapeClassName(name) {
    // minimal escaping for ":" and "/" and "[" and "]"
    return name.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
}

/**
 * build CSS from class tokens
 */
export function buildCSSFromTokens(tokens) {
    const unique = Array.from(new Set(tokens));
    const rules = unique.map(t => parseTokenToRules(t)).filter(Boolean);
    return rules.map(r => r.css).join("\n");
}

/**
 * Read files by glob patterns and extract classes
 */
export async function collectClassesFromGlobs(globs) {
    const files = await fg(globs, { dot: true });
    let all = [];
    await Promise.all(files.map(async file => {
        try {
            const content = await fs.readFile(file, "utf-8");
            all.push(...extractClassesFromContent(content));
        } catch (e) {
            // ignore read errors
        }
    }));
    return all;
}
