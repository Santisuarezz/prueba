import { Key } from "./Key";
import { utils } from "pixi.js";
import { legacyKeyboardHelper } from "./legacyKeyboardHelper";

/**
 * This class encapsulates keyboard events.
 * You can check the current state of any key with the functions that start with "is". These functions are bound to the rendering frame.
 * You can suscribe to the keyboard events with `pressed` and `released` and the event name is the key you want to listen to. This is not frame bound and can fire many times inside a frame.
 * Please remember to `destroy()` this bad boy when you are done with it.
 */
export class Keyboard {
	public static readonly shared: Keyboard = new Keyboard();
	private readonly isDownMap: Map<Key | string, boolean> = new Map();
	private readonly previousFrame: Map<Key | string, boolean> = new Map();
	private readonly justPressedMap: Map<Key | string, boolean> = new Map();
	private readonly justReleasedMap: Map<Key | string, boolean> = new Map();

	/**
	 * Event emmiter for keydown. This can fire many times in a single frame, be careful!
	 */
	public readonly pressed: utils.EventEmitter = new utils.EventEmitter();

	/**
	 * Event emmiter for keyup. This can fire many times in a single frame, be careful!
	 */
	public readonly released: utils.EventEmitter = new utils.EventEmitter();
	private stopRaf: boolean = false;

	// for removing the events after
	private keydown: (e: KeyboardEvent) => void;
	private keyUp: (e: KeyboardEvent) => any;

	// backup field
	private _enabled: boolean = true;

	/**
	 * A disabled keyboard will not emmit event and all the keys will report as not being pressed.
	 */
	public get enabled(): boolean {
		return this._enabled;
	}
	public set enabled(value: boolean) {
		if (!value && this._enabled) {
			this.clearState();
		}
		this._enabled = value;
	}

	public constructor() {
		this.keydown = (e: KeyboardEvent) => {
			if (this.enabled) {
				let code = e.code;
				if (!code) {
					code = legacyKeyboardHelper[e.keyCode];
				}
				if (code) {
					this.isDownMap.set(code, true);
					this.pressed.emit(code, e);
				}
				this.pressed.emit(Key.ANY, e);
			}
		};
		window.addEventListener("keydown", this.keydown);

		this.keyUp = (e: KeyboardEvent) => {
			if (this.enabled) {
				let code = e.code;
				if (!code) {
					code = legacyKeyboardHelper[e.keyCode];
				}
				if (code) {
					this.isDownMap.set(code, false);
					this.released.emit(code, e);
				}
				this.released.emit(Key.ANY, e);
			}
		};
		window.addEventListener("keyup", this.keyUp);

		this.update(); // start rAF loop
	}

	private update(): void {
		// raf loop that keeps refreshes the state of the previous frame so we can detect edges.
		if (this.enabled) {
			this.isDownMap.forEach((value: boolean, key: Key) => {
				if (value && !this.previousFrame.get(key)) {
					this.justPressedMap.set(key, true);
				} else {
					this.justPressedMap.set(key, false);
				}

				if (!value && this.previousFrame.get(key)) {
					this.justReleasedMap.set(key, true);
				} else {
					this.justReleasedMap.set(key, false);
				}
			});

			this.isDownMap.forEach((value: boolean, key: Key) => {
				this.previousFrame.set(key, value);
			});
		}
		if (!this.stopRaf) {
			requestAnimationFrame(this.update.bind(this));
		}
	}

	/**
	 * Returns true if the key is down.
	 * To check if a key is up, just see if this is false :P
	 * This is locked to the rendering frame so be aware of that.
	 * @param key The key to check. Use the `Key` enum or use the `keyboardevent.code`. **NOT THE `keyCode`!!**
	 * @returns true if down
	 */
	public isDown(key: Key | string): boolean {
		if (key == Key.ANY) {
			let retval: boolean = false;
			this.isDownMap.forEach((v) => (v ? (retval = true) : void 0));
			return retval;
		} else {
			return Boolean(this.isDownMap.get(key));
		}
	}

	/**
	 * Returns true if the key was not down the previous frame but is down during this frame
	 * This is locked to the rendering frame so be aware of that.
	 * @param key The key to check. Use the `Key` enum or use the `keyboardevent.code`. **NOT THE `keyCode`!!**
	 * @returns true if just pressed
	 */
	public justPressed(key: Key | string): boolean {
		if (key == Key.ANY) {
			let retval: boolean = false;
			this.justPressedMap.forEach((v) => (v ? (retval = true) : void 0));
			return retval;
		} else {
			return Boolean(this.justPressedMap.get(key));
		}
	}

	/**
	 * Returns true if the key was down the previous frame but not down during this frame
	 * This is locked to the rendering frame so be aware of that.
	 * @param key The key to check. Use the `Key` enum or use the `keyboardevent.code`. **NOT THE `keyCode`!!**
	 * @returns true if just released
	 */
	public justReleased(key: Key | string): boolean {
		if (key == Key.ANY) {
			let retval: boolean = false;
			this.justReleasedMap.forEach((v) => (v ? (retval = true) : void 0));
			return retval;
		} else {
			return Boolean(this.justReleasedMap.get(key));
		}
	}

	/**
	 * Removes all listeners that you added to either pressed or released
	 */
	public removeAllListeners(): void {
		this.pressed.removeAllListeners();
		this.released.removeAllListeners();
	}

	/**
	 * Clears the state of this keyboard instance
	 */
	public clearState(): void {
		this.isDownMap.clear();
		this.previousFrame.clear();
		this.justPressedMap.clear();
		this.justReleasedMap.clear();
	}

	/**
	 * Destroys keyboard
	 * Clears the states, removes all your listeners and unhooks the keyboard.
	 */
	public destroy(): void {
		this.removeAllListeners();
		this.clearState();
		// exit early if it is the shared keyboard
		if (this == Keyboard.shared) {
			console.log("You can't kill the shared keyboard man, that would be rude.\nI removed all the events but didn't kill the keyboard");
			return;
		}

		this.stopRaf = true;
		window.removeEventListener("keydown", this.keydown);
		window.removeEventListener("keyup", this.keyUp);
	}
}
