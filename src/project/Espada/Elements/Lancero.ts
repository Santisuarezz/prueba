import { Container, Graphics } from "pixi.js";

export class Lancero extends Container {
	constructor() {
		super();
		const lancero: Graphics = new Graphics();
		lancero.beginFill(0x3dffcd);
		lancero.drawRect(0, 0, 30, 60);
		this.addChild(lancero);
	}
}
