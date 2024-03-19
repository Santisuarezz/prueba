import { Sprite } from "pixi.js";
import { Container } from "pixi.js";
import { Tween } from "tweedle.js";

export class Bala extends Container {
	private bala: Sprite;
	constructor(xTarget: number) {
		super();
		this.bala = Sprite.from("balas");
		this.addChild(this.bala);

		new Tween(this.bala)
			.to({ x: xTarget }, 2000)
			.start()
			.onComplete(() => {
				this.destroy();
			});
	}
}
