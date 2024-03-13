import type { FederatedPointerEvent } from "pixi.js";
import { Sprite } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";
import { Keyboard } from "../../engine/input/Keyboard";
import { Key } from "../../engine/input/Key";
import { Character } from "../elements/Character";
import { Enemy } from "../elements/Enemy";

export class DuckScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];

	private kratos;
	private menu;
	private enemy: Enemy;

	private keybinds: Keyboard;
	private playerCharacter: Character;

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

		this.enemy = new Enemy();
		this.enemy.position.set(500);
		this.addChild(this.enemy);

		this.playerCharacter = new Character();
		this.addChild(this.playerCharacter);

		this.eventMode = "static";
		this.on("globalmousemove", (e: FederatedPointerEvent) => {
			this.playerCharacter.aim(e.global);
		});

		this.keybinds = new Keyboard();
	}
	public override update(_dt: number): void {
		if (this.keybinds.isDown(Key.KEY_D) || this.keybinds.isDown("ArrowRight")) {
			this.playerCharacter.moveTo("right");
		}
		if (this.keybinds.isDown(Key.KEY_A) || this.keybinds.isDown("ArrowLeft")) {
			this.playerCharacter.moveTo("left");
		}
		if (this.keybinds.isDown(Key.KEY_W) || this.keybinds.isDown("ArrowUp")) {
			this.playerCharacter.moveTo("up");
		}
		if (this.keybinds.isDown(Key.KEY_S) || this.keybinds.isDown("ArrowDown")) {
			this.playerCharacter.moveTo("down");
		}
		this.playerCharacter.isRunning = this.keybinds.isDown(Key.KEY_Z);
	}

	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.kratos, _newW, _newH, 1, 1);
	}
}
