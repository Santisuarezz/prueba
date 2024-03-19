import { Container, Graphics } from "pixi.js";

export class Enemy extends Container {
	public body: Graphics = new Graphics();
	constructor() {
		super();

		const body: Graphics = new Graphics();
		body.beginFill(0xff0000);
		body.drawRect(0, 0, 65, 50);

		this.addChild(body);

		// una public que sea moviendose, una funcion publica que sea moverse a
	}
	public enemyUpdate(): void {
		// que se de cuenta de la
	}
	public getHit(): void {
		this.destroy();
	}
}
