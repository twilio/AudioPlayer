"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var Deferred_1 = require("./Deferred");
var EventTarget_1 = require("./EventTarget");
/**
 * An {@link AudioPlayer} is an HTMLAudioElement-like object that uses AudioContext
 *   to circumvent browser limitations.
 */

var AudioPlayer = function (_EventTarget_1$defaul) {
    _inherits(AudioPlayer, _EventTarget_1$defaul);

    /**
     * @private
     */
    function AudioPlayer(audioContext) {
        var srcOrOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        _classCallCheck(this, AudioPlayer);

        /**
         * The AudioBufferSourceNode of the actively loaded sound. Null if a sound
         *   has not been loaded yet. This is re-used for each time the sound is
         *   played.
         */
        var _this = _possibleConstructorReturn(this, (AudioPlayer.__proto__ || Object.getPrototypeOf(AudioPlayer)).call(this));

        _this._audioNode = null;
        /**
         * An Array of deferred-like objects for each pending `play` Promise. When
         *   .pause() is called or .src is set, all pending play Promises are
         *   immediately rejected.
         */
        _this._pendingPlayDeferreds = [];
        /**
         * Whether or not the audio element should loop. If disabled during playback,
         *   playing continues until the sound ends and then stops looping.
         */
        _this._loop = false;
        /**
         * The source URL of the sound to play. When set, the currently playing sound will stop.
         */
        _this._src = '';
        /**
         * The current sinkId of the device audio is being played through.
         */
        _this._sinkId = 'default';
        if (typeof srcOrOptions !== 'string') {
            options = srcOrOptions;
        }
        _this._audioContext = audioContext;
        _this._audioElement = new (options.AudioFactory || Audio)();
        _this._bufferPromise = _this._createPlayDeferred().promise;
        _this._destination = _this._audioContext.destination;
        _this._gainNode = _this._audioContext.createGain();
        _this._gainNode.connect(_this._destination);
        _this._XMLHttpRequest = options.XMLHttpRequestFactory || XMLHttpRequest;
        _this.addEventListener('canplaythrough', function () {
            _this._resolvePlayDeferreds();
        });
        if (typeof srcOrOptions === 'string') {
            _this.src = srcOrOptions;
        }
        return _this;
    }

    _createClass(AudioPlayer, [{
        key: "pause",

        /**
         * Pause the audio coming from this AudioPlayer. This will reject any pending
         *   play Promises.
         */
        value: function pause() {
            if (this.paused) {
                return;
            }
            this._audioElement.pause();
            this._audioNode.stop();
            this._audioNode.disconnect(this._gainNode);
            this._audioNode = null;
            this._rejectPlayDeferreds(new Error('The play() request was interrupted by a call to pause().'));
        }
        /**
         * Play the sound. If the buffer hasn't loaded yet, wait for the buffer to load. If
         *   the source URL is not set yet, this Promise will remain pending until a source
         *   URL is set.
         */

    }, {
        key: "play",
        value: function play() {
            return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                var _this2 = this;

                var buffer;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (this.paused) {
                                    _context.next = 6;
                                    break;
                                }

                                _context.next = 3;
                                return this._bufferPromise;

                            case 3:
                                if (this.paused) {
                                    _context.next = 5;
                                    break;
                                }

                                return _context.abrupt("return");

                            case 5:
                                throw new Error('The play() request was interrupted by a call to pause().');

                            case 6:
                                this._audioNode = this._audioContext.createBufferSource();
                                this._audioNode.loop = this.loop;
                                this._audioNode.addEventListener('ended', function () {
                                    if (_this2._audioNode && _this2._audioNode.loop) {
                                        return;
                                    }
                                    _this2.dispatchEvent('ended');
                                });
                                _context.next = 11;
                                return this._bufferPromise;

                            case 11:
                                buffer = _context.sent;

                                if (!this.paused) {
                                    _context.next = 14;
                                    break;
                                }

                                throw new Error('The play() request was interrupted by a call to pause().');

                            case 14:
                                this._audioNode.buffer = buffer;
                                this._audioNode.connect(this._gainNode);
                                this._audioNode.start();

                                if (!this._audioElement.srcObject) {
                                    _context.next = 19;
                                    break;
                                }

                                return _context.abrupt("return", this._audioElement.play());

                            case 19:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
        /**
         * Change which device the sound should play through.
         * @param sinkId - The sink of the device to play sound through.
         */

    }, {
        key: "setSinkId",
        value: function setSinkId(sinkId) {
            return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (!(typeof this._audioElement.setSinkId !== 'function')) {
                                    _context2.next = 2;
                                    break;
                                }

                                throw new Error('This browser does not support setSinkId.');

                            case 2:
                                if (!(sinkId === this.sinkId)) {
                                    _context2.next = 4;
                                    break;
                                }

                                return _context2.abrupt("return");

                            case 4:
                                if (!(sinkId === 'default')) {
                                    _context2.next = 11;
                                    break;
                                }

                                if (!this.paused) {
                                    this._gainNode.disconnect(this._destination);
                                }
                                this._audioElement.srcObject = null;
                                this._destination = this._audioContext.destination;
                                this._gainNode.connect(this._destination);
                                this._sinkId = sinkId;
                                return _context2.abrupt("return");

                            case 11:
                                _context2.next = 13;
                                return this._audioElement.setSinkId(sinkId);

                            case 13:
                                if (!this._audioElement.srcObject) {
                                    _context2.next = 15;
                                    break;
                                }

                                return _context2.abrupt("return");

                            case 15:
                                this._gainNode.disconnect(this._audioContext.destination);
                                this._destination = this._audioContext.createMediaStreamDestination();
                                this._audioElement.srcObject = this._destination.stream;
                                this._sinkId = sinkId;
                                if (!this.paused) {
                                    this._gainNode.connect(this._destination);
                                }

                            case 20:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
        /**
         * Create a Deferred for a Promise that will be resolved when .src is set or rejected
         *   when .pause is called.
         */

    }, {
        key: "_createPlayDeferred",
        value: function _createPlayDeferred() {
            var deferred = new Deferred_1.default();
            this._pendingPlayDeferreds.push(deferred);
            return deferred;
        }
        /**
         * Reject all deferreds for the Play promise.
         * @param reason
         */

    }, {
        key: "_rejectPlayDeferreds",
        value: function _rejectPlayDeferreds(reason) {
            var deferreds = this._pendingPlayDeferreds;
            deferreds.splice(0, deferreds.length).forEach(function (_ref) {
                var reject = _ref.reject;
                return reject(reason);
            });
        }
        /**
         * Resolve all deferreds for the Play promise.
         * @param result
         */

    }, {
        key: "_resolvePlayDeferreds",
        value: function _resolvePlayDeferreds(result) {
            var deferreds = this._pendingPlayDeferreds;
            deferreds.splice(0, deferreds.length).forEach(function (_ref2) {
                var resolve = _ref2.resolve;
                return resolve(result);
            });
        }
    }, {
        key: "destination",
        get: function get() {
            return this._destination;
        }
    }, {
        key: "loop",
        get: function get() {
            return this._loop;
        },
        set: function set(shouldLoop) {
            // If a sound is already looping, it should continue playing
            //   the current playthrough and then stop.
            if (!shouldLoop && this.loop && !this.paused) {
                var _pauseAfterPlaythrough = function _pauseAfterPlaythrough() {
                    self._audioNode.removeEventListener('ended', _pauseAfterPlaythrough);
                    self.pause();
                };

                var self = this;

                this._audioNode.addEventListener('ended', _pauseAfterPlaythrough);
            }
            this._loop = shouldLoop;
        }
        /**
         * Whether the audio element is muted.
         */

    }, {
        key: "muted",
        get: function get() {
            return this._gainNode.gain.value === 0;
        },
        set: function set(shouldBeMuted) {
            this._gainNode.gain.value = shouldBeMuted ? 0 : 1;
        }
        /**
         * Whether the sound is paused. this._audioNode only exists when sound is playing;
         *   otherwise AudioPlayer is considered paused.
         */

    }, {
        key: "paused",
        get: function get() {
            return this._audioNode === null;
        }
    }, {
        key: "src",
        get: function get() {
            return this._src;
        },
        set: function set(src) {
            var _this3 = this;

            // Pause any currently playing audio
            if (this._src) {
                this.pause();
            }
            this._src = src;
            this._bufferPromise = new Promise(function (resolve, reject) {
                return __awaiter(_this3, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                    var buffer;
                    return regeneratorRuntime.wrap(function _callee3$(_context3) {
                        while (1) {
                            switch (_context3.prev = _context3.next) {
                                case 0:
                                    if (src) {
                                        _context3.next = 2;
                                        break;
                                    }

                                    return _context3.abrupt("return", this._createPlayDeferred().promise);

                                case 2:
                                    _context3.next = 4;
                                    return bufferSound(this._audioContext, this._XMLHttpRequest, src);

                                case 4:
                                    buffer = _context3.sent;

                                    this.dispatchEvent('canplaythrough');
                                    resolve(buffer);

                                case 7:
                                case "end":
                                    return _context3.stop();
                            }
                        }
                    }, _callee3, this);
                }));
            });
        }
    }, {
        key: "sinkId",
        get: function get() {
            return this._sinkId;
        }
    }]);

    return AudioPlayer;
}(EventTarget_1.default);

exports.default = AudioPlayer;
/**
 * Use XMLHttpRequest to load the AudioBuffer of a remote audio asset.
 * @private
 * @param context - The AudioContext to use to decode the audio data
 * @param RequestFactory - The XMLHttpRequest factory to build
 * @param src - The URL of the audio asset to load.
 * @returns A Promise containing the decoded AudioBuffer.
 */
// tslint:disable-next-line:variable-name
function bufferSound(context, RequestFactory, src) {
    return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var request, event;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        request = new RequestFactory();

                        request.open('GET', src, true);
                        request.responseType = 'arraybuffer';
                        _context4.next = 5;
                        return new Promise(function (resolve) {
                            request.addEventListener('load', resolve);
                            request.send();
                        });

                    case 5:
                        event = _context4.sent;
                        _context4.prev = 6;
                        return _context4.abrupt("return", context.decodeAudioData(event.target.response));

                    case 10:
                        _context4.prev = 10;
                        _context4.t0 = _context4["catch"](6);
                        return _context4.abrupt("return", new Promise(function (resolve) {
                            context.decodeAudioData(event.target.response, resolve);
                        }));

                    case 13:
                    case "end":
                        return _context4.stop();
                }
            }
        }, _callee4, this, [[6, 10]]);
    }));
}
//# sourceMappingURL=AudioPlayer.js.map