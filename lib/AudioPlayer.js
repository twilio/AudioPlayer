"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Deferred_1 = require("./Deferred");
const EventTarget_1 = require("./EventTarget");
/**
 * An {@link AudioPlayer} is an HTMLAudioElement-like object that uses AudioContext
 *   to circumvent browser limitations.
 */
class AudioPlayer extends EventTarget_1.default {
    /**
     * @private
     */
    constructor(audioContext, srcOrOptions = {}, options = {}) {
        super();
        /**
         * The AudioBufferSourceNode of the actively loaded sound. Null if a sound
         *   has not been loaded yet. This is re-used for each time the sound is
         *   played.
         */
        this._audioNode = null;
        /**
         * An Array of deferred-like objects for each pending `play` Promise. When
         *   .pause() is called or .src is set, all pending play Promises are
         *   immediately rejected.
         */
        this._pendingPlayDeferreds = [];
        /**
         * Whether or not the audio element should loop. If disabled during playback,
         *   playing continues until the sound ends and then stops looping.
         */
        this._loop = false;
        /**
         * The source URL of the sound to play. When set, the currently playing sound will stop.
         */
        this._src = '';
        /**
         * The current sinkId of the device audio is being played through.
         */
        this._sinkId = 'default';
        if (typeof srcOrOptions !== 'string') {
            options = srcOrOptions;
        }
        this._audioContext = audioContext;
        this._audioElement = new (options.AudioFactory || Audio)();
        this._bufferPromise = this._createPlayDeferred().promise;
        this._destination = this._audioContext.destination;
        this._gainNode = this._audioContext.createGain();
        this._gainNode.connect(this._destination);
        this._XMLHttpRequest = options.XMLHttpRequestFactory || XMLHttpRequest;
        this.addEventListener('canplaythrough', () => {
            this._resolvePlayDeferreds();
        });
        if (typeof srcOrOptions === 'string') {
            this.src = srcOrOptions;
        }
    }
    get destination() { return this._destination; }
    get loop() { return this._loop; }
    set loop(shouldLoop) {
        // If a sound is already looping, it should continue playing
        //   the current playthrough and then stop.
        if (!shouldLoop && this.loop && !this.paused) {
            const self = this;
            function pauseAfterPlaythrough() {
                self._audioNode.removeEventListener('ended', pauseAfterPlaythrough);
                self.pause();
            }
            this._audioNode.addEventListener('ended', pauseAfterPlaythrough);
        }
        this._loop = shouldLoop;
    }
    /**
     * Whether the audio element is muted.
     */
    get muted() { return this._gainNode.gain.value === 0; }
    set muted(shouldBeMuted) {
        this._gainNode.gain.value = shouldBeMuted ? 0 : 1;
    }
    /**
     * Whether the sound is paused. this._audioNode only exists when sound is playing;
     *   otherwise AudioPlayer is considered paused.
     */
    get paused() { return this._audioNode === null; }
    get src() { return this._src; }
    set src(src) {
        this._load(src);
    }
    get sinkId() { return this._sinkId; }
    /**
     * Stop any ongoing playback and reload the source file.
     */
    load() {
        this._load(this._src);
    }
    /**
     * Pause the audio coming from this AudioPlayer. This will reject any pending
     *   play Promises.
     */
    pause() {
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
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.paused) {
                yield this._bufferPromise;
                if (!this.paused) {
                    return;
                }
                throw new Error('The play() request was interrupted by a call to pause().');
            }
            this._audioNode = this._audioContext.createBufferSource();
            this._audioNode.loop = this.loop;
            this._audioNode.addEventListener('ended', () => {
                if (this._audioNode && this._audioNode.loop) {
                    return;
                }
                this.dispatchEvent('ended');
            });
            const buffer = yield this._bufferPromise;
            if (this.paused) {
                throw new Error('The play() request was interrupted by a call to pause().');
            }
            this._audioNode.buffer = buffer;
            this._audioNode.connect(this._gainNode);
            this._audioNode.start();
            if (this._audioElement.srcObject) {
                return this._audioElement.play();
            }
        });
    }
    /**
     * Change which device the sound should play through.
     * @param sinkId - The sink of the device to play sound through.
     */
    setSinkId(sinkId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._audioElement.setSinkId !== 'function') {
                throw new Error('This browser does not support setSinkId.');
            }
            if (sinkId === this.sinkId) {
                return;
            }
            if (sinkId === 'default') {
                if (!this.paused) {
                    this._gainNode.disconnect(this._destination);
                }
                this._audioElement.srcObject = null;
                this._destination = this._audioContext.destination;
                this._gainNode.connect(this._destination);
                this._sinkId = sinkId;
                return;
            }
            yield this._audioElement.setSinkId(sinkId);
            if (this._audioElement.srcObject) {
                return;
            }
            this._gainNode.disconnect(this._audioContext.destination);
            this._destination = this._audioContext.createMediaStreamDestination();
            this._audioElement.srcObject = this._destination.stream;
            this._sinkId = sinkId;
            if (!this.paused) {
                this._gainNode.connect(this._destination);
            }
        });
    }
    /**
     * Create a Deferred for a Promise that will be resolved when .src is set or rejected
     *   when .pause is called.
     */
    _createPlayDeferred() {
        const deferred = new Deferred_1.default();
        this._pendingPlayDeferreds.push(deferred);
        return deferred;
    }
    /**
     * Stop current playback and load a sound file.
     * @param src - The source URL of the file to load
     */
    _load(src) {
        if (this._src && this._src !== src) {
            this.pause();
        }
        this._src = src;
        this._bufferPromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (!src) {
                return this._createPlayDeferred().promise;
            }
            const buffer = yield bufferSound(this._audioContext, this._XMLHttpRequest, src);
            this.dispatchEvent('canplaythrough');
            resolve(buffer);
        }));
    }
    /**
     * Reject all deferreds for the Play promise.
     * @param reason
     */
    _rejectPlayDeferreds(reason) {
        const deferreds = this._pendingPlayDeferreds;
        deferreds.splice(0, deferreds.length).forEach(({ reject }) => reject(reason));
    }
    /**
     * Resolve all deferreds for the Play promise.
     * @param result
     */
    _resolvePlayDeferreds(result) {
        const deferreds = this._pendingPlayDeferreds;
        deferreds.splice(0, deferreds.length).forEach(({ resolve }) => resolve(result));
    }
}
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
    return __awaiter(this, void 0, void 0, function* () {
        const request = new RequestFactory();
        request.open('GET', src, true);
        request.responseType = 'arraybuffer';
        const event = yield new Promise(resolve => {
            request.addEventListener('load', resolve);
            request.send();
        });
        // Safari uses a callback here instead of a Promise.
        try {
            return context.decodeAudioData(event.target.response);
        }
        catch (e) {
            return new Promise(resolve => {
                context.decodeAudioData(event.target.response, resolve);
            });
        }
    });
}
//# sourceMappingURL=AudioPlayer.js.map