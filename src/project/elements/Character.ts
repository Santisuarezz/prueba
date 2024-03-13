import { Container, Graphics } from "pixi.js";
import { Manager } from "../..";

type Direction = "up" | "down" | "right" | "left";

export class Character extends Container {
	public runSpeed = 5; // Son public por si las quiere usar Ducksene (o la escena padre)
	public walkSpeed = 2;

	public isRunning = false;

	constructor() {
		super();

		const character: Graphics = new Graphics();
		character.beginFill(0x386ddf);
		character.drawRect(0, 0, 100, 100);

		this.addChild(character);
	}

	public moveTo(direction: Direction): void {
		let deltaMove;
		if (this.isRunning) {
			deltaMove = this.runSpeed;
		} else {
			deltaMove = this.walkSpeed;
		}

		if (direction == "up") {
			this.y = this.y - deltaMove;
		}
		if (direction == "down") {
			this.y = this.y + deltaMove;
		}
		if (direction == "right") {
			this.x = this.x + deltaMove;
		}
		if (direction == "left") {
			this.x = this.x - deltaMove;
			if (this.x < 0) {
				return;
			}
			// que no se pase 0
		}

		// Aprender switch a futuro
	}
}
