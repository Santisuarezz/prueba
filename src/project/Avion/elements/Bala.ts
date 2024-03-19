import { Sprite } from "pixi.js";
import { Container } from "pixi.js";
import { Tween } from "tweedle.js";

export class Bala extends Container {
	public body: Sprite;
	constructor(xTarget: number) {
		super();
		this.body = Sprite.from("balas");
		this.addChild(this.body);
		this.body.tint = 0x003aff;

		new Tween(this.body)
			.to({ x: xTarget }, 2000)
			.start()
			.onComplete(() => {
				this.destroy();
			});
	}
}
