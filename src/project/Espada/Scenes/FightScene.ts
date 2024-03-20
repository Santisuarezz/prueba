import { Graphics } from "pixi.js";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import { Espadachin } from "../Elements/Espadachin";
import { Lancero } from "../Elements/Lancero";
import { Enemigo } from "../Elements/Enemigo";
import { Keyboard } from "../../../engine/input/Keyboard";
import { Key } from "../../../engine/input/Key";
import { Manager } from "../../..";

export class FightScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];

	private espadachinSpeed: number = 2.5;

	private gamefondo: Graphics = new Graphics();

	private espadachin: Espadachin = new Espadachin();
	private lancero: Lancero = new Lancero();
	private enemigo: Enemigo = new Enemigo();

	private espadachinmov: Keyboard;

	constructor() {
		super();
		this.gamefondo.beginFill(0x061a43);
		this.gamefondo.drawRect(0, 0, 1, 1);
		this.addChild(this.gamefondo);

		this.addChild(this.espadachin);
		this.espadachin.position.set(200, 500);

		this.addChild(this.lancero);
		this.lancero.position.set(400, 500);

		this.addChild(this.enemigo);
		this.enemigo.position.set(1000, 500);

		this.espadachinmov = new Keyboard();
	}
	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.gamefondo, _newH, _newH, 1.5, 1.5);
	}

	public override update(_dt: number): void {
		this.espadachinMove();
	}

	private espadachinMove(): void {
		if (this.espadachinmov.isDown(Key.KEY_W) || this.espadachinmov.isDown("ArrowUp")) {
			console.log("apretow");
			this.espadachin.y = this.espadachin.y - this.espadachinSpeed;
			if (this.espadachin.y < 0) {
				this.espadachin.y = 0;
			}
		}

		if (this.espadachinmov.isDown(Key.KEY_S) || this.espadachinmov.isDown("ArrowDown")) {
			this.espadachin.y = this.espadachin.y + this.espadachinSpeed;
			console.log("apretos");
			if (this.espadachin.y > Manager.height - this.espadachin.height) {
				this.espadachin.y = Manager.height - this.espadachin.height;
			}
		}

		if (this.espadachinmov.isDown(Key.KEY_D) || this.espadachinmov.isDown("ArrowRight")) {
			this.espadachin.x = this.espadachin.x + this.espadachinSpeed;
			console.log("apretod");
			if (this.espadachin.x > Manager.width - this.espadachin.width) {
				this.espadachin.x = Manager.width - this.espadachin.width;
			}
		}

		if (this.espadachinmov.isDown(Key.KEY_A) || this.espadachinmov.isDown("ArrowLeft")) {
			this.espadachin.x = this.espadachin.x - this.espadachinSpeed;
			console.log("apretoa");
			if (this.espadachin.x < 0) {
				this.espadachin.x = 0;
			}
		}
	}
}
