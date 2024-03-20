import { Container, Graphics } from "pixi.js";

export class Espadachin extends Container {
	constructor() {
		super();

		const espadachin: Graphics = new Graphics();
		espadachin.beginFill(0x3dff58);
		espadachin.drawRect(0, 0, 40, 40);
		this.addChild(espadachin);
	}
}
