import { Container, Graphics, Text } from "pixi.js";

export class Dice extends Container {
	constructor(color: number) {
		super();

		const diceSize = 200;

		const background: Graphics = new Graphics();
		background.beginFill(color);
		background.drawRoundedRect(-diceSize / 2, -diceSize / 2, diceSize, diceSize, diceSize * 0.1);
		background.eventMode = "static";
		background.on("pointertap", () => {
			number.text = this.roll();
		});
		background.on("pointerover", () => {
			console.log("over");
		});
		background.on("pointerout", () => {
			console.log("out");
		});
		this.addChild(background);

		const number: Text = new Text(6, { fontSize: 75, align: "center" });
		background.addChild(number);
		number.anchor.set(0.5);
	}
	private roll(): number {
		return Math.floor(Math.random() * 6) + 1;
	}
}
