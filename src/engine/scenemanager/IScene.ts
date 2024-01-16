import type { utils } from "pixi.js";
import type { Group } from "tweedle.js";

export interface IScene {
	// ! I can't add static fields to an interface but...
	// static BUNDLES: string[];

	/**
	 * Should tweens pause when we lose focus?
	 */
	pauseTweenOnFocusLost: boolean;

	/**
	 * A tweem group that gets updated by the SceneManager before the update loop.
	 * Gets destroyed when you destroy a scene.
	 */
	tweens: Group;

	/**
	 * Event emitter used to emit lifetime events for the scene.
	 * The events will be fired by the SceneManager but emitted from this object.
	 * Find the events in SceneEvents.ts
	 */
	events: utils.EventEmitter<symbol>;

	/**
	 * Should the update method pause when we lose focus?
	 */
	pauseUpdateOnFocusLost: boolean;

	/**
	 * the order in which this will be rendered.
	 * lower is rendered first, higher is rendered after (on top).
	 * Sorting algorithm is forced to be stable and since undefined == undefined, not setting this to anything will kinda work
	 */
	index: number;

	/**
	 * A list of things to be rendered.
	 * Here you can mix and match 2d and 3d.
	 * 2d is just a pixi container.
	 * 3d is an object that has a three scene and a three camera since a scene can have many cameras
	 * Fun fact: Cameras don't need to be "inside" a scene to see it.
	 *
	 * Elements are rendered in order. Lower is rendered first, higher is rendered after (on top).
	 */
	stages: any[]; // (Container | { scene: Scene; camera: Camera })[]; // Ideally this should be a sortable set. Too bad.

	/**
	 * Call when you need this to be closed.
	 */
	closeHandler: (lastWords?: any) => void;

	/**
	 * Request nicely to the scene that you want to close. The scene might delay or even refuse your request. The SceneManager has method to forcefully close it anyway.
	 * @returns close Promise that resolves with true when the scene has closed or with false when the scene decieded that it refuses to close.
	 */
	requestClose(): Promise<boolean>;

	/**
	 * Called when a popup is opened.
	 */
	onPopupOpen(popupReference: IScene, popupParams?: any[]): void;

	/**
	 * Called when a popup is closed.
	 */
	onPopupClose(popupClass: new (...args: unknown[]) => IScene, lastWords?: any): void;

	/**
	 * Called when a scene is opened as modal.
	 */
	onSceneOpen(sceneReference: IScene, sceneParams?: any[]): void;

	/**
	 * Called when a scene as modal is closed.
	 */
	onSceneClose(sceneClass: new (...args: unknown[]) => IScene, lastWords?: any): void;

	/**
	 * Called after the first resize. After onResize()
	 */
	onStart(): void;

	/**
	 * Called when the transition finished. After onStart().
	 */
	onShow(): void;

	/**
	 * Called when the transition covered completely this scene and just before destroying it.
	 * @param	navigatingTo To which scene you are going. WARNING: The target scene has not been created yet AND it can change.
	 */
	onDestroy(navigatingTo: new (...args: unknown[]) => IScene): void;

	/**
	 * When the game becomes the active window
	 */
	onFocus(): void;

	/**
	 * When the game stop being the active window
	 */
	onFocusLost(): void;

	/**
	 * When the canvas size changes. For when we need elastic stuff
	 * Also called right after creation, before onStart
	 * @param	newW	The new Width
	 * @param	newH	The new Height
	 */
	onResize(newW: number, newH: number): void;

	/**
	 * This is called from the manager when you do a "Manager.externalPause()"
	 * Manager won't check this function. Manager will only call pause. Your game must check if it's already paused or not.
	 */
	onPause(): void;

	/**
	 * This is called from the manager when you do a "Manager.externalResume()"
	 * Manager won't check this function. Manager will only call resume. Your game must check if it's already resumed or not.
	 */
	onResume(): void;

	/**
	 * This is called from the manager when a message from an external site came through
	 */
	onMessage(event: MessageEvent<any>): void;

	/**
	 * Function called each frame.
	 * @param	dt Delta Time. The time in miliseconds since the last excecution.
	 */
	update(dt: number): void;

	/**
	 * YOU SHOULDN'T BE CALLING THIS FUNCTION!
	 * THIS IS FOR MANAGER USE!
	 * (however you might want to add stuff here...)
	 */
	destroy(): void;
}
