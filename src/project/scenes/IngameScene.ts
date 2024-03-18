import { Sprite } from "pixi.js";
import { Graphics } from "pixi.js";

import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { Tween } from "tweedle.js";
import { Manager } from "../..";
import { Keyboard } from "../../engine/input/Keyboard";
import { Key } from "../../engine/input/Key";

export class IngameScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];
	private fondogame: Graphics = new Graphics();
	private nube: Sprite;
	private keybinds: Keyboard;

	private player: Graphics = new Graphics();
	private playerSpeed: number = 10;

	constructor() {
		super();

		this.fondogame.beginFill(0x86d3f0);
		this.fondogame.drawRect(0, 0, 1, 1);
		this.addChild(this.fondogame);

		this.nube = Sprite.from("nube");
		this.nube.x = Manager.width;
		this.nube.scale.set(0.5);
		this.addChild(this.nube);

		this.player.beginFill(0x4309ae);
		this.player.drawRect(0, 0, 65, 50);
		this.player.position.set(300, 500);
		this.addChild(this.player);

		new Tween(this.nube)
			.to({ x: -this.nube.width }, 1000)
			.start()
			.repeat(Infinity)
			.onRepeat(() => {
				this.nube.x = Manager.width;
				this.nube.y = 50 + 100 * Math.random();
			});
		this.keybinds = new Keyboard();
	}

	public override update(_dt: number): void {
		this.playerMovement();
	}

	private playerMovement(): void {
		if (this.keybinds.isDown(Key.KEY_W) || this.keybinds.isDown("ArrowUp")) {
			this.player.y = this.player.y - this.playerSpeed;

			if (this.player.y < 0) {
				this.player.y = 0;
			}
		}
		if (this.keybinds.isDown(Key.KEY_S) || this.keybinds.isDown("ArrowDown")) {
			this.player.y = this.player.y + this.playerSpeed;
			if (this.player.y > Manager.height - this.player.height) {
				this.player.y = Manager.height - this.player.height;
			}
		}
	}

	public override onResize(_newW: number, _newH: number): void {
		this.fondogame.width = _newW;
		this.fondogame.height = _newH;
	}
}
