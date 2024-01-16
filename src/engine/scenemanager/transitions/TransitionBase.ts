import { PixiScene } from "../scenes/PixiScene";
import type { ITransition, ResolveOverride } from "./../ITransition";

export class TransitionBase extends PixiScene implements ITransition {
	public constructor() {
		super();
	}
	public startCovering(): Promise<void> {
		return Promise.resolve();
	}
	public startResolving(): Promise<ResolveOverride> {
		return Promise.resolve(undefined);
	}
	public startUncovering(): Promise<void> {
		return Promise.resolve();
	}

	public onDownloadProgress(_progress: number, _bundlesProgress: Record<string, number>): void {
		// Nothing to do here.
	}
}
