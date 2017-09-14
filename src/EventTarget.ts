import { EventEmitter } from 'events';
import { inherits } from 'util';

export default class EventTarget {
  private _eventEmitter: EventEmitter = new EventEmitter();

  // tslint:disable-next-line:no-empty
  constructor() { }

  addEventListener(name: string, handler: Function): EventEmitter {
    return this._eventEmitter.addListener(name, handler);
  }

  dispatchEvent(name: string, ...args: any[]): boolean {
    return this._eventEmitter.emit(name, ...args);
  }
}
