import { Easing, Tween } from "tweedle.js";
import { Graphics } from "pixi.js";
import { PixiScene } from "./PixiScene";

/**
 * Super simple popup that shows a spinning thingy while a promise is pending.
 * Useful for scenes or popups or any other fetch related stuff.
 * It waits a bit before showing itself, so if the promise resolves quickly, it won't even show.
 * this also blocks the inputs, so you can't click anything while it's open.
 */
export class PromiseWaitingPopup extends PixiScene {
	private readonly fade: Graphics;
	public constructor(promise: Promise<unknown> | Promise<unknown>[]) {
		super();
		this.fade = new Graphics();
		this.fade.interactive = true;
		this.fade.alpha = 0;

		this.addChild(this.fade);

		if (!Array.isArray(promise)) {
			promise = [promise];
		}

		Promise.all(promise).finally(() => this.closeHandler);
	}

	public override onStart(): void {
		new Tween(this.fade, this.tweens).to({ alpha: 0.5 }, 100).delay(50).easing(Easing.Linear.None).start();
	}

	public override onResize(w: number, h: number): void {
		this.fade.clear();
		this.fade.beginFill(0x000011, 1);
		this.fade.drawRect(0, 0, w, h);
		this.fade.endFill();
	}
}
