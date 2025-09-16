import React, {memo, useCallback, useEffect, useState} from 'react';

export const App = () => {
    const [helloCount, setHelloCount] = useState<number>(0);
    const [helloCount2, setHelloCount2] = useState<number>(0);

    const hello = () => {
        setHelloCount(helloCount + 1);
    }

    const useCallbackHello2 = useCallback(() => {
        setHelloCount2(helloCount2 + 1);
    }, [helloCount2]);

    return (
        <div className="App">
            <h3>Hello Count : {helloCount}</h3>
            <h3>Hello2 Count : {helloCount2}</h3>
            <button onClick={() => setHelloCount(helloCount + 1)}>hello 증가</button>
            <button onClick={() => setHelloCount2(helloCount2 + 1)}>hello2 증가</button>
            <Child name="1번" onHello={hello}/>
            <Child name="2번" onHello={useCallbackHello2}/>
            <MemoChild name={"메모2번"} onHello={useCallbackHello2}/>
        </div>
    );
}

interface ChildProps {
    name: string;
    onHello: () => void;
}

const Child = (props: ChildProps) => {
    const [renderingCount, setRenderingCount] = useState<number>(0);

    useEffect(() => {
        setRenderingCount(renderingCount + 1);
    }, [props.onHello]);

    return (
        <div>
            <h3>
                {props.name} Child
            </h3>
            <h3>
                렌더링 카운트 : {renderingCount}
            </h3>
            <button onClick={() => props.onHello()}>Child Hello</button>
        </div>
    )
}

const MemoChild = memo((props: ChildProps) => {
    const [renderingCount, setRenderingCount] = useState<number>(0);

    useEffect(() => {
        setRenderingCount(renderingCount + 1);
    }, [props.onHello]);

    return (
        <div>
            <h3>
                {props.name} Child
            </h3>
            <h3>
                렌더링 카운트 : {renderingCount}
            </h3>
            <button onClick={() => props.onHello()}>Child Hello</button>
        </div>
    )
})
