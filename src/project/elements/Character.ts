import { Container, Graphics } from "pixi.js";
import { Manager } from "../..";

type Direction = "up" | "down" | "right" | "left";

export class Character extends Container {
	public runSpeed: number = 5; // Son public por si las quiere usar Ducksene (o la escena padre)
	public walkSpeed: number = 2;
	private weapon: Graphics;

	public isRunning: boolean = false;

	constructor() {
		super();

		const character: Graphics = new Graphics();
		character.beginFill(0x386ddf);
		character.drawRect(-20, -20, 40, 40);
		this.addChild(character);

		this.weapon = new Graphics();
		this.weapon.beginFill(0x0000ff);
		this.weapon.drawRect(0, 0, 50, 10);
		this.addChild(this.weapon);
	}

	public aim(secondPoint: { x: number; y: number }): void {
		this.rotation = Math.atan2(secondPoint.y - this.y, secondPoint.x - this.x);
		console.log(this.rotation);
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
			if (this.y < 0) {
				this.y = 0;
			}
		}
		if (direction == "down") {
			this.y = this.y + deltaMove;
			if (this.y > Manager.height - this.height) {
				this.y = Manager.height - this.height;
			}
		}
		if (direction == "right") {
			this.x = this.x + deltaMove;
			if (this.x > Manager.width - this.width) {
				this.x = Manager.width - this.width;
			}
			// que no se pase el ancho de pantalla
		}
		if (direction == "left") {
			this.x = this.x - deltaMove;
			if (this.x < 0) {
				this.x = 0;
			}
			// que no se pase 0
		}

		// Aprender switch a futuro
	}
}
