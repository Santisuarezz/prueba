import { Easing, Tween } from "tweedle.js";
import { Graphics } from "pixi.js";
import { TransitionBase } from "./TransitionBase";
import { TweenUtils } from "../../tweens/tweenUtils";
import type { ResolveOverride } from "../ITransition";

export class FadeColorTransition extends TransitionBase {
	private readonly color: number;
	private readonly fadeInTime: number;
	private readonly fadeOutTime: number;
	private readonly fade: Graphics;
	public constructor(color: number = 0x0, fadeInTime: number = 500, fadeOutTime: number = 500) {
		super();
		this.color = color;
		this.fadeInTime = fadeInTime;
		this.fadeOutTime = fadeOutTime;
		this.fade = new Graphics();
		this.fade.interactive = true;
		this.fade.alpha = 0;
		this.addChild(this.fade);
	}

	public override startCovering(): Promise<void> {
		const directingTween = new Tween(this.fade, this.tweens).to({ alpha: 1 }, this.fadeInTime).easing(Easing.Linear.None).start();
		return TweenUtils.promisify(directingTween).then(); // Then converts the promise to a void promise.
	}
	public override startResolving(): Promise<ResolveOverride> {
		return Promise.resolve(undefined);
	}
	public override startUncovering(): Promise<void> {
		const directingTween = new Tween(this.fade, this.tweens).to({ alpha: 0 }, this.fadeOutTime).easing(Easing.Linear.None).start();
		return TweenUtils.promisify(directingTween).then(); // Then converts the
	}

	public override onResize(w: number, h: number): void {
		this.fade.clear();
		this.fade.beginFill(this.color, 1);
		this.fade.drawRect(0, 0, w, h);
		this.fade.endFill();
	}
}
