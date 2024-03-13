import { Container, Graphics } from "pixi.js";

export class Enemy extends Container {
	constructor() {
		super();

		const enemya: Graphics = new Graphics();
		enemya.beginFill(0x386ddf);
		enemya.drawRect(0, 500, 40, 40);

		this.addChild(enemya);
	}
}
