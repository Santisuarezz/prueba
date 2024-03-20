import { Container, Graphics } from "pixi.js";

export class Enemigo extends Container {
	constructor() {
		super();

		const enemigo: Graphics = new Graphics();
		enemigo.beginFill(0xff0000);
		enemigo.drawRect(0, 0, 40, 40);
		this.addChild(enemigo);
	}
}
