import type { Texture } from "pixi.js";
import { Sprite } from "pixi.js";
import { ScaleHelper } from "../../utils/ScaleHelper";
import { PixiScene } from "./PixiScene";

export class SimpleLockScene extends PixiScene {
	private readonly aux: Sprite;
	constructor(texture: string | Texture | HTMLCanvasElement | HTMLVideoElement) {
		super();
		this.aux = Sprite.from(texture);
		this.aux.anchor.set(0.5);
		this.addChild(this.aux);
	}

	public override onResize(newW: number, newH: number): void {
		this.aux.x = newW / 2;
		this.aux.y = newH / 2;
		ScaleHelper.setScaleRelativeToScreen(this.aux, newW, newH, 1, 1, Math.max);
	}
}
