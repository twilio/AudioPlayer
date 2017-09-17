"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    get reject() { return this._reject; }
    get resolve() { return this._resolve; }
}
exports.default = Deferred;
//# sourceMappingURL=Deferred.js.map