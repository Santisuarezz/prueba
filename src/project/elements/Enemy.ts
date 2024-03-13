import { Container, Graphics } from "pixi.js";

export class Enemy extends Container {
	private enemyw: Graphics;
	constructor() {
		super();

		const body: Graphics = new Graphics();
		body.beginFill(0xe32409);
		body.drawRect(-20, -20, 40, 40);

		this.addChild(body);

		this.enemyw = new Graphics();
		this.enemyw.beginFill(0xe36609);
		this.enemyw.drawRect(0, 0, 50, 10);

		this.addChild(this.enemyw);
	}
	public aim(character: { x: number; y: number }): void {
		this.rotation = Math.atan2(character.y - this.y, character.y - this.x);
	}
}
