import { Graphics } from "pixi.js";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../../engine/utils/ScaleHelper";
import { Espadachin } from "../Elements/Espadachin";
import { Lancero } from "../Elements/Lancero";
import { Enemigo } from "../Elements/Enemigo";
import { Keyboard } from "../../../engine/input/Keyboard";

export class FightScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];

	private gamefondo: Graphics = new Graphics();

	private espadachin: Espadachin = new Espadachin();
	private lancero: Lancero = new Lancero();
	private enemigo: Enemigo = new Enemigo();
	
	private keybinds: Keyboard

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

		
	}
	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.gamefondo, _newH, _newH, 1.5, 1.5);
	}

	public override update(_dt: number): void {
		private playerMove(): void {
			if (this.keybinds)

		}
	}
}
