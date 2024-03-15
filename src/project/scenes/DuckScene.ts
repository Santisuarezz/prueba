import type { FederatedPointerEvent } from "pixi.js";

import { Sprite } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";
import { Keyboard } from "../../engine/input/Keyboard";
import { Key } from "../../engine/input/Key";
import { Character } from "../elements/Character";

import { Manager } from "../..";
import { MenuScene } from "./MenuScene";

export class DuckScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];

	// private kratos;
	private fondo;
	private menu;

	private keybinds: Keyboard;
	private playerCharacter: Character;

	constructor() {
		super();

		this.fondo = Sprite.from("fondo");
		this.addChild(this.fondo);

		// this.kratos = Sprite.from("kratos");
		// this.addChild(this.kratos);

		this.menu = Sprite.from("menu");
		this.menu.eventMode = "static";
		this.menu.cursor = "pointer";
		this.menu.on("pointertap", () => {
			Manager.openScene(MenuScene);
		});
		this.addChild(this.menu);

		// this.addChild(this.enemy);

		this.playerCharacter = new Character();
		// this.addChild(this.playerCharacter);

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
		ScaleHelper.setScaleRelativeToScreen(this.fondo, _newW, _newH, 1, 1);
	}
}
