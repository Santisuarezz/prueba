import type { HitPoly } from "./HitPoly";
import type { Response, Polygon, Circle } from "sat";
import { testPolygonPolygon, testCircleCircle, testPolygonCircle } from "sat";
import type { IHitable } from "./IHitable";
import { HitableKind } from "./IHitable";
import type { HitCircle } from "./HitCircle";
import * as MathUtils from "../utils/MathUtils";
import type { Rectangle } from "pixi.js";

export class Hit {
	/**
	 * Hits together two Hitable thingies and tells you what happened
	 * This will internally check if you are hitting polygons, circles or a permutation
	 * @param a one object to hit
	 * @param b the other object to hit
	 * @param [out] reference to a response object. If you don't need this, don't pass it. It is faster.
	 * @returns true if the two objects are overlapping. If you need more info, use the out object
	 */
	public static test(a: IHitable, b: IHitable, out?: Response): boolean {
		// why the hell isn't this default on SAT.js?!
		if (out) {
			out.clear();
		}

		// really ugly if to test what kind of collision you are attempting.

		if (a.hitableKind == HitableKind.POLY && b.hitableKind == HitableKind.POLY) {
			return Hit.checkPolyPoly(a as HitPoly, b as HitPoly, out, Boolean(out));
		} else if (a.hitableKind == HitableKind.CIRCLE && b.hitableKind == HitableKind.CIRCLE) {
			return Hit.checkCircleCircle(a as HitCircle, b as HitCircle, out, Boolean(out));
		} else if (a.hitableKind == HitableKind.POLY && b.hitableKind == HitableKind.CIRCLE) {
			return Hit.checkPolyCircle(a as HitPoly, b as HitCircle, out, Boolean(out));
		} else if (a.hitableKind == HitableKind.CIRCLE && b.hitableKind == HitableKind.POLY) {
			// just reverse the result.
			const result = Hit.checkPolyCircle(b as HitPoly, a as HitCircle, out, Boolean(out));
			if (result && out) {
				// Swap A and B in the out.
				const a = out.a;
				const aInB = out["aInB"];
				out.overlapN.reverse();
				out.overlapV.reverse();
				out.a = out.b;
				out.b = a;
				out.aInB = out.bInA;
				out.bInA = aInB;
			}
			return result;
		}

		console.error("You tested two objects that I didn't know how to test");
		return false;
	}

	private static checkPolyCircle(p1: HitPoly, p2: HitCircle, out?: Response, allowBrothers?: boolean): boolean {
		let s1Arr: Polygon[];
		let s2: Circle;
		let p1Box: Rectangle;
		let p2Box: Rectangle;

		if (p1.parent == p2.parent && allowBrothers) {
			s1Arr = p1.getLocalShape();
			s2 = p2.getLocalShape();
			p1Box = p1.getLocalBoundingBox();
			p2Box = p2.getLocalBoundingBox();
		} else {
			s1Arr = p1.getWorldShape();
			s2 = p2.getWorldShape();
			p1Box = p1.getWorldBoundingBox();
			p2Box = p2.getWorldBoundingBox();
		}

		if (!Hit.simpleAABB(p1Box, p2Box)) {
			// they are nowhere near eachouther!
			return false;
		}

		if (s1Arr.length == 1) {
			return testPolygonCircle(s1Arr[0], s2, out);
		} else {
			// Your poly is not a convex one!
			// Trying to get a resultant from this will always give you something janky.
			// I won't even try. TOO BAD.

			const circleAABB: Polygon = (s2 as any).getAABB(); // Circle has AABB but it's not typed :(

			// for each tri
			for (const s1 of s1Arr) {
				// check bounding box, is faster
				if (Hit.checkAABB(s1.getAABB(), circleAABB)) {
					// check exactly
					if (testPolygonCircle(s1, s2, out)) {
						// hit! exit early
						return true;
					}
				}
			}
			// no hit anywhere, false
			return false;
		}
	}
	private static checkPolyPoly(p1: HitPoly, p2: HitPoly, out?: Response, allowBrothers?: boolean): boolean {
		let s1Arr: Polygon[];
		let s2Arr: Polygon[];
		let p1Box: Rectangle;
		let p2Box: Rectangle;

		if (p1.parent == p2.parent && allowBrothers) {
			s1Arr = p1.getLocalShape();
			s2Arr = p2.getLocalShape();
			p1Box = p1.getLocalBoundingBox();
			p2Box = p2.getLocalBoundingBox();
		} else {
			s1Arr = p1.getWorldShape();
			s2Arr = p2.getWorldShape();
			p1Box = p1.getWorldBoundingBox();
			p2Box = p2.getWorldBoundingBox();
		}

		if (!Hit.simpleAABB(p1Box, p2Box)) {
			// they are nowhere near eachouther!
			return false;
		}

		if (s1Arr.length == 1 && s2Arr.length == 1) {
			// the old case, this is gud
			if (!out && Hit.isAABB(s1Arr[0]) && Hit.isAABB(s2Arr[0])) {
				return true;
			} else {
				return testPolygonPolygon(s1Arr[0], s2Arr[0], out);
			}
		} else {
			// one of the two is a concave or complex :(.
			// Trying to get a resultant from this will always give you something janky.
			// I won't even try. TOO BAD.

			// for all the tris of one poly vs all the tris of another poly
			for (const s1 of s1Arr) {
				const s1AABB = s1.getAABB();
				for (const s2 of s2Arr) {
					// check AABB for fast resolution
					if (Hit.checkAABB(s1AABB, s2.getAABB())) {
						// If AABB is enough, return.
						if (Hit.isAABB(s1) && Hit.isAABB(s2)) {
							return true;
						} else {
							// we need to test them as tris!
							if (testPolygonPolygon(s1, s2, out)) {
								// a collision was indeed detected!
								// we exit right now!
								return true;
							}
						}
					}
				}
			}
			// no hit anywhere, false
			return false;
		}
	}

	private static checkCircleCircle(c1: HitCircle, c2: HitCircle, out?: Response, allowBrothers?: boolean): boolean {
		let s1: Circle;
		let s2: Circle;

		let b1: Rectangle;
		let b2: Rectangle;
		if (c1.parent == c2.parent && allowBrothers) {
			s1 = c1.getLocalShape();
			s2 = c2.getLocalShape();
			b1 = c1.getLocalBoundingBox();
			b2 = c2.getLocalBoundingBox();
		} else {
			s1 = c1.getWorldShape();
			s2 = c2.getWorldShape();
			b1 = c1.getWorldBoundingBox();
			b2 = c2.getWorldBoundingBox();
		}

		// circle circle uses the radiuses. It is **NOT** faster to make bounding boxes checks
		// however, since ellipses are not supported, checking the box first and the ellipse second it's bettar than nothing.
		if (!Hit.simpleAABB(b1, b2)) {
			return false;
		}
		return testCircleCircle(s1, s2, out);
	}

	// Auxiliar AABB. AABB is faster than SAT. So it is a good broadphase
	private static checkAABB(rectA: Polygon, rectB: Polygon): boolean {
		const x0 = rectA.pos.x < rectB.pos.x ? rectB.pos.x : rectA.pos.x;
		const x1 = rectA.pos.x + rectA.points[2].x > rectB.pos.x + rectB.points[2].x ? rectB.pos.x + rectB.points[2].x : rectA.pos.x + rectA.points[2].x;

		if (x1 <= x0) {
			return false;
		}

		const y0 = rectA.pos.y < rectB.pos.y ? rectB.pos.y : rectA.pos.y;
		const y1 = rectA.pos.y + rectA.points[2].y > rectB.pos.y + rectB.points[2].y ? rectB.pos.y + rectB.points[2].y : rectA.pos.y + rectA.points[2].y;

		if (y1 <= y0) {
			return false;
		}

		return true;
	}

	// this AABB can mash pixi things together
	private static simpleAABB(rectA: Rectangle, rectB: Rectangle): boolean {
		const x0 = rectA.x < rectB.x ? rectB.x : rectA.x;
		const x1 = rectA.right > rectB.right ? rectB.right : rectA.right;

		if (x1 <= x0) {
			return false;
		}

		const y0 = rectA.y < rectB.y ? rectB.y : rectA.y;
		const y1 = rectA.bottom > rectB.bottom ? rectB.bottom : rectA.bottom;

		if (y1 <= y0) {
			return false;
		}
		return true;
	}

	private static isAABB(poly: Polygon): boolean {
		if (poly.points.length != 4) {
			return false;
		} // if you have more than 4 points, you are not a box.
		const y01 = poly.points[1].y - poly.points[0].y;
		const x01 = poly.points[1].x - poly.points[0].x;
		return (
			// segment 01 is perpendicular to segment 12
			MathUtils.fuzzyEq(x01 * (poly.points[2].x - poly.points[1].x), -y01 * (poly.points[2].y - poly.points[1].y)) &&
			// segment 23 is perpendicular to segment 30
			MathUtils.fuzzyEq(
				(poly.points[3].x - poly.points[2].x) * (poly.points[0].x - poly.points[3].x),
				-(poly.points[3].y - poly.points[2].y) * (poly.points[0].y - poly.points[3].y)
			) &&
			// segment 01 is perpendicular to (0,1) or (1,0)
			(MathUtils.fuzzyEq(0, y01) || MathUtils.fuzzyEq(x01, 0))
		);
	}
}
