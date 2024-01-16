import type { ISpriteMaskTarget } from "pixi.js";
import { SpriteMaskFilter } from "pixi.js";
import vert from "./invertedSpriteMaskFilter.vert";
import frag from "./invertedSpriteMaskFilter.frag";

export class EraseFilter extends SpriteMaskFilter {
	constructor(mask: ISpriteMaskTarget) {
		super(vert, frag);
		this.maskSprite = mask;
	}
}
