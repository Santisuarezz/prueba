import { Graphics, Sprite } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";
import { Keyboard } from "../../engine/input/Keyboard";
import { Key } from "../../engine/input/Key";

export class DuckScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];

	private kratos;
	private menu;

	constructor() {
		super();
		this.kratos = Sprite.from("kratos");
		this.addChild(this.kratos);

		this.menu = Sprite.from("menu");
		this.menu.eventMode = "static";
		this.menu.cursor = "pointer";
		this.menu.on("pointertap", () => {
			console.log("tap");

			this.menu.tint = 0xff00ff;
		});
		this.addChild(this.menu);

		const deltaWalk = 2;
		const deltaRun = 5;
		let isRunning = false;

		const keyboard = new Keyboard();
		keyboard.pressed.on(Key.KEY_Z, () => {
			isRunning = !isRunning;

			if (isRunning) {
				console.log("running");
			} else {
				console.log("walking");
			}
		});
		keyboard.pressed.on(Key.KEY_D, () => {
			if (isRunning) {
				character.x += deltaRun;
			} else {
				character.x += deltaWalk;
			}
		});
		keyboard.pressed.on(Key.KEY_A, () => {
			if (isRunning) {
				character.x -= deltaRun;
			} else {
				character.x -= deltaWalk;
			}
		});
		keyboard.pressed.on(Key.KEY_S, () => {
			if (isRunning) {
				character.y += deltaRun;
			} else {
				character.y += deltaWalk;
			}
		});
		keyboard.pressed.on(Key.KEY_W, () => {
			if (isRunning) {
				character.y -= deltaRun;
			} else {
				character.y -= deltaWalk;
			}
		});

		const character: Graphics = new Graphics();
		character.beginFill(0x386ddf);
		character.drawRect(0, 0, 200, 200);

		this.addChild(character);

		// this.cuadrado = Sprite.from("cuadrado");
		// this.addChild(this.cuadrado);
		// this.cuadrado.position.set(0, 400);
		// this.cuadrado.width = 400;
		// this.cuadrado.scale.y = this.cuadrado.scale.x;

		// const dice = new Dice(0xeff1b7);
		// dice.position.set(Manager.width / 2, Manager.height * 0.4);

		// this.addChild(dice);

		// myGraph.position.set(1024 / 2, 768 / 2);
		// this.addChild(myGraph);

		// const myText: Text = new Text("asdasdasd", { fontSize: 108, fill: 0xff0000 });
		// myText.position.x = 0;
		// myText.position.y = 300;
		// myText.angle = 45;
		// myText.scale.set(3);

		// this.kratos.addChild(myText);
		// const enderButton = new EnderButton();
		// enderButton.position.set(Manager.width / 2, Manager.height * 0.4);

		// this.addChild(enderButton);
	}

	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.kratos, _newW, _newH, 1, 1);
	}

	public override update(dt: number): void {
		dt;
	}
}
