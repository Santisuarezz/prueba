import { Container, Graphics } from "pixi.js";
import { Tween } from "tweedle.js";

export class Bala extends Container {
	constructor(xTarget: number) {
		super();
		const balaGraph: Graphics = new Graphics();
		balaGraph.beginFill(0x403c46);
		balaGraph.drawCircle(0, 0, 10);
		this.addChild(balaGraph);

		new Tween(balaGraph)
			.to({ x: xTarget }, 2000)
			.start()
			.onComplete(() => {
				this.destroy();
			});
	}
}
