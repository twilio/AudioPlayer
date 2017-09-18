export default class Deferred<T> {
    readonly promise: Promise<T>;
    private _reject;
    readonly reject: (e?: any) => void;
    private _resolve;
    readonly resolve: (t?: T) => void;
    constructor();
}
