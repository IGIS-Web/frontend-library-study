# React flushSync 완벽 가이드

## flushSync란?

`flushSync`는 React 18에서 도입된 API로, 상태 업데이트를 동기적으로 처리하여 즉시 DOM에 반영되도록 강제하는 함수입니다. 일반적으로 React의 상태 업데이트는 비동기적으로 처리되어, 상태 변경 직후 DOM이 최신 상태가 아닐 수 있습니다. flushSync를 사용하면 상태 변경과 DOM 업데이트가 즉시 일어나므로, 이후 로직에서 최신 DOM을 바로 사용할 수 있습니다.

## 왜 flushSync가 필요한가?

-   **상태 변경 후 바로 DOM을 조작해야 할 때**
-   **비동기 상태 업데이트로 인해 DOM이 최신 상태가 아닐 때**
-   **useEffect를 사용하지 않고 한 함수 내에서 상태 변경과 DOM 조작을 모두 처리하고 싶을 때**

## 실전 예제: TodoList에서 스크롤 제어

아래 예시는 할 일(Todo)을 추가할 때, 새로운 아이템이 추가된 후 바로 스크롤을 내리는 코드입니다.

```javascript
import {useState, useRef} from "react";
import {flushSync} from "react-dom";

export default function TodoList() {
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const [text, setText] = useState("");
    const [todos, setTodos] = useState([]);

    function handleAdd() {
        const newTodo = {id: todos.length, text: text};
        inputRef.current.focus();

        flushSync(() => {
            setText("");
            setTodos([...todos, newTodo]);
        });

        listRef.current.lastChild?.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    // ...생략...
}
```

### 코드 설명

-   flushSync 내부에서 setText, setTodos를 실행하면, 해당 상태 변경이 즉시 DOM에 반영됩니다.
-   그 다음에 바로 scrollIntoView를 실행하면, 새로 추가된 todo가 DOM에 존재하므로 원하는 스크롤 동작이 보장됩니다.

## flushSync vs useEffect

| flushSync                                             | useEffect                                |
| ----------------------------------------------------- | ---------------------------------------- |
| 한 함수 내에서 상태 변경과 DOM 조작을 순차적으로 처리 | 상태 변경을 감지하여 후처리를 할 수 있음 |
| 코드가 간결해짐                                       | 여러 상태 변경에 대응 가능               |
| 단순한 UI 상호작용에 적합                             | 연계되는 동작이나 복잡한 로직에 적합     |

-   flushSync는 "상태 변경 직후 바로 DOM을 조작"해야 하는 단순한 상황에 적합합니다.
-   useEffect는 여러 상태 변경에 대응하거나, 연계되는 동작이 필요한 복잡한 상황에 더 적합합니다.

## flushSync의 주의점

-   모든 상태 업데이트를 동기적으로 처리하므로, 남용 시 성능에 영향을 줄 수 있습니다.
-   복잡한 로직이나 여러 컴포넌트가 연계되는 경우에는 useEffect 사용을 고려하는 것이 좋습니다.
-   flushSync는 React 18 이상에서만 사용할 수 있습니다.

## 결론

단순한 UI 상호작용에서 상태 변경 직후 DOM을 조작해야 한다면 flushSync를 사용하는 것이 코드상 더 깔끔할 수 있습니다. 하지만, 연계되는 동작이나 복잡한 후처리가 필요한 경우에는 useEffect가 더 적합합니다.

## 참고 자료

-   [React 공식 문서: flushSync](https://react.dev/reference/react-dom/flushSync)
-   [React 18 업데이트 가이드](https://react.dev/blog/2022/03/29/react-v18)
