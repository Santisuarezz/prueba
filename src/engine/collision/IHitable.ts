import type { DisplayObject } from "pixi.js";
import type { Rectangle } from "pixi.js";
import type { Polygon, Circle } from "sat";
import { SHOW_COLLIDERS } from "../../flags";

export interface IHitable extends DisplayObject {
	hitableKind: HitableKind; // avoid type checking.
	getWorldShape(skipUpdate?: boolean): Polygon[] | Circle;
	getLocalShape(skipUpdate?: boolean): Polygon[] | Circle;

	getWorldBoundingBox(skipUpdate?: boolean): Rectangle;
	getLocalBoundingBox(skipUpdate?: boolean): Rectangle;
}

export enum HitableKind {
	POLY,
	MULTI_POLY,
	CIRCLE,
}

export interface DebugDrawOptions {
	/** default = 0x00FF00 */
	color: number;

	/** default = 0xFF0000 */
	complexColor: number;

	/** default = 0x0 */
	fillColor: number;

	/** default = 0 */
	fillAlpha: number;

	/** default = 1 */
	thickness: number;

	/** default = 0.75 */
	strokeAlpha: number;

	/** default = 5 */
	centerRadius: number;

	/** default = 3 */
	vertexRadius: number;

	/** default = SHOW_COLLIDERS */
	show: boolean;
}

export const DEFAULT_DEBUG: DebugDrawOptions = {
	color: 0x00ff00,
	complexColor: 0xff0000,
	fillAlpha: 0,
	strokeAlpha: 0.75,
	fillColor: 0x0,
	thickness: 1,
	centerRadius: 5,
	vertexRadius: 3,
	show: SHOW_COLLIDERS,
};
