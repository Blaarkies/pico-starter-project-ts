interface PromisePackage<T> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

export function promiseWithResolvers<T = void>(): PromisePackage<T> {
    let promisePackage = {} as PromisePackage<T>;

    promisePackage.promise = new Promise<T>((resolve, reject) => {
        promisePackage.resolve = resolve;
        promisePackage.reject = reject;
    });

    return promisePackage;
}


type ResultFn<R = void> = (err: any, arg?: R) => void;

export function promisify<R = void, T extends [] = []>(
    originalFn: (...args: [...T, ResultFn<R>]) => void,
): (...args: T) => Promise<R> {
    return (...args: T) => {
        let {promise, resolve, reject} = promiseWithResolvers<R>();

        originalFn(...args, (err, result) => err
                                             ? reject(err)
                                             : resolve(result));

        return promise;
    };
}

type Pop<T extends any[]> = T extends [...infer U, any] ? U : never
type GenericCallback = (...args: any[]) => any;
type RemoveLastParameter<T extends GenericCallback>
    = (...args: Pop<Parameters<T>>) => Promise<ReturnType<T>>
export type Promisified<T extends GenericCallback>
    = RemoveLastParameter<T>;


interface TimeoutExceptionPackage {
    promise: Promise<void>;
    abort: () => void;
}

/**
 * Returns a package of
 * - timeout promise that rejects after the specified duration
 * - abort function to stop the timer
 * @param durationMs Duration in milliseconds
 * @param errorMessage String to use in error
 */
export function timeoutException(
    durationMs: number,
    errorMessage = 'Timeout exception',
): TimeoutExceptionPackage {
    let {promise, reject} = promiseWithResolvers();
    let id = setTimeout(() => reject(new Error(errorMessage)), durationMs);

    return {promise, abort: () => clearTimeout(id)};
}

export function promiseTry<T extends GenericCallback>(callback: T)
    : Promise<ReturnType<T>> {
    let promisePack = promiseWithResolvers<ReturnType<T>>();

    try {
        let result = callback();
        promisePack.resolve(result);
    } catch (err) {
        promisePack.reject(err);
    } finally {
        return promisePack.promise;
    }
}