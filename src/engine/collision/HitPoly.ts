import { Polygon, Vector } from "sat";
import type { IHitable, DebugDrawOptions } from "./IHitable";
import { HitableKind, DEFAULT_DEBUG } from "./IHitable";
import * as MathUtils from "../utils/MathUtils";
import type { Container } from "pixi.js";
import { Graphics } from "pixi.js";
import { Point, Rectangle } from "pixi.js";
import { utils } from "pixi.js";

export class HitPoly extends Graphics implements IHitable {
	public readonly hitableKind: HitableKind = HitableKind.POLY;

	private isConvex: boolean;
	private points: Point[][];
	private vectors: Vector[][];
	private lastLocalID: number;
	private lastWorldID: number;
	private shapes: Polygon[];
	private boundingBox: Rectangle;
	private debug: DebugDrawOptions;

	/**
	 * Creates a polygon hitable. Can be complex or simple, closed or open, convex or concave. This handles it all!
	 * For regular polygon or just boxes try the static methods. makeBox or makeRegular
	 * If your polygon is ugly (aka not simple convex) it will be triangulated with earcut
	 * @param points the points that describe your polygon
	 * @param [debug] Do you want to see the hitbox? You can add a lot of options if you want or just pass true
	 */
	constructor(points: Point[], debug?: boolean | Partial<DebugDrawOptions>) {
		super();

		this.debug = Object.assign(DEFAULT_DEBUG, debug);

		if (typeof debug == "boolean") {
			this.debug.show = debug;
		}

		this.setPoints(points);
	}
	public setPoints(points: Point[]): void {
		this.points = [];
		this.points.push(Array.from(points));
		this.boundingBox = new Rectangle();

		// it must not be closed!
		if (this.points[0][0].x == this.points[0][this.points[0].length - 1].x && this.points[0][0].y == this.points[0][this.points[0].length - 1].y) {
			this.points[0].pop();
		}

		// remove duplicates and push into vectors
		for (let i = 0; i < this.points[0].length; i++) {
			// Remove consecutive duplicate this.points[0]
			const p1 = this.points[0][i];
			const p2 = i < this.points[0].length - 1 ? this.points[0][i + 1] : this.points[0][0];
			if (p1 !== p2 && p1.x === p2.x && p1.y === p2.y) {
				this.points[0].splice(i, 1);
				i -= 1;
				continue;
			}
		}

		this.isConvex = HitPoly.isConvex(this.points[0]); // the big divide.
		if (!this.isConvex) {
			// we need to call the EARCUTTER!
			const forEarcut: number[] = [];
			points.forEach((p) => forEarcut.push(p.x, p.y));
			const tris = utils.earcut(forEarcut, [], 2);
			this.points = [];
			for (let i = 0; i < tris.length / 3; i++) {
				const indexA = tris[i * 3];
				const indexB = tris[i * 3 + 1];
				const indexC = tris[i * 3 + 2];
				const newTri = [];
				newTri.push(new Point(forEarcut[indexA * 2], forEarcut[indexA * 2 + 1]));
				newTri.push(new Point(forEarcut[indexB * 2], forEarcut[indexB * 2 + 1]));
				newTri.push(new Point(forEarcut[indexC * 2], forEarcut[indexC * 2 + 1]));
				this.points.push(newTri);
			}
		}

		// we make one vector array per point array
		this.vectors = [];
		this.shapes = [];
		for (const points of this.points) {
			const auxVec = [];
			for (let i = 0; i < points.length; i++) {
				auxVec.push(new Vector()); // no need to push a valid value, will be fixed
			}
			this.vectors.push(auxVec); // no need to push a valid value, will be fixed

			this.shapes.push(new Polygon());
		}

		// if drawing the debug...
		this.clear();
		for (const points of this.points) {
			this.beginFill(this.debug.fillColor, this.debug.fillAlpha);
			this.lineStyle(this.debug.thickness, this.isConvex ? this.debug.color : this.debug.complexColor, this.debug.strokeAlpha);
			this.drawCircle(0, 0, this.debug.centerRadius);
			this.moveTo(points[0].x, points[0].y);
			points.forEach((p) => this.lineTo(p.x, p.y));
			this.closePath();
			this.endFill();
			points.forEach((p) => {
				this.drawCircle(p.x, p.y, this.debug.vertexRadius);
			});
		}
		this.visible = this.debug.show;
	}

	private makeWorldShape(skipUpdate?: boolean): void {
		if (!skipUpdate) {
			this.lastLocalID = null; // break the local id.
			this._recursivePostUpdateTransform();
			// this parent check is for just in case the item is a root object.
			// If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
			// this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
			if (!this.parent) {
				this.parent = this._tempDisplayObjectParent as Container;
				this.displayObjectUpdateTransform();
				this.parent = null;
			} else {
				this.displayObjectUpdateTransform();
			}

			if (this.lastWorldID != (this.transform as any)._worldID) {
				for (let i = 0; i < this.points.length; i++) {
					const points = this.points[i];
					const vectors = this.vectors[i];
					const shape = this.shapes[i];
					const tempPoint = new Point();

					this.transform.worldTransform.apply(this.position, tempPoint);
					shape.pos.x = tempPoint.x;
					shape.pos.y = tempPoint.y;
					points.forEach((p, i) => {
						this.transform.worldTransform.apply(p, tempPoint);
						vectors[i].x = tempPoint.x - shape.pos.x;
						vectors[i].y = tempPoint.y - shape.pos.y;
					});
					shape.setPoints(vectors);
				}
				this.lastWorldID = (this.transform as any)._worldID;
			}
		}
	}

	public makeLocalShape(skipUpdate?: boolean): void {
		if (!skipUpdate) {
			this.lastWorldID = null; // break the local id.
			this.transform.updateLocalTransform();

			if (this.lastLocalID != (this.transform as any)._worldID) {
				for (let i = 0; i < this.points.length; i++) {
					const points = this.points[i];
					const vectors = this.vectors[i];
					const shape = this.shapes[i];
					const tempPoint = new Point();

					this.transform.localTransform.apply(this.position, tempPoint);
					shape.pos.x = tempPoint.x;
					shape.pos.y = tempPoint.y;

					points.forEach((p, i) => {
						this.transform.localTransform.apply(p, tempPoint);
						vectors[i].x = tempPoint.x - shape.pos.x;
						vectors[i].y = tempPoint.y - shape.pos.y;
					});
					shape.setPoints(vectors);
				}
				this.lastLocalID = (this.transform as any)._worldID;
			}
		}
	}
	private makeBoundingBox(): void {
		let xMin = Number.POSITIVE_INFINITY;
		let yMin = Number.POSITIVE_INFINITY;
		let xMax = Number.NEGATIVE_INFINITY;
		let yMax = Number.NEGATIVE_INFINITY;

		for (const shape of this.shapes) {
			for (const point of shape.points) {
				xMin = Math.min(point.x, xMin);
				yMin = Math.min(point.y, yMin);
				xMax = Math.max(point.x, xMax);
				yMax = Math.max(point.y, yMax);
			}
		}

		this.boundingBox.x = this.shapes[0].pos.x + xMin;
		this.boundingBox.y = this.shapes[0].pos.y + yMin;
		this.boundingBox.width = xMax - xMin;
		this.boundingBox.height = yMax - yMin;
	}

	public getWorldBoundingBox(skipUpdate?: boolean): Rectangle {
		this.makeWorldShape(skipUpdate);
		this.makeBoundingBox();
		return this.boundingBox;
	}
	public getLocalBoundingBox(skipUpdate?: boolean): Rectangle {
		this.makeLocalShape(skipUpdate);
		this.makeBoundingBox();
		return this.boundingBox;
	}

	public getWorldShape(skipUpdate?: boolean): Polygon[] {
		this.makeWorldShape(skipUpdate);
		return this.shapes;
	}

	public getLocalShape(skipUpdate?: boolean): Polygon[] {
		this.makeLocalShape(skipUpdate);
		return this.shapes;
	}

	// #region Helper functions
	/**
	 * Makes a rectangular hitable box from position width and height.
	 * It is easier than thinking of the points yourself.
	 * @param x x position of the box (if you want your box centered, say "-width/2")
	 * @param y y position of the box (if you want your box centered, say "-height/2")
	 * @param w width
	 * @param h height
	 * @param [debug] a custom debug object or just a boolean
	 * @returns hitable box ready to add to your object.
	 */
	public static makeBox(x: number, y: number, w: number, h: number, debug?: boolean | Partial<DebugDrawOptions>): HitPoly {
		return new HitPoly([new Point(x, y), new Point(x + w, y), new Point(x + w, y + h), new Point(x, y + h)], debug);
	}

	/**
	 * Makes a regular polygon that fits inside a circle.
	 * @param sides amount of sides for your polygon
	 * @param radius radius of the circle to fit your polygon inside of
	 * @param [radRotation] do you want to rotate your polygon?
	 * @param [debug] a custom debug object or just a boolean
	 * @returns hitable regular polygon
	 */
	public static makeRegular(sides: number, radius: number, radRotation: number = 0, debug?: boolean | Partial<DebugDrawOptions>): HitPoly {
		// stack overflow said:
		// x[n] = r * cos(2*pi*n/N)
		// y[n] = r * sin(2*pi*n/N)

		const points = [];
		for (let i = 0; i < sides; i++) {
			const x = radius * Math.cos(2 * Math.PI * (i / sides) + radRotation);
			const y = radius * Math.sin(2 * Math.PI * (i / sides) + radRotation);
			points.push(new Point(x, y));
		}
		return new HitPoly(points, debug);
	}
	// #endregion

	/**
	 * Determines whether a polygon is convex and simple
	 * Stolen from https://math.stackexchange.com/a/1745427
	 * @param vertexlist the points that make the polygon
	 * @returns  if it is convex
	 */
	private static isConvex(vertexlist: Point[]): boolean {
		if (vertexlist.length <= 3) {
			return true;
		}

		let wSign = 0; // First nonzero orientation (positive or negative)

		let xSign = 0;
		let xFirstSign = 0; // Sign of first nonzero edge vector x
		let xFlips = 0; // Number of sign changes in x

		let ySign = 0;
		let yFirstSign = 0; // Sign of first nonzero edge vector y
		let yFlips = 0; // Number of sign changes in y

		let curr = vertexlist[vertexlist.length - 2]; // Second-to-last vertex
		let next = vertexlist[vertexlist.length - 1]; // Last vertex
		let prev;
		for (const v of vertexlist) {
			// Each vertex, in order
			prev = curr; // Previous vertex
			curr = next; // Current vertex
			next = v; // Next vertex

			// Previous edge vector ("before"):
			const bx = curr.x - prev.x;
			const by = curr.y - prev.y;

			// Next edge vector ("after"):
			const ax = next.x - curr.x;
			const ay = next.y - curr.y;

			// Calculate sign flips using the next edge vector ("after"),
			// recording the first sign.
			if (MathUtils.fuzzySign(ax) > 0) {
				if (xSign == 0) {
					xFirstSign = +1;
				} else if (xSign < 0) {
					xFlips = xFlips + 1;
				}
				xSign = +1;
			} else if (MathUtils.fuzzySign(ax) < 0) {
				if (xSign == 0) {
					xFirstSign = -1;
				} else if (xSign > 0) {
					xFlips = xFlips + 1;
				}
				xSign = -1;
			}

			if (xFlips > 2) {
				return false;
			}

			if (MathUtils.fuzzySign(ay) > 0) {
				if (ySign == 0) {
					yFirstSign = +1;
				} else if (ySign < 0) {
					yFlips = yFlips + 1;
				}
				ySign = +1;
			} else if (MathUtils.fuzzySign(ay) < 0) {
				if (ySign == 0) {
					yFirstSign = -1;
				} else if (ySign > 0) {
					yFlips = yFlips + 1;
				}
				ySign = -1;
			}

			if (yFlips > 2) {
				return false;
			}

			// Find out the orientation of this pair of edges,
			// and ensure it does not differ from previous ones.
			const w = bx * ay - ax * by;
			if (MathUtils.fuzzyEq(wSign, 0) && !MathUtils.fuzzyEq(w, 0)) {
				wSign = w;
			} else if (MathUtils.fuzzySign(wSign) > 0 && MathUtils.fuzzySign(w) < 0) {
				return false;
			} else if (MathUtils.fuzzySign(wSign) < 0 && MathUtils.fuzzySign(w) > 0) {
				return false;
			}
		}

		// Final/wraparound sign flips:
		if (xSign != 0 && xFirstSign != 0 && xSign != xFirstSign) {
			xFlips = xFlips + 1;
		}
		if (ySign != 0 && yFirstSign != 0 && ySign != yFirstSign) {
			yFlips = yFlips + 1;
		}

		// Concave polygons have two sign flips along each axis.
		if (xFlips != 2 || yFlips != 2) {
			return false;
		}

		// This is a convex polygon.
		return true;
	}
}
