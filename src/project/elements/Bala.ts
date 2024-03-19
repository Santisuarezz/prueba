import { Container, Sprite } from "pixi.js";
import { Tween } from "tweedle.js";

export class Bala extends Container {
	private bala: Sprite = Sprite.from(balas);
	constructor(xTarget: number) {
		super();

		this.addChild(this.bala);

		new Tween(balaGraph)
			.to({ x: xTarget }, 2000)
			.start()
			.onComplete(() => {
				this.destroy();
			});
	}
}
