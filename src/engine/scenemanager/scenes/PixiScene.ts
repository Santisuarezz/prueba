import { Container } from "pixi.js";
import { utils } from "pixi.js";
import { Group } from "tweedle.js";
import type { IScene } from "./../IScene";

/**
 * Pixi scene
 * A pixi scene is a simple 2d only scene
 */
export abstract class PixiScene extends Container implements IScene {
	/**
	 * Should the update method pause when we lose focus?
	 */
	public pauseUpdateOnFocusLost: boolean = true;

	/**
	 * Should tweens pause when we lose focus?
	 */
	public pauseTweenOnFocusLost: boolean;

	/**
	 * A tweem group that gets updated by the SceneManager before the update loop.
	 * Gets destroyed when you destroy a scene.
	 */
	public tweens: Group;

	/**
	 * Event emitter used to emit lifetime events for the scene.
	 * The events will be fired by the SceneManager but emitted from this object.
	 * Find the events in SceneEvents.ts
	 */
	public events: utils.EventEmitter<symbol>;

	/**
	 * Creates an instance of pixi scene.
	 */
	public constructor() {
		super();
		this.stages = [this];
		this.tweens = new Group();
		this.events = new utils.EventEmitter();
		this.name = this.constructor.name;
	}

	public async requestClose(): Promise<boolean> {
		this.closeHandler();
		await Promise.resolve();
		return true;
	}

	/**
	 * the order in which this will be rendered.
	 * lower is rendered first, higher is rendered after (on top).
	 * Sorting algorithm is forced to be stable and since undefined == undefined, not setting this to anything will kinda work
	 */
	public index: number;

	/**
	 * A list of things to be rendered.
	 * Here you can mix and match 2d and 3d.
	 * 2d is just a pixi container.
	 * 3d is an object that has a three scene and a three camera since a scene can have many cameras
	 * Fun fact: Cameras don't need to be "inside" a scene to see it.
	 *
	 * Elements are rendered in order. Lower is rendered first, higher is rendered after (on top).
	 */
	public stages: Container[];

	/**
	 * Call when you need this to be closed. (only works if you are NOT a main scene!)
	 */
	public closeHandler: (lastWords?: any) => void;

	/**
	 * Called when a popup is opened.
	 */
	public onPopupOpen(_popupReference: IScene, _popupParams?: any[]): void {}

	/**
	 * Called when a popup is closed.
	 */
	public onPopupClose(_popupClass: new (...args: any[]) => IScene, _lastWords?: any): void {}

	/**
	 * Called when a scene is opened as modal.
	 */
	public onSceneOpen(_sceneReference: IScene, _sceneParams?: any[]): void {}
	/**
	 * Called when a scene as modal is closed.
	 */
	public onSceneClose(_sceneClass: new (...args: any[]) => IScene, _lastWords?: any): void {}

	/**
	 * Called after the first resize. After onResize()
	 */
	public onStart(): void {}

	/**
	 * Called when the transition finished. After onStart().
	 */
	public onShow(): void {}

	/**
	 * Called when the transition covered completely this scene and just before destroying it.
	 * @param	navigatingTo To which scene you are going. WARNING: The target scene has not been created yet AND it can change.
	 */
	public onDestroy(_navigatingTo: new (...args: any[]) => IScene): void {}

	/**
	 * When the game becomes the active window
	 */
	public onFocus(): void {}

	/**
	 * When the game stop being the active window
	 */
	public onFocusLost(): void {}

	/**
	 * When the canvas size changes. For when we need elastic stuff
	 * Also called right after creation, before onStart
	 * @param	newW	The new Width
	 * @param	newH	The new Height
	 */
	public onResize(_newW: number, _newH: number): void {}

	/**
	 * This is called from the manager when you do a "Manager.pause()"
	 * Manager won't check this function. Manager will only call pause. Your game must check if it's already paused or not.
	 */
	public onPause(): void {}

	/**
	 * This is called from the manager when you do a "Manager.resume()"
	 * Manager won't check this function. Manager will only call resume. Your game must check if it's already resumed or not.
	 */
	public onResume(): void {}

	/**
	 * Function called each frame.
	 * @param	dt Delta Time. The time in miliseconds since the last excecution.
	 */
	public update(_dt: number): void {}

	/**
	 * This is called from the manager when a message from an external site came through
	 */
	public onMessage(_event: MessageEvent<any>): void {}

	public override destroy(): void {
		// If I have stages in the scene
		if (this.stages) {
			// for each stage
			for (const stage of this.stages) {
				// double check in case a punk stored a null in that array
				if (stage && stage != this) {
					stage.destroy({ children: true });
				}
			}
		}
		this.tweens.removeAll();
		this.events.removeAllListeners();
		super.destroy({ children: true });
	}
}
