import { Circle } from "sat";
import type { IHitable, DebugDrawOptions } from "./IHitable";
import { HitableKind, DEFAULT_DEBUG } from "./IHitable";
import type { Container } from "pixi.js";
import { Graphics } from "pixi.js";
import { Rectangle, Point } from "pixi.js";

export class HitCircle extends Graphics implements IHitable {
	private lastLocalID: number;
	private lastWorldID: number;
	private boundingBox: Rectangle;
	public readonly hitableKind: HitableKind = HitableKind.CIRCLE;
	private _radius: number;
	public get radius(): number {
		return this._radius;
	}
	public set radius(value: number) {
		this._radius = value;
		this.clear();
		this.beginFill(this.debug.fillColor, this.debug.fillAlpha);
		this.lineStyle(this.debug.thickness, this.debug.color, this.debug.strokeAlpha);
		this.drawCircle(0, 0, this._radius);
		this.drawCircle(0, 0, this.debug.centerRadius);
		this.visible = this.debug.show;
	}
	private shape: Circle = new Circle();
	private debug: DebugDrawOptions;

	/**
	 * Creates an instance of hit circle.
	 * @param radius radius of the circle
	 * @param [debug] Do you want to see the hitbox? You can add a lot of options if you want or just pass true
	 */
	constructor(radius: number, debug?: boolean | Partial<DebugDrawOptions>) {
		super();

		this.debug = Object.assign(DEFAULT_DEBUG, debug);

		if (typeof debug == "boolean") {
			this.debug.show = debug;
		}

		this.radius = radius;
		this.boundingBox = new Rectangle();
	}

	public makeWorldShape(skipUpdate?: boolean): void {
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
				const tempPoint = new Point();

				// extract global scale from the matrix
				const scaleX = Math.sqrt(this.transform.worldTransform.a * this.transform.worldTransform.a + this.transform.worldTransform.b * this.transform.worldTransform.b);
				const scaleY = Math.sqrt(this.transform.worldTransform.c * this.transform.worldTransform.c + this.transform.worldTransform.d * this.transform.worldTransform.d);

				this.transform.worldTransform.apply(new Point(), tempPoint);

				this.shape.r = this.radius * Math.max(Math.abs(scaleX), Math.abs(scaleY));
				this.shape.pos.x = tempPoint.x;
				this.shape.pos.y = tempPoint.y;

				this.boundingBox.x = this.shape.pos.x - this.radius * Math.abs(scaleX);
				this.boundingBox.y = this.shape.pos.y - this.radius * Math.abs(scaleY);
				this.boundingBox.width = this.radius * 2 * Math.abs(scaleX);
				this.boundingBox.height = this.radius * 2 * Math.abs(scaleY);

				this.lastWorldID = (this.transform as any)._worldID;
			}
		}
	}

	public makeLocalShape(skipUpdate?: boolean): void {
		if (!skipUpdate) {
			this.lastWorldID = null; // break the local id.
			this.transform.updateLocalTransform();

			if (this.lastLocalID != (this.transform as any)._worldID) {
				const tempPoint = new Point();

				const scaleX = Math.sqrt(this.transform.localTransform.a * this.transform.localTransform.a + this.transform.localTransform.b * this.transform.localTransform.b);
				const scaleY = Math.sqrt(this.transform.localTransform.c * this.transform.localTransform.c + this.transform.localTransform.d * this.transform.localTransform.d);

				this.transform.localTransform.apply(new Point(), tempPoint);
				this.shape.r = this.radius * Math.max(Math.abs(scaleX), Math.abs(scaleY));
				this.shape.pos.x = tempPoint.x;
				this.shape.pos.y = tempPoint.y;

				this.boundingBox.x = this.shape.pos.x - this.radius * Math.abs(scaleX);
				this.boundingBox.y = this.shape.pos.y - this.radius * Math.abs(scaleY);
				this.boundingBox.width = this.radius * 2 * Math.abs(scaleX);
				this.boundingBox.height = this.radius * 2 * Math.abs(scaleY);

				this.lastLocalID = (this.transform as any)._worldID;
			}
		}
	}

	public getWorldBoundingBox(skipUpdate?: boolean): Rectangle {
		this.makeWorldShape(skipUpdate);
		return this.boundingBox;
	}
	public getLocalBoundingBox(skipUpdate?: boolean): Rectangle {
		this.makeLocalShape(skipUpdate);
		return this.boundingBox;
	}

	public getWorldShape(skipUpdate?: boolean): Circle {
		this.makeWorldShape(skipUpdate);
		return this.shape;
	}

	public getLocalShape(skipUpdate?: boolean): Circle {
		this.makeLocalShape(skipUpdate);
		return this.shape;
	}
}
