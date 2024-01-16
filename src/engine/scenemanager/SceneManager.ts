import type { IScene } from "./IScene";
import { TransitionBase } from "./transitions/TransitionBase";
import { sound } from "@pixi/sound";
import { Keyboard } from "../input/Keyboard";
import type { ITransition } from "./ITransition";
import { stableSort } from "../utils/ArrayUtils";
import type { IRenderer } from "./renderers/IRenderer";
import { Group } from "tweedle.js";
import { BUILD_DATE, STATS } from "../../flags";
import Stats from "stats.js";
import { Ticker } from "pixi.js";
import { SceneEvents } from "./SceneEvents";
import { Assets } from "pixi.js";

/** The constructor function of T. It has no arguments */
export type EmptyConstructor<T> = new () => T;
/** The constructor function of T. Comes with any number of arguments */
export type Constructor<T> = new (...args: unknown[]) => T;
export class SceneManager<R extends IRenderer> {
	/**
	 * Should tweens pause when we lose focus?
	 */
	public pauseGlobalTweenOnFocusLost: boolean = true;
	/**
	 * Should audio pause when we lose focus?
	 */
	public pauseSoundOnFocusLost: boolean = true;

	/**
	 * Destroy all tweens on scene change.
	 * This gives us some peace of mind when doing a `changeScene`
	 */
	public destroyGlobalTweensOnSceneChange: boolean = true;

	/**
	 * Destroy all tweens on scene change.
	 * This gives us some peace of mind when doing a `changeScene`
	 */
	public removeKeyboardEventsOnSceneChange: boolean = true;

	/**
	 * Should we forcefully kill ALL active scenes when you do a `changeScene` ?
	 */
	public closeAllScenesOnSceneChange: boolean = false;

	/**
	 * ReadOnly. Width of the screen right now.
	 */
	public get width(): number {
		return this.sceneRenderer.width;
	}
	/**
	 * ReadOnly. Height of the screen right now.
	 */
	public get height(): number {
		return this.sceneRenderer.height;
	}

	/**
	 * ReadOnly. Gets the current devicepixelratio
	 */
	public get devicePixelRatio(): number {
		return this.sceneRenderer.devicePixelRatio;
	}

	/**
	 * Gets min allowed fps directly from the pixi ticker
	 */
	public get minAllowedFPS(): number {
		return this.ticker.minFPS;
	}
	/**
	 * Sets min allowed fps directly from the pixi ticker
	 */
	public set minAllowedFPS(value: number) {
		this.ticker.minFPS = value;
	}

	/**
	 * Gets global dt scale directly from the pixi ticker
	 */
	public get globalDtScale(): number {
		return this.ticker.speed;
	}

	/**
	 * Sets global dt scale directly from the pixi ticker
	 */
	public set globalDtScale(value: number) {
		this.ticker.speed = value;
	}

	/**
	 * Gets the current delta time directly from the pixi ticker
	 */
	public get dt(): number {
		return this.ticker.deltaMS;
	}

	/**
	 * The amount of popups open (The length of the currentPopups array)
	 */
	public get numPopupsOpen(): number {
		return this.currentPopups.length;
	}

	/**
	 * The amount of scenes open (The length of the currentScenes array)
	 */
	public get numScenesOpen(): number {
		return this.currentScenes.length;
	}

	/**
	 * Default transition.
	 * By default this is a "Do nothing" transition
	 */
	private defaultTransition: Constructor<ITransition> = TransitionBase;

	/**
	 * In case your transition needs arguments, put them here.
	 */
	private defaultTransitionParams: unknown[] = [];

	public readonly sceneRenderer: R;

	private popupQueue: Constructor<IScene>[] = [];
	private popupQueueParams: any[][] = []; // this is not a bidimentional array, this is an array of arrays.

	private mainScene?: IScene; // This is what allows you to do `changeScene` without knowing what is open out there.
	private currentScenes: IScene[]; // These could be OrderedSets. However these are private and I know not to break them - Famous last words, Milton 2020
	private currentPopups: IScene[]; // These could be OrderedSets. However these are private and I know not to break them - Famous last words, Milton 2020
	private currentTransition: ITransition | null = null; // Stacking transition seems silly right now - Milton, the same guy that said that stacking scenes was silly.
	private lockScene: IScene | undefined; // Ok, this is more a hotfix than a feature. This will be only one.

	private preferredOrientation: "portrait" | "landscape" = "portrait";
	private currentOrientation: "portrait" | "landscape" = "portrait";

	private ticker: Ticker;
	private hasFocus: boolean = true;

	private stats?: Stats;
	private updateTimeStats?: Stats.Panel;

	private _isChangingScene: boolean = false;
	public get isChangingScene(): boolean {
		return this._isChangingScene;
	}

	private readonly initializedAssets: Promise<void>;

	/**
	 * Creates an instance of scene manager. You provide a renderer and it does it's magic
	 * @param sceneRenderer PixiRenderer for 2d only or HybridRenderer if you need three+pixi
	 * @param [ticker] In case you need to sync with an external renderer ticker.
	 */
	public constructor(sceneRenderer: R, ticker: Ticker = new Ticker()) {
		this.initializedAssets = this.initAssets();
		this.sceneRenderer = sceneRenderer;
		this.ticker = ticker;

		console.info(this.sceneRenderer.getDetails());

		// initialize the arrays

		this.currentPopups = [];
		this.currentScenes = [];

		window.addEventListener("pointerdown", () => {
			if (!this.hasFocus) {
				this.focus();
			}
		});

		window.addEventListener("focus", this.focus.bind(this));
		window.addEventListener("blur", this.focusLost.bind(this));
		window.addEventListener("message", this.postMessage.bind(this));

		// update event
		this.ticker.add(this.update, this);
		this.ticker.start();

		// add the fps counter
		if (STATS) {
			this.stats = new Stats();
			this.updateTimeStats = this.stats.addPanel(new Stats.Panel("UPD %", "#ff8", "#221"));
			this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild(this.stats.dom);
		}
	}

	/**
	 * Function to change a scene with a specific transition
	 * This will replace the current scene with the otherone you provide and will cover with the transition while doing so.
	 * @param caller The class that wants to die and be replaced by another one.
	 * @param newSceneClass The class of the new scene
	 * @param options.sceneParams The parameters of the constructor of the scene
	 * @param options.transitionClass The transition class of the scene
	 * @param options.transitionParams The parameters of the constructor of the scene
	 * @returns A Promise that resolves as soon as the object is created. (Doesn't wait for the opening transition!)
	 */
	public changeScene<TransCtor extends Constructor<ITransition>>(
		newSceneImportPromise: Promise<any>,
		options?: { sceneParams?: any[]; transitionClass?: TransCtor; transitionParams?: ConstructorParameters<TransCtor> }
	): Promise<IScene>; // scene promise and transition class
	public changeScene(newSceneImportPromise: Promise<any>, options?: { sceneParams?: any[]; transitionClass: Promise<any>; transitionParams?: any[] }): Promise<IScene>; // scene promise and transition promise
	public changeScene<SceneCtor extends Constructor<IScene>>(
		newSceneClass: SceneCtor,
		options?: { sceneParams?: ConstructorParameters<typeof newSceneClass>; transitionClass: Promise<any>; transitionParams?: any[] }
	): Promise<IScene>; // scene class and transition promise
	public changeScene<SceneCtor extends Constructor<IScene>, TransCtor extends Constructor<ITransition>>(
		newSceneClass: SceneCtor,
		options?: { sceneParams?: ConstructorParameters<typeof newSceneClass>; transitionClass?: TransCtor; transitionParams?: ConstructorParameters<TransCtor> }
	): Promise<IScene>; // scene class and transition class
	public async changeScene<SceneCtor extends Constructor<IScene>, TransCtor extends Constructor<ITransition>>(
		newSceneClassOrPromise: SceneCtor | Promise<any>,
		options: {
			sceneParams?: any[] | null | undefined;
			transitionClass?: TransCtor | Promise<any>;
			transitionParams?: any[] | null | undefined;
		}
	): Promise<IScene> {
		const { transitionClass: transitionClassOrPromise, transitionParams } = options || {};
		let { sceneParams } = options || {};
		// Start the promise thingy....
		this._isChangingScene = true;

		// create transition
		if (this.currentTransition) {
			console.warn("You fired a transition when another transition was alive. This is probably baaaaaaad");
			this.destroyScene(this.currentTransition);
		}

		// use the default transition unless stated otherwise
		let finalTransitionClass = this.defaultTransition;
		let finalTransitionParams = this.defaultTransitionParams;
		if (transitionClassOrPromise) {
			finalTransitionParams = transitionParams;
			if (transitionClassOrPromise instanceof Promise) {
				finalTransitionClass = await this.extractSceneFromPromise(transitionClassOrPromise);
				this.currentTransition = transitionParams ? new finalTransitionClass(...transitionParams) : new finalTransitionClass();
			} else {
				finalTransitionClass = transitionClassOrPromise;
			}
		}
		await this.loadAssetBundles(finalTransitionClass, undefined, true);
		this.currentTransition = finalTransitionParams ? new finalTransitionClass(...finalTransitionParams) : new finalTransitionClass();

		// accelerated lifecycle!
		this.currentTransition.onResize(this.width, this.height);
		this.currentTransition.events.emit(SceneEvents.START);
		this.currentTransition.onStart();
		this.currentTransition.events.emit(SceneEvents.SHOW);
		this.currentTransition.onShow();

		// start covering
		await this.currentTransition.startCovering();

		// when covered
		if (this.destroyGlobalTweensOnSceneChange) {
			Group.shared.removeAll();
		}

		if (this.removeKeyboardEventsOnSceneChange) {
			Keyboard.shared.removeAllListeners();
		}

		// Destroy and remove old scene... IF WE HAD ONE!.... or maybe kill them all...
		if (this.closeAllScenesOnSceneChange) {
			this.closeAllScenes();
		} else if (this.mainScene) {
			this.mainScene.closeHandler();
		}
		// start resolving transition scene
		const { overrideScene, overrideSceneParams } = (await this.currentTransition.startResolving()) ?? {};
		// when resolved

		// override if needed
		if (overrideScene !== undefined && overrideScene !== null) {
			newSceneClassOrPromise = overrideScene as SceneCtor | Promise<any>;
		}
		if (overrideSceneParams !== undefined && overrideSceneParams !== null) {
			sceneParams = overrideSceneParams;
		}

		// Create the new scene. We "await" because we might need to lazyload some assets
		this.mainScene = await this.openScene(newSceneClassOrPromise as any, {
			sceneParams,
			skipShowCall: true,
			onBundleDownloadProgress: this.currentTransition.onDownloadProgress.bind(this.currentTransition),
		});

		// start uncovering the transition... ! WE DO NOT AWAIT FOR THIS ONE!
		this.currentTransition.startUncovering().then(() => {
			// when uncovered
			this._isChangingScene = false;

			// tell the new scene he is up
			this.mainScene?.events.emit(SceneEvents.SHOW);
			this.mainScene?.onShow();

			// oh, remember to remove the "current transition"
			this.destroyScene(this.currentTransition);
			this.currentTransition = null;
		});

		return this.mainScene; // resolve as soon as we have the scene created.
	}

	// #region orientation detection and response
	public setRotateScene(preferredOrientation: "portrait" | "landscape", newSceneClass: Constructor<IScene>, sceneParams?: any[]): void {
		this.preferredOrientation = preferredOrientation;
		if (this.lockScene) {
			this.lockScene.events.emit(SceneEvents.DESTROY);
			this.lockScene.onDestroy(null);
			this.destroyScene(this.lockScene);
		}

		this.lockScene = new newSceneClass(...sceneParams);
		this.lockScene.onResize(this.width, this.height);
		this.lockScene.events.emit(SceneEvents.START);
		this.lockScene.onStart();
	}

	private isOrientationCorect(): boolean {
		if (this.lockScene) {
			this.currentOrientation = this.width > this.height ? "landscape" : "portrait";

			return this.currentOrientation == this.preferredOrientation;
		}
		return true; // if no lockscreen, we are always correct :P
	}

	// #endregion

	// #region Popups
	/**
	 * Queues popup scene in a popup stack.
	 * When no popups are open, the top of the stack is poped and added to the screen.
	 * @param popupClass The popup scene to open
	 * @param [popupParams] In case your popup needs parameters, provide them here.
	 */
	public queuePopup<PopupCtor extends EmptyConstructor<IScene>>(popupClass: PopupCtor, popupParams?: null | undefined | []): void;
	public queuePopup<PopupCtor extends Constructor<IScene>>(popupClass: PopupCtor, popupParams: ConstructorParameters<typeof popupClass>): void;
	public queuePopup<PopupCtor extends Constructor<IScene>>(popupClass: PopupCtor, popupParams: ConstructorParameters<typeof popupClass> | null | undefined): void {
		// public queuePopup(popupClass: Constructor<IScene>, popupParams?: any[]): void {

		if (this.currentPopups.length > 0) {
			// queue it
			this.popupQueue.push(popupClass);
			this.popupQueueParams.push(popupParams ?? []);
		} else {
			// no need to queue, just show it.
			this.openPopup(popupClass, popupParams);
		}
	}

	public async openPopup(popupImportPromise: Promise<any>, popupParams?: any[], ignorePrevious?: boolean): Promise<IScene | null>;
	public async openPopup<PopupCtor extends EmptyConstructor<IScene>>(
		popupClass: PopupCtor,
		popupParams?: null | undefined | [],
		ignorePrevious?: boolean
	): Promise<InstanceType<PopupCtor> | null>;
	public async openPopup<PopupCtor extends Constructor<IScene>>(
		popupClass: PopupCtor,
		popupParams: ConstructorParameters<typeof popupClass>,
		ignorePrevious?: boolean
	): Promise<InstanceType<PopupCtor> | null>;
	public async openPopup<PopupCtor extends Constructor<IScene>>(
		popupClassOrPromise: PopupCtor | Promise<any>,
		popupParams: null | undefined | any[],
		ignorePrevious: boolean = true
	): Promise<InstanceType<PopupCtor> | null> {
		// public openPopup(popupClass: new (...args: any[]) => IScene, popupParams?: any[], ignorePrevious: boolean = true): IScene {
		if (ignorePrevious === false && this.currentPopups.length > 0) {
			// Another popup is open and we must not overlap, abort!
			return null;
		}

		let popupClass: Constructor<IScene> = undefined;
		if (popupClassOrPromise instanceof Promise) {
			popupClass = await this.extractSceneFromPromise(popupClassOrPromise);
		} else {
			popupClass = popupClassOrPromise as any;
		}

		// if we have dependencies (A.K.A packages) we wait for them. If we have `*` dependencies we wait for all of them.
		await this.loadAssetBundles(popupClass);

		// create the bad boy
		const newPopup = popupParams != null && popupParams != undefined ? new popupClass(...popupParams) : new popupClass();

		// tell itself that it was created
		newPopup.events.emit(SceneEvents.NEW);

		// tell all the scenes that a popup was opened
		for (const scene of this.currentScenes) {
			scene.onPopupOpen(newPopup, popupParams);
		}

		// tell the transition?
		this.currentTransition?.onPopupOpen(newPopup, popupParams);

		// tell the lockscene?!
		this.lockScene?.onPopupOpen(newPopup, popupParams);

		// tell the rest of the popups that we open a popup but BEFORE we add the new one
		for (const popup of this.currentPopups) {
			popup.onPopupOpen(newPopup, popupParams);
		}

		// Give the close handler before the show in case the show needs to close.
		newPopup.closeHandler = this.closePopup.bind(this, newPopup, popupClass);

		this.currentPopups.push(newPopup);
		newPopup.onResize(this.width, this.height);
		newPopup.events.emit(SceneEvents.START);
		newPopup.onStart();
		newPopup.events.emit(SceneEvents.SHOW);
		newPopup.onShow();
		return newPopup as InstanceType<PopupCtor>;
	}

	/**
	 * Closes a popup and notifies everybody.
	 * This function is binded and passed to every popup so they can close themselves.
	 * @param popup
	 * @param popupClass
	 */
	public closePopup(popup: IScene, popupClass?: Constructor<IScene>, lastWords?: any): void {
		if (!this.currentPopups.includes(popup)) {
			console.warn("You tried to close a popup that was not open! Did you call close twice?");
			return;
		}
		if (!popupClass) {
			popupClass = popup.constructor as any;
		}
		// notify the dead that he died
		popup.events.emit(SceneEvents.DESTROY);
		popup.onDestroy(null);
		// this `if` is REALLY redundant...
		if (this.currentPopups.includes(popup)) {
			// remove from the popup list
			this.currentPopups.splice(this.currentPopups.indexOf(popup), 1);
		}
		// Destroy the objects inside it
		this.destroyScene(popup);

		// Notify destruction to others
		for (const scene of this.currentScenes) {
			scene.onPopupClose(popupClass, lastWords);
		}
		this.currentTransition?.onPopupClose(popupClass, lastWords);
		this.lockScene?.onPopupClose(popupClass, lastWords);
		for (const popup of this.currentPopups) {
			popup.onPopupClose(popupClass, lastWords);
		}
	}

	/**
	 * Asks nicely a popup to close itself.
	 * @param popup The popup to close. This method allows to set a timeout or forceclose. Otherwise you can use the `requestClose` method from the popup itself.
	 * @param [options.timeout] Amount of miliseconds before deciding to force close the popup. Timeout without force is odd but possible, it will only forcefully terminate those popups that take too long to answer but will allow to live those that return false fast enough.
	 * @param [options.force] Should we ignore the return value of the popup's `requestClose`? (Should we forcefully close popups that say that they do not want to close?)
	 * @returns A promise that resolves with true when the popup is closed or with false when the popup refused to close.
	 */
	public async requestClosePopup(popup: IScene, options?: { timeout?: number; force?: boolean }): Promise<boolean> {
		const { timeout, force } = options ?? {};
		let closed: boolean;
		if (timeout) {
			const race = Promise.race([popup.requestClose(), new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), timeout))]);
			closed = await race.then((closed) => {
				if (typeof closed === "string") {
					this.closePopup(popup);
					return true;
				}
				return closed;
			});
		} else {
			closed = await popup.requestClose();
		}

		if (!closed && force) {
			this.closePopup(popup);
			return true;
		}

		return closed;
	}

	/**
	 * Asks nicely to all popups to close themselves.
	 * @param [options.timeout] Amount of miliseconds before deciding to force close the popup. Timeout without force is odd but possible, it will only forcefully terminate those popups that take too long to answer but will allow to live those that return false fast enough.
	 * @param [options.force] Should we ignore the return value of the popup's `requestClose`? (Should we forcefully close popups that say that they do not want to close?)
	 * @returns A promise with the array of the popup responses to your request.
	 */
	public requestCloseAllPopups(options?: { timeout?: number; force?: boolean }): Promise<boolean[]> {
		return Promise.all(this.currentPopups.map((popup) => this.requestClosePopup(popup, options)));
	}
	public closeAllPopups(): void {
		let i = this.currentPopups.length;
		while (i-- > 0) {
			this.closePopup(this.currentPopups[i]);
		}
	}
	// #endregion

	// #region Stacking Modal Scenes

	public async openScene(
		sceneImportPromise: Promise<any>,
		options?: {
			sceneParams?: any[];
			skipShowCall?: boolean;
			onBundleDownloadProgress?: (progress: number, bundlesProgress: Record<string, number>) => void;
		}
	): Promise<IScene>;
	public async openScene<SceneCtor extends Constructor<IScene>>(
		sceneClass: SceneCtor,
		options?: {
			sceneParams?: ConstructorParameters<typeof sceneClass>;
			skipShowCall?: boolean;
			onBundleDownloadProgress?: (progress: number, bundlesProgress: Record<string, number>) => void;
		}
	): Promise<InstanceType<SceneCtor>>;
	public async openScene<SceneCtor extends Constructor<IScene>>(
		sceneClassOrPromise: SceneCtor | Promise<any>,
		options?: {
			sceneParams?: any[];
			skipShowCall?: boolean;
			onBundleDownloadProgress?: (progress: number, bundlesProgress: Record<string, number>) => void;
		}
	): Promise<InstanceType<SceneCtor>> {
		// load default options
		const { sceneParams, skipShowCall, onBundleDownloadProgress } = options || {};

		let sceneClass: Constructor<IScene> = undefined;
		if (sceneClassOrPromise instanceof Promise) {
			sceneClass = await this.extractSceneFromPromise(sceneClassOrPromise);
		} else {
			sceneClass = sceneClassOrPromise as any;
		}

		// if we have dependencies (A.K.A packages) we wait for them. If we have `*` dependencies we wait for all of them.
		await this.loadAssetBundles(sceneClass, onBundleDownloadProgress);

		// create the bad boy
		const newScene = sceneParams != null && sceneParams != undefined ? new sceneClass(...sceneParams) : new sceneClass();

		// tell itself that it was created
		newScene.events.emit(SceneEvents.NEW);

		// tell all the scenes that a modal was opened
		for (const scene of this.currentScenes) {
			scene.onSceneOpen(newScene, sceneParams);
		}

		// tell the transition?
		this.currentTransition?.onSceneOpen(newScene, sceneParams);

		// tell the lockscene?!
		this.lockScene?.onSceneOpen(newScene, sceneParams);

		// tell the popups we have a new modal
		for (const popup of this.currentPopups) {
			popup.onSceneOpen(newScene, sceneParams);
		}

		// Give the close handler before the show in case the show needs to close.
		newScene.closeHandler = this.closeScene.bind(this, newScene, sceneClass);

		// add it to the scenes array
		this.currentScenes.push(newScene);
		newScene.onResize(this.width, this.height);
		newScene.events.emit(SceneEvents.START);
		newScene.onStart();
		// safeguard in case we are doing a changescene and the "show" shouldn't be here!
		if (!skipShowCall) {
			newScene.events.emit(SceneEvents.SHOW);
			newScene.onShow();
		}
		return newScene as InstanceType<SceneCtor>;
	}

	/**
	 * Closes a nodal scene and notifies everybody.
	 * This function is binded and passed to every popup so they can close themselves.
	 * @param scene
	 * @param sceneClass
	 */
	public closeScene<Scene extends IScene>(this: SceneManager<R>, scene: Scene, sceneClass?: Constructor<Scene> | null, lastWords?: any): void {
		if (!this.currentScenes.includes(scene)) {
			console.warn("You tried to close a scene that was not open! Did you call close twice?");
			return;
		}
		if (sceneClass == null || sceneClass == undefined) {
			sceneClass = scene.constructor as Constructor<Scene>;
		}
		// notify the dead that he died
		scene.events.emit(SceneEvents.DESTROY);
		scene.onDestroy(null);
		// this `if` is REALLY redundant...
		if (this.currentScenes.includes(scene)) {
			// remove from the popup list
			this.currentScenes.splice(this.currentScenes.indexOf(scene), 1);
		}
		// Destroy the objects inside it
		this.destroyScene(scene);

		// Notify destruction to others
		for (const scene of this.currentScenes) {
			scene.onSceneClose(sceneClass, lastWords);
		}
		this.currentTransition?.onSceneClose(sceneClass, lastWords);
		this.lockScene?.onSceneClose(sceneClass, lastWords);
		for (const popup of this.currentPopups) {
			popup.onSceneClose(sceneClass, lastWords);
		}
	}

	/**
	 * Asks nicely a scene to close itself.
	 * @param scene The scene to close. This method allows to set a timeout or forceclose. Otherwise you can use the `requestClose` method from the scene itself.
	 * @param [options.timeout] Amount of miliseconds before deciding to force close the scene. Timeout without force is odd but possible, it will only forcefully terminate those scenes that take too long to answer but will allow to live those that return false fast enough.
	 * @param [options.force] Should we ignore the return value of the scene's `requestClose`? (Should we forcefully close scenes that say that they do not want to close?)
	 * @returns A promise that resolves with true when the scene is closed or with false when the scene refused to close.
	 */
	public async requestCloseScene(scene: IScene, options?: { timeout?: number; force?: boolean }): Promise<boolean> {
		const { timeout, force } = options ?? {};
		let closed: boolean;
		if (timeout) {
			const race = Promise.race([scene.requestClose(), new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), timeout))]);
			closed = await race.then((closed) => {
				if (typeof closed === "string") {
					this.closeScene(scene);
					return true;
				}
				return closed;
			});
		} else {
			closed = await scene.requestClose();
		}

		if (!closed && force) {
			this.closeScene(scene);
			return true;
		}

		return closed;
	}

	/**
	 * Asks nicely to all scenes to close themselves.
	 * @param [options.timeout] Amount of miliseconds before deciding to force close the scene. Timeout without force is odd but possible, it will only forcefully terminate those scenes that take too long to answer but will allow to live those that return false fast enough.
	 * @param [options.force] Should we ignore the return value of the scene's `requestClose`? (Should we forcefully close scenes that say that they do not want to close?)
	 * @returns A promise with the array of the scene responses to your request.
	 */
	public requestCloseAllscenes(options?: { timeout?: number; force?: boolean }): Promise<boolean[]> {
		return Promise.all(this.currentScenes.map((scene) => this.requestCloseScene(scene, options)));
	}

	public closeAllScenes(): void {
		let i = this.currentScenes.length;
		while (i-- > 0) {
			this.closeScene(this.currentScenes[i]);
		}
	}
	// #endregion

	// #region EventHandlers

	public resize(w: number, h: number, devicePixelRatio?: number): void {
		this.sceneRenderer.resize(w, h, devicePixelRatio);

		// tell all the scenes that the screen resized
		for (const scene of this.currentScenes) {
			scene.onResize(w, h);
		}

		// tell the transition?
		this.currentTransition?.onResize(w, h);

		// tell the lockscene?!
		this.lockScene?.onResize(w, h);

		// tell the popups the screen resized
		for (const popup of this.currentPopups) {
			popup.onResize(w, h);
		}
	}

	/**
	 * The update loop
	 */
	private update(): void {
		//* Updating stuff

		let startTimestamp: number = 0;
		let renderStartTimestamp: number = 0;
		if (STATS) {
			this.stats?.begin();
			startTimestamp = (performance || Date).now();
		}

		// fabricate the DT
		const dt = this.ticker.deltaMS;

		// update the tween engine
		if (!this.pauseGlobalTweenOnFocusLost || this.hasFocus) {
			Group.shared.update(dt);
		}

		// Update the scenes and popups and stuff
		// tell all the scenes that we update
		for (const scene of this.currentScenes) {
			if (!scene.pauseUpdateOnFocusLost || this.hasFocus) {
				scene.update(dt);
			}
			if (!scene.pauseTweenOnFocusLost || this.hasFocus) {
				scene.tweens.update(dt);
			}
		}

		// tell the transition?
		if (!this.currentTransition?.pauseUpdateOnFocusLost || this.hasFocus) {
			this.currentTransition?.update(dt);
		}
		if (!this.currentTransition?.pauseTweenOnFocusLost || this.hasFocus) {
			this.currentTransition?.tweens?.update(dt);
		}

		// tell the lockscene?!
		if (!this.lockScene?.pauseUpdateOnFocusLost || this.hasFocus) {
			this.lockScene?.update(dt);
		}
		if (!this.lockScene?.pauseTweenOnFocusLost || this.hasFocus) {
			this.lockScene?.tweens?.update(dt);
		}

		// tell the popups that we update
		for (const popup of this.currentPopups) {
			if (!popup.pauseUpdateOnFocusLost || this.hasFocus) {
				popup.update(dt);
			}
			if (!popup.pauseTweenOnFocusLost || this.hasFocus) {
				popup.tweens.update(dt);
			}
		}

		if (STATS) {
			renderStartTimestamp = (performance || Date).now();
		}

		this.render();

		if (STATS) {
			this.stats?.end();
			const renderEndTimestamp = (performance || Date).now();

			const frameTime = renderEndTimestamp - startTimestamp;
			const renderTime = renderEndTimestamp - renderStartTimestamp;
			const updateTimeFactor = (frameTime - renderTime) / frameTime;

			this.updateTimeStats.update(Math.round(updateTimeFactor * 100), 100);
		}
	}

	private render(): void {
		// calls all the rendering methods

		if (this.sceneRenderer.preRender) {
			this.sceneRenderer.preRender();
		}

		// sort the scenes
		this.currentScenes = stableSort(this.currentScenes, (sA, sZ) => (sA.index ?? 0) - (sZ.index ?? 0));
		// send them to the renderer!
		this.currentScenes.forEach(this.sceneRenderer.renderScene.bind(this.sceneRenderer));

		// now the transition...
		if (this.currentTransition) {
			this.sceneRenderer.renderScene(this.currentTransition);
		}

		// now the popups! (soooort them)
		this.currentPopups = stableSort(this.currentPopups, (sA, sZ) => (sA.index ?? 0) - (sZ.index ?? 0));
		// send them to the renderer!
		this.currentPopups.forEach(this.sceneRenderer.renderScene.bind(this.sceneRenderer));

		// now... do I need the orientation fixer?
		if (!this.isOrientationCorect()) {
			// orientation is NOT correct. I must render nag screen!
			this.sceneRenderer.renderScene(this.lockScene);
		}

		if (this.sceneRenderer.postRender) {
			this.sceneRenderer.postRender();
		}
	}

	private focus(): void {
		this.hasFocus = true;

		if (this.pauseSoundOnFocusLost) {
			if ((sound as any)._context.muted) {
				sound.unmuteAll();
			}
		}

		// tell all the scenes that we got focus
		for (const scene of this.currentScenes) {
			scene.onFocus();
		}

		// tell the transition?
		this.currentTransition?.onFocus();

		// tell the lockscene?!
		this.lockScene?.onFocus();

		// tell the popups that we got focus
		for (const popup of this.currentPopups) {
			popup.onFocus();
		}
	}
	private focusLost(): void {
		this.hasFocus = false;
		if (this.pauseSoundOnFocusLost) {
			if (!(sound as any)._context.muted) {
				sound.muteAll();
			}
		}

		// tell all the scenes that we lost focus
		for (const scene of this.currentScenes) {
			scene.onFocusLost();
		}

		// tell the transition?
		this.currentTransition?.onFocusLost();

		// tell the lockscene?!
		this.lockScene?.onFocusLost();

		// tell the popups that we lost focus
		for (const popup of this.currentPopups) {
			popup.onFocusLost();
		}
	}

	private postMessage(message: any): void {
		// tell all the scenes that a message came through
		for (const scene of this.currentScenes) {
			scene.onMessage(message);
		}

		// tell the transition?
		this.currentTransition?.onMessage(message);

		// tell the lockscene?!
		this.lockScene?.onMessage(message);

		// tell the popups a message came through
		for (const popup of this.currentPopups) {
			popup.onMessage(message);
		}
	}

	public externalPause(): void {
		console.log("Paused");

		// pause the safe way
		if (!(sound as any)._context.paused) {
			sound.pauseAll();
		}

		if (this.sceneRenderer.externalPause) {
			this.sceneRenderer.externalPause();
		}

		// tell all the scenes that we are in pause
		for (const scene of this.currentScenes) {
			scene.onPause();
		}

		// tell the transition?
		this.currentTransition?.onPause();

		// tell the lockscene?!
		this.lockScene?.onPause();

		// tell the popups we are in pause
		for (const popup of this.currentPopups) {
			popup.onPause();
		}
	}
	public externalResume(): void {
		console.log("Resumed");

		if (this.sceneRenderer.externalResume) {
			this.sceneRenderer.externalResume();
		}

		// resume sounds, the safe way
		if ((sound as any)._context.paused) {
			sound.resumeAll();
		}

		// tell all the scenes that we resume
		for (const scene of this.currentScenes) {
			scene.onResume();
		}

		// tell the transition?
		this.currentTransition?.onResume();

		// tell the lockscene?!
		this.lockScene?.onResume();

		// tell the popups we resume
		for (const popup of this.currentPopups) {
			popup.onResume();
		}
	}
	// #endregion

	// #region Auxiliar Scene Handling funcions
	/**
	 * Auxiliar function that loops all the stages inside a scene and kills them.
	 * @param sceneToDestroy
	 */
	private destroyScene(sceneToDestroy: IScene): void {
		sceneToDestroy.closeHandler = () => {};
		sceneToDestroy.destroy();
	}
	/** Sets the default transition for the {@link changeScene} method */
	public setDefaultTransition<TransCtor extends EmptyConstructor<ITransition>>(transitionClass: TransCtor, transitionParams?: null | undefined | []): void;
	public setDefaultTransition<TransCtor extends Constructor<ITransition>>(transitionClass: TransCtor, transitionParams: ConstructorParameters<typeof transitionClass>): void;
	public setDefaultTransition<TransCtor extends Constructor<ITransition>>(transitionClass: TransCtor, transitionParams?: ConstructorParameters<typeof transitionClass>): void {
		this.defaultTransition = transitionClass;
		this.defaultTransitionParams = transitionParams ?? [];
	}
	// #endregion

	// #region Auxiliar import promise function
	private async extractSceneFromPromise(scenePromise: Promise<any>): Promise<any> {
		const pkg = await scenePromise;
		for (const key in pkg) {
			if (key.toLowerCase().includes("scene")) {
				return pkg[key];
			}
		}
		throw new Error("Could not find a scene in the package");
	}

	// #endregion

	// #region Asset bundle loading
	private async loadAssetBundles(sceneClass: any, onProgress?: (progress: number, bundlesProgress: Record<string, number>) => void, isTransition?: boolean): Promise<any> {
		await this.initializedAssets;
		if (sceneClass.BUNDLES) {
			if (isTransition) {
				console.warn(
					`Bundles found for transition ${String(sceneClass.name)}\nThis isn't wrong, but remember that you cant put a loading transition on your loading transition`,
					sceneClass
				);
			}

			let totalProgress = 0;
			let bundles: string[] = sceneClass.BUNDLES;
			if (bundles.includes("*")) {
				bundles = Object.keys((Assets.resolver as any)._bundles);
			}

			const bundleProgress: Record<string, number> = {};
			bundles.forEach((bundleName) => (bundleProgress[bundleName] = 0));
			const bundlesPromises: Promise<unknown>[] = [];

			for (const bundle of bundles) {
				bundlesPromises.push(
					Assets.loadBundle(bundle, (progress) => {
						if (onProgress) {
							totalProgress += progress;
							bundleProgress[bundle] = progress;
							onProgress(totalProgress / bundles.length, bundleProgress);
						}
					})
				);
			}
			await Promise.all(bundlesPromises);
		} else {
			if (!isTransition) {
				console.warn(
					`No bundles found for scene ${String(sceneClass.name)}, Did you forget the public static readonly BUNDLES: string[] = ["bundleNameHere"] ?`,
					sceneClass
				);
			}
		}
	}

	private async initAssets(): Promise<void> {
		Assets.init({
			defaultSearchParams: { v: BUILD_DATE },
		});
		const [manifest, atlases] = await Promise.all([Assets.load("./assets.json"), Assets.load("./atlas/autoPackedAtlas.json")]);

		for (const atlas of atlases) {
			const atlasAssetName: string = `ATLAS:${atlas.name as string}`;
			const bundle = manifest.bundles.find((b: any) => b.name == atlas.name);
			if (bundle) {
				if (Array.isArray(bundle.assets)) {
					bundle.assets.push({ name: atlasAssetName, srcs: atlas.url });
				} else {
					bundle.assets[atlasAssetName] = atlas.url;
				}
			} else {
				manifest.bundles.push({ name: atlas.name, assets: { [atlasAssetName]: atlas.url } });
			}
		}

		Assets.reset();
		await Assets.init({
			manifest: manifest,
			defaultSearchParams: { v: BUILD_DATE }, // Waiting for pixijs release for this better cachebusting.
		});

		await Assets.loadBundle("initialLoad");
	}
	// #endregion
}
