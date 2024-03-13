import { Container, Graphics } from "pixi.js";
import { Manager } from "../..";

export class EnderButton extends Container {
	constructor() {
		super();

		const cuadrao: Graphics = new Graphics();
		cuadrao.beginFill(0xc6c6c6);
		cuadrao.drawRect(0, 0, 200, 200);
		cuadrao.eventMode = "static";
		cuadrao.on("pointerdown", () => {
			let randomX = Manager.width * Math.random();
			let randomY = Manager.height * Math.random();
			if (randomX >= Manager.width - cuadrao.width) {
				randomX = Manager.width - cuadrao.width;
			}
			if (randomY >= Manager.height - cuadrao.height) {
				randomY = Manager.height - cuadrao.height;
			}
			cuadrao.position.set(randomX, randomY);
			console.log();
		});

		this.addChild(cuadrao);
	}
}
