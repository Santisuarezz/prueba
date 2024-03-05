import { Container, Sprite } from "pixi.js";
import { Keyboard } from "../../engine/input/Keyboard";
import { Key } from "../../engine/input/Key";
export class Settingsb extends Container {
	constructor() {
		super();

		const asdasd: Sprite = Sprite.from("menu");

		this.addChild(asdasd);
		const keyboard = new Keyboard();
		keyboard.pressed.on(Key.KEY_W, () => {});

		console.log("apreto w");
	}
}
