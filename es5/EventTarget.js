"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");

var EventTarget = function () {
    function EventTarget() {
        _classCallCheck(this, EventTarget);

        this._eventEmitter = new events_1.EventEmitter();
    }

    _createClass(EventTarget, [{
        key: "addEventListener",
        value: function addEventListener(name, handler) {
            return this._eventEmitter.addListener(name, handler);
        }
    }, {
        key: "dispatchEvent",
        value: function dispatchEvent(name) {
            var _eventEmitter;

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return (_eventEmitter = this._eventEmitter).emit.apply(_eventEmitter, [name].concat(args));
        }
    }, {
        key: "removeEventListener",
        value: function removeEventListener(name, handler) {
            return this._eventEmitter.removeListener(name, handler);
        }
    }]);

    return EventTarget;
}();

exports.default = EventTarget;
//# sourceMappingURL=EventTarget.js.map