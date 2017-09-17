"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class EventTarget {
    constructor() {
        this._eventEmitter = new events_1.EventEmitter();
    }
    addEventListener(name, handler) {
        return this._eventEmitter.addListener(name, handler);
    }
    dispatchEvent(name, ...args) {
        return this._eventEmitter.emit(name, ...args);
    }
    removeEventListener(name, handler) {
        return this._eventEmitter.removeListener(name, handler);
    }
}
exports.default = EventTarget;
//# sourceMappingURL=EventTarget.js.map