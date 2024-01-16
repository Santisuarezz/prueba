import { Easing, Tween } from "tweedle.js";
import { Graphics } from "pixi.js";
import { TransitionBase } from "./TransitionBase";
import type { ResolveOverride } from "../ITransition";
import { TweenUtils } from "../../tweens/tweenUtils";

export class LoadingTransition extends TransitionBase {
	private readonly color: number;
	private readonly fadeInTime: number;
	private readonly fadeOutTime: number;
	private readonly fade: Graphics;

	public constructor() {
		super();
		this.fade = new Graphics();
		this.fade.interactive = true;
		this.fade.alpha = 0;

		this.addChild(this.fade);

		console.log("I EXISTS!");
	}

	public override startCovering(): Promise<void> {
		const directingTween = new Tween(this.fade, this.tweens).to({ alpha: 1 }, this.fadeInTime).easing(Easing.Linear.None).start();
		return TweenUtils.promisify(directingTween).then(); // then converts the promise to a void promise.
	}
	public override startResolving(): Promise<ResolveOverride> {
		return Promise.resolve(undefined);
	}
	public override startUncovering(): Promise<void> {
		this.tweens.removeAll();
		const directingTween = new Tween(this.fade, this.tweens).to({ alpha: 0 }, this.fadeOutTime).easing(Easing.Linear.None).start();
		return TweenUtils.promisify(directingTween).then(); // then converts the promise to a void promise.
	}

	public override onResize(w: number, h: number): void {
		this.fade.clear();
		this.fade.beginFill(this.color, 1);
		this.fade.drawRect(0, 0, w, h);
		this.fade.endFill();
	}
}
