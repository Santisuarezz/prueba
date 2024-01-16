import type { Renderer } from "pixi.js";
import { DisplayObject } from "pixi.js";
import type { IPointData } from "pixi.js";

export class HtmlDisplayObject extends DisplayObject {
	private static RENDER_ZERO: IPointData = { x: 0, y: 0 };
	public sortDirty: boolean = null;
	public removeChild: (child: DisplayObject) => null;

	private _target: HTMLElement;
	public get target(): HTMLElement {
		return this._target;
	}

	private prevID: number;

	constructor(target: HTMLElement) {
		super();

		this._target = target;
		this.prevID = -1;

		this.updateTarget();
	}

	public calculateBounds(): void {
		this._bounds.clear();
		const domBounds = this.target.getBoundingClientRect();
		this._bounds.addPoint({ x: domBounds.left, y: domBounds.top });
		this._bounds.addPoint({ x: domBounds.right, y: domBounds.bottom });
	}

	private updateTarget(): void {
		const matrix = this.worldTransform;

		this.target.style.left = `${HtmlDisplayObject.RENDER_ZERO.x}px`;
		this.target.style.top = `${HtmlDisplayObject.RENDER_ZERO.y}px`;
		this.target.style.transform = `matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.tx}, ${matrix.ty})`;
		this.target.style.webkitTransform = `translateX(-50%) translateY(-50%) matrix(${matrix.a}, ${matrix.b}, ${matrix.c}, ${matrix.d}, ${matrix.tx}, ${matrix.ty})`;
		this.target.style.opacity = `${this.worldAlpha}`;
		this.target.style.visibility = this.worldVisible ? "visible" : "hidden";
		this.target.style.position = "absolute";
	}

	public render(renderer: Renderer): void {
		// If we scrolled the page or the entire page moved, we need to fix the position of the element
		const rect = renderer.view.getBoundingClientRect();
		if (
			HtmlDisplayObject.RENDER_ZERO.x != rect.x + (window.scrollX || window.pageXOffset) ||
			HtmlDisplayObject.RENDER_ZERO.y != rect.y + (window.scrollY || window.pageYOffset)
		) {
			HtmlDisplayObject.RENDER_ZERO.x = rect.x + (window.scrollX || window.pageXOffset);
			HtmlDisplayObject.RENDER_ZERO.y = rect.y + (window.scrollY || window.pageYOffset);
			this.prevID = -1;
		}

		// If the parent is wrong, we need to put it right and fix the position of the element
		if (this.target.parentElement != (renderer.view as HTMLCanvasElement)) {
			(renderer.view as HTMLCanvasElement).appendChild(this._target);
			this.prevID = -1;
		}

		// If the transform is the same and we didn't break it before then we don't need to update the element
		if (
			this.prevID === this.transform._worldID && // Transform
			this.target.style.opacity == `${this.worldAlpha}` && // Alpha
			this.target.style.visibility == (this.worldVisible ? "visible" : "hidden") // Visibility
		) {
			return;
		}

		this.updateTarget();

		this.prevID = this.transform._worldID;
	}

	public override destroy(): void {
		this._target.parentElement?.removeChild(this._target);
		this._target = null;
		this.prevID = null;

		super.destroy();
	}

	public changeVisibility(visible: boolean): void {
		this.target.style.visibility = visible ? "visible" : "hidden";
	}
}
