import { Texture } from "pixi.js";
import { AnimatedSprite } from "pixi.js";
/**
 * Class to make more complex animations
 * Removed the need for the AnimatedSpriteEx since pixi got fixed -
 *
 * Reworked to use only one AnimatedSprite so it plays nice with a ParticleContainer - Milton Q2 2021
 * @author Marcefabian & Milton
 */
export class StateMachineAnimator extends AnimatedSprite {
	/**
	 * The name of the current state. Getter only.
	 */
	private _currentStateName: string;
	public get currentStateName(): string {
		return this._currentStateName;
	}
	/**
	 * The Map where the state's names and the corresponding animations are stored
	 */
	private states: Map<string, AnimationStateData>;
	private stateQueue: Array<string> = [];
	/**
	 * Class constructor.
	 * @param autoUpdate False if you want to call the update function manually.
	 */
	constructor(autoUpdate: boolean = true) {
		super([Texture.EMPTY], autoUpdate);
		this.states = new Map();
		this._currentStateName = null;
		this.autoUpdate = autoUpdate;
	}
	/**
	 * Adds a state called "name" to the state machine.
	 * You can add a texture array, a comma separated lists of textures or both.
	 * @param name The name of the state.
	 * @param textureArray A texture array
	 * @param loop True (default) if you want to make the animation loop.
	 * @returns The added animation.
	 */
	public addState(name: string, textureArray: Texture[] = [Texture.EMPTY], fps: number = 15, loop: boolean = true): void {
		if (this.states.has(name)) {
			console.warn("This state already exists, overwriting");
		}
		this.states.set(name, {
			currentFrame: 0,
			loop: loop,
			textures: textureArray,
			fps: fps,
		});

		if (this.currentStateName == undefined) {
			this._currentStateName = name;
			this.playState(name);
		}
	}
	/**
	 * Stops the previous state and plays another.
	 * **THIS WILL DELETE YOUR QUEUE**
	 * Doesn't do anything if the desired state doesn't exists.
	 * @param name The state's name
	 * @param startFromFrame The starting frame of the state (The decimals are the percentage of completition of the frame).
	 */
	public playState(name: string, startFromFrame?: number): void;
	/**
	 * Stops the previous state and plays another.
	 * **THIS WILL DELETE YOUR QUEUE**
	 * Doesn't do anything if the desired state doesn't exists.
	 * @param name The state's name
	 * @param startFrom Starts in the frame where the previous animation left (even the mid-frame progress is transfered).
	 */
	public playState(name: string, startFrom: "sync"): void;
	/**
	 * Stops the previous state and plays another.
	 * **THIS WILL DELETE YOUR QUEUE**
	 * Doesn't do anything if the desired state doesn't exists.
	 * @param name The state's name
	 * @param startFrom Starts in the position it was before it was stoped.
	 */
	public playState(name: string, startFrom: "previous"): void;
	public playState(name: string, startFrom: number | "sync" | "previous" = 0): void {
		if (this.hasState(name)) {
			this.stateQueue = [];
			const prevFrameTime = (this as any)._currentTime;
			this.states.get(this.currentStateName).currentFrame = prevFrameTime;
			this.stop();

			// play next state
			const newState = this.states.get(name);
			this.textures = newState.textures;
			this.animationSpeed = newState.fps / 60;
			this.loop = newState.loop;
			this._currentStateName = name;

			/** The frame the animation starts */
			let startingFrame: number;
			if (startFrom == "previous") {
				startingFrame = newState.currentFrame;
			} else if (startFrom == "sync") {
				startingFrame = prevFrameTime;
			} else {
				startingFrame = startFrom;
			}
			this.gotoAndPlay(0);
			(this as any)._currentTime = startingFrame;
		} else {
			console.warn(`The state ${name} doesn't exist`);
		}
	}
	/**
	 * Pushes your state(s) to a queue. When the current state reaches it's end, if it's not looping it will trigger the next one to play.
	 * **A LOOPING STATE WILL STALL YOUR QUEUE!**
	 * @param state The state(s) to queue.
	 * @param [overwriteCurrentQueue] Should we replace the current queue with this one?
	 */
	public queueState(state: string | string[], overwriteCurrentQueue: boolean = false): void {
		const shouldPlayFirst = this.currentStateName == undefined;
		if (Array.isArray(state)) {
			if (overwriteCurrentQueue) {
				this.stateQueue = Array.from(state);
			} else {
				this.stateQueue.push(...state);
			}
		} else {
			if (overwriteCurrentQueue) {
				this.stateQueue = [state];
			} else {
				this.stateQueue.push(state);
			}
		}

		if (this.stateQueue.length > 0 && shouldPlayFirst) {
			this.playState(this.stateQueue.shift());
		}
	}
	/**
	 * Returns a boolean indicating if the StateMachineAnimation has the state "name"
	 * @param name The name of the state to search.
	 * @returns true if the state exists, false otherwise.
	 */
	public hasState(name: string): boolean {
		return this.states.has(name);
	}
	/** Sets the loop for a state after creation */
	public setStateLoop(name: string, value: boolean): void {
		this.states.get(name).loop = value;
		if (this._currentStateName == name) {
			this.loop = value;
		}
	}
	/**
	 * Sets the fps for a state after creation
	 */
	public setStateFPS(name: string, value: number): void {
		this.states.get(name).fps = value;
		if (this._currentStateName == name) {
			this.animationSpeed = value / 60;
		}
	}
	/**
	 * Sets the Texture array for a state after creation
	 */
	public setStateTextures(name: string, textures: Texture[]): void {
		this.states.get(name).textures = textures;
		if (this._currentStateName == name) {
			this.textures = textures;
		}
	}
	/**
	 * Removes the state "name"
	 * @param name The state to be removed
	 * @returns True if the current state is valid.
	 */
	public removeState(name: string): boolean {
		let isValidState: boolean = true;
		if (this.hasState(name)) {
			if (this._currentStateName == name) {
				this.textures = [Texture.EMPTY];
				this.animationSpeed = 0;
				this.loop = false;
				this._currentStateName = null;
				isValidState = false;
			}
			this.states.delete(name);
		} else {
			console.warn(`The state ${name} doesn't exists, so tecnically it has been succesfully removed`);
		}
		return isValidState;
	}
	/**
	 * An update function called when autoUpdate is false.
	 * @param dt Time from the previous frame.
	 */
	public override update(dt: number): void {
		if (this.stateQueue.length > 0 && (this as any)._currentTime >= this.textures.length && !this.loop) {
			this.playState(this.stateQueue.shift());
		}
		if (this.autoUpdate) {
			super.update(dt);
		} else {
			super.update(dt / (1000 / 60));
		}
	}
}

interface AnimationStateData {
	textures: Texture[];
	loop: boolean;
	currentFrame: number;
	fps: number;
}
