type ExtractReturn<T> =
    T extends (...args: infer P) => infer R ? R : T

export function extractFunctionOrValue<T extends any>(
    fn: T,
    ...args: any[]
): ExtractReturn<T> {
    if (fn instanceof Function) return fn(...args);
    return fn;
}

/**
 * 安全运行某个函数
 * @template T
 * @param fn{T} 需要执行的函数
 * @param safeValue{ReturnType<T>} 执行失败返回的值
 * */
export function safeRun<T extends (...args: any[]) => any>(fn: T, safeValue: ReturnType<T>) {
    try {
        return fn();
    } catch(e) {
        console.log(e)

        return safeValue;
    }
}
