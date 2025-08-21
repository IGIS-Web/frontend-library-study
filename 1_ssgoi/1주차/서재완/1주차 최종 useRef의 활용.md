# React 19 Ref Callback과 SSGOI에서 배운 패턴 활용법

React 19의 새로운 기능과 SSGOI 라이브러리를 분석하면서 얻은 인사이트를 바탕으로, 실제 프로젝트에서 어떻게 이러한 패턴들을 활용할 수 있는지 정리한 문서입니다.

---

## 🎯 SSGOI에서 발견한 Ref Callback의 진짜 활용법

### 🔍 기존 인식 vs 실제 활용

#### **기존 인식: Ref는 DOM 접근용**

```tsx
// 일반적인 ref 사용법
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus(); // DOM 조작
    }
}, []);

return <input ref={inputRef} />;
```

#### **SSGOI의 혁신: Ref를 이벤트 리스너로 활용**

```tsx
// packages/react/src/lib/ssgoi-transition.tsx
export const SsgoiTransition = ({children, id}: {children: ReactNode; id: string}) => {
    const getTransition = useSsgoi();

    return (
        <div ref={transition(getTransition(id))} data-ssgoi-transition={id}>
            {children}
        </div>
    );
};
```

**핵심 인사이트**: Ref callback을 **DOM 마운트/언마운트 이벤트 감지기**로 사용!

### 🔄 SSGOI의 Ref Callback 동작 원리

```typescript
// createTransitionCallback에서 반환되는 함수
return (element: HTMLElement | null) => {
    if (!element) return; // ← 언마운트 시 (element = null)

    // 마운트 시: DOM 정보 저장 + IN 애니메이션 시작
    parentRef = element.parentElement;
    nextSiblingRef = element.nextElementSibling;
    runEntrance(element);

    // cleanup 함수 반환 (React 19의 새로운 기능)
    return () => {
        const cloned = element.cloneNode(true) as HTMLElement;
        runExitTransition(cloned); // ← OUT 애니메이션 시작
    };
};
```

**핵심**: 라우팅 변경 시 **cleanup이 먼저 실행**되어 DOM을 저장하고, **IN 이벤트에서 저장된 DOM을 활용**

---

## 🚀 실제 프로젝트 적용: useInfinite Hook 개선

### ❌ 기존 방식: 상태 의존적 구현

```tsx
// 기존: toggle 상태에 의존하는 방식
const useInfiniteOld = props => {
    const [isVisible, setIsVisible] = useState(false); // 추가 상태 필요!

    useEffect(() => {
        if (!isVisible) return; // 상태 확인 필요

        // IntersectionObserver 설정
        const observer = new IntersectionObserver(/* ... */);

        return () => {
            observer.disconnect(); // manual cleanup
        };
    }, [isVisible]); // 상태 의존성

    // 컴포넌트에서 상태 관리 필요
    return {setIsVisible /* ... */};
};

// 사용 시
const Component = () => {
    const [isToggled, setIsToggled] = useState(false);
    const {setIsVisible} = useInfiniteOld(props);

    useEffect(() => {
        setIsVisible(isToggled); // 수동 상태 동기화
    }, [isToggled]);

    return (
        <>
            <button onClick={() => setIsToggled(!isToggled)}>Toggle</button>
            {isToggled && (
                <div>
                    {/* list items */}
                    <div /> {/* bottom element */}
                </div>
            )}
        </>
    );
};
```

**문제점**:

-   `isToggled` → `setIsVisible` 수동 동기화
-   Hook과 컴포넌트 간 강한 결합
-   재사용성 저하

### ✅ 개선된 방식: Ref Callback 이벤트 활용

```tsx
const useInfinite = <T extends HTMLElement>(props: UseInfiniteProps) => {
    const {api, keyword = "", pageSize = 15, enabled, callback, reset} = props;
    const [isLoading, setIsLoading] = useState(false);
    const pageRef = useRef<number>(1);
    const totalPageRef = useRef<number>(1);
    const prevDataRef = useRef<any[]>([]);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const loadMore = useCallback(async () => {
        const isDefault = keyword === "";
        const currentPage = isDefault ? pageRef.current : 1;
        const currentTotalPage = isDefault ? totalPageRef.current : 1;
        const hasNextPage = currentPage <= currentTotalPage;

        if (isLoading || !hasNextPage) return;

        setIsLoading(true);

        try {
            const pageParams = new URLSearchParams({
                currentPage: String(currentPage),
                pageSize: String(pageSize)
            });
            const result = await axios.get(`${api}&${pageParams}`);
            callback(result.data.itemList);
            if (isDefault) {
                totalPageRef.current = result.data.totalPage;
                prevDataRef.current = [...(prevDataRef.current || []), ...result.data.itemList];
                pageRef.current = currentPage + 1;
            }
        } catch (error) {
            console.error("Error loading more data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [api, keyword, pageSize, callback]);

    // 🎯 핵심: Ref Callback을 마운트/언마운트 이벤트로 활용
    const bottomRef = useCallback(
        (node: T | null) => {
            if (!enabled) return;

            // 🧹 자동 Cleanup: 이전 observer 해제
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            // 🎬 자동 Setup: 새 element가 마운트되면 observer 연결
            if (node) {
                observerRef.current = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            loadMore();
                        }
                    },
                    {threshold: 1.0}
                );
                observerRef.current.observe(node);
            }
        },
        [enabled, loadMore]
    );

    return {isLoading, bottomRef};
};
```

### 🎉 결과: 완전히 자율적인 Hook

```tsx
const ScheduleSelect = (props: ScheduleSelectProps) => {
    const {value, onSelect} = props;
    const currentGroup = useSelector((state: RootState) => state.group);
    const [memberList, setScheduleList] = useState<ScheduleList[]>([]);
    const {keyword, tempKeyword, setTempKeyword} = useSelectInput();

    const defaultQuery = new URLSearchParams({
        keyword,
        types: "2,1,0",
        state: "3,2,1,0"
    });

    const {bottomRef} = useInfinite<HTMLDivElement>({
        api: GET_PLAN_SCHEDULE_LIST_API(currentGroup.rowid, defaultQuery.toString()),
        enabled: !!currentGroup.rowid,
        keyword: keyword,
        callback: useCallback(list => {
            const scheduleOptions = list.map(schedule => ({
                label: schedule.name,
                value: schedule.rowid
            }));
            setScheduleList(prev => [...prev, ...scheduleOptions]);
        }, []),
        reset: useCallback(list => {
            const scheduleOptions = list.map(schedule => ({
                label: schedule.name,
                value: schedule.rowid
            }));
            setScheduleList(scheduleOptions);
        }, [])
    });

    return (
        <SelectBox value={value} label={"스케줄 이름"} searchable searchValue={tempKeyword} onSearch={setTempKeyword} onSelect={onSelect}>
            {memberList.map(({value, label}) => (
                <Option key={value} value={value}>
                    {label}
                </Option>
            ))}
            {/* 🎯 단순히 ref만 연결, 나머지는 Hook이 알아서 처리 */}
            <div ref={bottomRef} />
        </SelectBox>
    );
};
```

**혁신 포인트**:

-   ✅ **상태 의존성 제거**: `toggle` 상태 불필요
-   ✅ **자동 생명주기 관리**: 마운트 시 연결, 언마운트 시 해제
-   ✅ **완벽한 재사용성**: 어떤 컴포넌트에서든 `<div ref={bottomRef} />`만 추가
-   ✅ **사이드 이펙트 제거**: Hook과 컴포넌트 간 느슨한 결합

### 🔑 핵심 동작 원리

```tsx
// SelectBox 토글이 일어날 때
{
    isToggled && (
        <div>
            {/* list items */}
            <div ref={bottomRef} /> {/* ← 여기가 핵심! */}
        </div>
    );
}

// 토글 시 자동으로 발생하는 이벤트:
// 1. 토글 OFF: bottomRef(null) 호출 → observer.disconnect()
// 2. 토글 ON: bottomRef(actualElement) 호출 → observer.observe(actualElement)
```

**기존에는**: `toggle` 상태를 `useInfinite`에 전파 → 로직에 사이드 이펙트 발생  
**개선 후**: DOM 마운트/언마운트를 직접 감지 → 순수한 Hook 구현

---
