import EventTarget from './EventTarget';

import ChromeAudioContext, { ChromeHTMLAudioElement, MediaStreamAudioDestinationNode } from './ChromeAudioContext';

/**
 * Options that may be passed to AudioPlayer for dependency injection.
 */
export interface IAudioPlayerOptions {
  /**
   * The factory for Audio.
   */
  AudioFactory: any;

  /**
   * The factory for XMLHttpRequest.
   */
  XMLHttpRequestFactory: any;
}

/**
 * An {@link AudioPlayer} is an HTMLAudioElement-like object that uses AudioContext
 *   to circumvent browser limitations.
 */
export default class AudioPlayer extends EventTarget {
  /**
   * The AudioContext. This is passed in at construction and used to create
   *   MediaStreamBuffers and AudioNodes for playing sound through.
   */
  private _audioContext: ChromeAudioContext;

  /**
   * The Audio element that is used to play sound through when a non-default
   *   sinkId is set.
   */
  private _audioElement: ChromeHTMLAudioElement;

  /**
   * The AudioBufferSourceNode of the actively loaded sound. Null if a sound
   *   has not been loaded yet. This is re-used for each time the sound is
   *   played.
   */
  private _audioNode: AudioBufferSourceNode|null = null;

  /**
   * A Promise for the AudioBuffer. Listening for the resolution of this Promise
   *   delays an operation until after the sound is loaded and ready to be
   *   played.
   */
  private _bufferPromise: Promise<AudioBuffer>;

  /**
   * An Array of deferred-like objects for each pending `play` Promise. When
   *   .pause() is called or .src is set, all pending play Promises are
   *   immediately rejected.
   */
  private _pendingDeferreds: Array<{ resolve: Function, reject: Function }> = [];

  /**
   * The Factory to use to construct an XMLHttpRequest.
   */
  private _XMLHttpRequest: any;

  /**
   * The current destination for audio playback. This is set to context.destionation
   *   when default, or a specific MediaStreamAudioDestinationNode when setSinkId
   *   is set.
   */
  private _destination: MediaStreamAudioDestinationNode;
  get destination(): MediaStreamAudioDestinationNode { return this._destination; }

  /**
   * Whether or not the audio element should loop. If disabled during playback,
   *   playing continues until the sound ends and then stops looping.
   */
  private _loop: boolean = false;
  get loop(): boolean { return this._loop; }
  set loop(shouldLoop: boolean) {
    // If a sound is already looping, it should continue playing
    //   the current playthrough and then stop.
    if (!shouldLoop && this.loop && !this.paused) {
      this._audioNode.addEventListener('ended', () => {
        this.pause();
      });
    }

    this._loop = shouldLoop;
  }

  /**
   * Whether the sound is paused. this._audioNode only exists when sound is playing;
   *   otherwise AudioPlayer is considered paused.
   */
  get paused(): boolean { return this._audioNode === null; }

  /**
   * The source URL of the sound to play. When set, the currently playing sound will stop.
   */
  private _src: string = '';
  get src(): string { return this._src; }
  set src(src: string) {
    // Pause any currently playing audio
    if (this._src) {
      this.pause();
    }

    this._src = src;
    this._bufferPromise = src
      ? bufferSound(this._audioContext, this._XMLHttpRequest, src).then(buffer => {
          this.dispatchEvent('canplaythrough', buffer);
          return buffer;
        })
      : new Promise((resolve, reject) => this._pendingDeferreds.push({ resolve, reject }));
  }

  /**
   * The current sinkId of the device audio is being played through.
   */
  private _sinkId: string = 'default';
  get sinkId(): string { return this._sinkId; }

  /**
   * @param audioContext - The AudioContext to use for controlling sound the through.
   * @param options
   */
  constructor(audioContext: any,
              options?: IAudioPlayerOptions);

  /**
   * @param audioContext - The AudioContext to use for controlling sound the through.
   * @param src - The URL of the sound to load.
   * @param options
   */
  constructor(audioContext: any,
              src: string,
              options?: IAudioPlayerOptions);

  /**
   * @private
   */
  constructor(audioContext: any,
              srcOrOptions: string|IAudioPlayerOptions = { } as IAudioPlayerOptions,
              options?: IAudioPlayerOptions) {
    super();

    if (typeof srcOrOptions !== 'string') {
      options = srcOrOptions;
    }

    this._audioContext = audioContext as ChromeAudioContext;
    this._audioElement = new (options.AudioFactory || Audio)();
    this._bufferPromise = new Promise((resolve, reject) => this._pendingDeferreds.push({ resolve, reject }));
    this._destination = this._audioContext.destination;
    this._XMLHttpRequest = options.XMLHttpRequestFactory || XMLHttpRequest;

    this.addEventListener('canplaythrough', () => {
      const deferreds = this._pendingDeferreds;
      deferreds.splice(0, deferreds.length).forEach(({ resolve }) => resolve());
    });

    if (typeof srcOrOptions === 'string') {
      this.src = srcOrOptions;
    }
  }

  /**
   * Pause the audio coming from this AudioPlayer. This will reject any pending
   *   play Promises.
   */
  pause(): void {
    if (this.paused) { return; }

    this._audioElement.pause();

    this._audioNode.stop();
    this._audioNode.disconnect(this._audioContext.destination);
    this._audioNode = null;

    const deferreds = this._pendingDeferreds;
    deferreds.splice(0, deferreds.length).forEach(({ resolve }) => resolve());
  }

  /**
   * Play the sound. If the buffer hasn't loaded yet, wait for the buffer to load. If
   *   the source URL is not set yet, this Promise will remain pending until a source
   *   URL is set.
   */
  play(): Promise<void> {
    if (!this.paused) { return Promise.resolve(); }

    this._audioNode = this._audioContext.createBufferSource();
    this._audioNode.loop = this.loop;

    return this._bufferPromise.then((buffer: AudioBuffer) => {
      if (this.paused) {
        throw new Error('The play() request was interrupted by a call to pause().');
      }

      this._audioNode.buffer = buffer;
      this._audioNode.connect(this._destination);
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
  setSinkId(sinkId: string): Promise<void> {
    if (typeof this._audioElement.setSinkId !== 'function') {
      throw new Error('This browser does not support setSinkId.');
    }

    if (sinkId === this.sinkId) {
      return Promise.resolve();
    }

    if (sinkId === 'default') {
      if (!this.paused) {
        this._audioNode.disconnect(this._destination);
      }

      this._audioElement.srcObject = null;
      this._destination = this._audioContext.destination;
      this._sinkId = sinkId;

      return Promise.resolve();
    }

    return this._audioElement.setSinkId(sinkId).then(() => {
      if (this._audioElement.srcObject) { return; }

      this._destination = this._audioContext.createMediaStreamDestination();
      this._audioElement.srcObject = this._destination.stream;
      this._sinkId = sinkId;

      if (!this.paused) {
        this._audioNode.connect(this._destination);
      }
    });
  }
}

/**
 * Use XMLHttpRequest to load the AudioBuffer of a remote audio asset.
 * @private
 * @param context - The AudioContext to use to decode the audio data
 * @param RequestFactory - The XMLHttpRequest factory to build
 * @param src - The URL of the audio asset to load.
 * @returns A Promise containing the decoded AudioBuffer.
 */
// tslint:disable-next-line:variable-name
function bufferSound(context: any, RequestFactory: any, src: string): Promise<AudioBuffer> {
  const request: XMLHttpRequest = new RequestFactory();
  request.open('GET', src, true);
  request.responseType = 'arraybuffer';

  return new Promise(resolve => {
    request.addEventListener('load', resolve);
    request.send();
  }).then((event: any) => {
    return context.decodeAudioData(event.target.response);
  });
}
