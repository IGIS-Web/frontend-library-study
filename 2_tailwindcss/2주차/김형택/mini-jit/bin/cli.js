#!/usr/bin/env node
import chokidar from "chokidar";  // 파일 변경 감시 라이브러리
import path from "path";           // 경로 다루기 (출력 파일 경로 처리용)
import fs from "fs/promises";      // 파일 시스템 (비동기 파일 읽기/쓰기용)
import config from "../mini-jit.config.js";
import {buildCSSFromTokens, collectClassesFromGlobs} from "../src/index.js";

const outFile = config.output || "dist/output.css";
const contentGlobs = config.content || ["src/**/*.{html,js,jsx,ts,tsx}"];

async function buildOnce() {
    const tokens = await collectClassesFromGlobs(contentGlobs);
    const css = buildCSSFromTokens(tokens);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, `/* mini-jit output - ${new Date().toISOString()} */\n${css}`);
    console.log(`[mini-jit] built ${outFile} (${tokens.length} tokens)`);
}

async function startWatch() {
    console.log("[mini-jit] starting watch...");
    // initial build
    await buildOnce();

    // chokidar로 지정된 경로의 파일들을 감시 시작
    const watcher = chokidar.watch(contentGlobs, {
        ignoreInitial: true, // 초기 스캔 시 이벤트 발생하지 않음
        awaitWriteFinish: {  // 파일 저장이 끝날 때까지 약간 대기 (빌드 안정성)
            stabilityThreshold: 100, // 변경 후 100ms 동안 변화 없을 때만 이벤트 발생
            pollInterval: 50
        }
    });

    // buildOnce를 너무 자주 실행하지 않도록 디바운스 처리
    const scheduleBuild = debounce(async () => {
        try {
            await buildOnce(); // 변경 감지 시 다시 CSS 빌드
        } catch (e) {
            console.error(e);
        }
    }, 120); // 120ms 지연 후 실행 (빠른 저장 연속 방지)

    // 파일 추가/변경/삭제 이벤트 등록
    watcher.on("add", scheduleBuild);
    watcher.on("change", scheduleBuild);
    watcher.on("unlink", scheduleBuild);

    // Ctrl+C 로 종료 시 watcher 닫기
    process.on("SIGINT", () => {
        watcher.close();
        process.exit();
    });
}

function debounce(fn, wait) {
    let t = null;
    return (...args) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

startWatch().catch(err => {
    console.error(err);
    process.exit(1);
});
