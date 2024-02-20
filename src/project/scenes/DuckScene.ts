import { Sprite } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";

export class DuckScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];

	private kratos;
	private cuadrado;
	constructor() {
		super();
		this.kratos = Sprite.from("kratos");
		this.addChild(this.kratos);
		this.cuadrado = Sprite.from("cuadrado");
		this.addChild(this.cuadrado);
		// this.cuadrado.position.set(0, 400);
		this.cuadrado.width = 400;
		this.cuadrado.scale.y = this.cuadrado.scale.x;
	}

	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.kratos, _newW, _newH, 1, 1);
	}

	public override update(dt: number): void {
		dt;
	}
}
