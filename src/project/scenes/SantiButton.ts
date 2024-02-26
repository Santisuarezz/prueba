import { Container, Graphics } from "pixi.js";

export class SantiButton extends Container {
	constructor(callback: Function, color: number) {
		super();

		const myGraph: Graphics = new Graphics();
		myGraph.beginFill(color);
		myGraph.drawRect(-200, -50, 400, 100);
		myGraph.eventMode = "static";
		myGraph.on("pointertap", () => {
			callback();
		});
		myGraph.on("pointerover", () => {
			console.log("over");
		});
		myGraph.on("pointerout", () => {
			console.log("out");
		});
		this.addChild(myGraph);
	}
}
