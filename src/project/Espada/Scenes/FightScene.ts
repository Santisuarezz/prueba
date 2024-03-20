import { Graphics } from "pixi.js";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";

export class FightScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];
	private gamefondo: Graphics = new Graphics();
	constructor() {
		super();
		this.gamefondo.beginFill(0x0a0939);
		this.gamefondo.drawRect(0, 0, 1, 1);

		this.addChild(this.gamefondo);
	}
	public override onResize(_newW: number, _newH: number): void {}
}
