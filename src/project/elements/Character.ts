import { Container, Graphics } from "pixi.js";

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

		switch (direction) {
			case "up":
				this.y -= deltaMove;
				break;
			case "down":
				this.y += deltaMove;
				break;
			case "right":
				this.x += deltaMove;
				break;
			case "left":
				this.x -= deltaMove;
				break;
		}
	}
}
