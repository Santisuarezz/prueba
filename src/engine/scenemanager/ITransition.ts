import type { IScene } from "./IScene";
import type { Constructor } from "./SceneManager";

export interface ITransition extends IScene {
	startCovering(): Promise<void>;
	startResolving(): Promise<ResolveOverride>;
	startUncovering(): Promise<void>;
	onDownloadProgress(progress: number, bundlesProgress: Record<string, number>): void;
}

export type ResolveOverride = { overrideScene?: Constructor<IScene> | Promise<any>; overrideSceneParams?: any };
