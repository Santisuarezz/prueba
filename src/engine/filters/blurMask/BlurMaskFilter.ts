import vertex from "../erase/invertedSpriteMaskFilter.vert";
import fragment from "./kawase-blur.frag";
import fragmentClamp from "./kawase-blur-clamp.frag";
import { Filter, Matrix, Point, Rectangle, TextureMatrix } from "pixi.js";
import type { IPoint, CLEAR_MODES, FilterSystem, RenderTexture, ISpriteMaskTarget } from "pixi.js";

export type PixelSizeValue = IPoint | number[] | number;

export class BlurMaskFilter extends Filter {
	private _pixelSize: Point;
	/**
	 * Sets the pixel size of the filter. Large size is blurrier. For advanced usage.
	 *
	 * @member {PIXI.Point|number[]}
	 * @default [1, 1]
	 */
	public set pixelSize(value: PixelSizeValue) {
		if (typeof value === "number") {
			this._pixelSize.x = value;
			this._pixelSize.y = value;
		} else if (Array.isArray(value)) {
			this._pixelSize.x = value[0];
			this._pixelSize.y = value[1];
		} else if (value instanceof Point) {
			this._pixelSize.x = value.x;
			this._pixelSize.y = value.y;
		} else {
			// if value is invalid , set default value
			this._pixelSize.x = 1;
			this._pixelSize.y = 1;
		}
	}
	public get pixelSize(): PixelSizeValue {
		return this._pixelSize;
	}

	private _clamp: boolean;
	/**
	 * Get the if the filter is clampped.
	 *
	 * @readonly
	 * @default false
	 */
	public get clamp(): boolean {
		return this._clamp;
	}

	private _kernels: number[] = [];
	/**
	 * The kernel size of the blur filter, for advanced usage.
	 * @default [0]
	 */
	public get kernels(): number[] {
		return this._kernels;
	}
	public set kernels(value: number[]) {
		if (Array.isArray(value) && value.length > 0) {
			this._kernels = value;
			this._quality = value.length;
			this._blur = Math.max(...value);
		} else {
			// if value is invalid , set default value
			this._kernels = [0];
			this._quality = 1;
		}
	}

	private _blur = 4;
	/**
	 * The amount of blur, value greater than `0`.
	 * @default 4
	 */
	public get blur(): number {
		return this._blur;
	}
	public set blur(value: number) {
		this._blur = value;
		this._generateKernels();
	}

	private _quality = 3;
	/**
	 * The quality of the filter, integer greater than `1`.
	 * @default 3
	 */
	public get quality(): number {
		return this._quality;
	}
	public set quality(value: number) {
		this._quality = Math.max(1, Math.round(value));
		this._generateKernels();
	}

	private _rect: Rectangle = new Rectangle();
	public get rect(): Rectangle {
		return this._rect;
	}
	public set rect(value: Rectangle) {
		this._rect.copyFrom(value);
	}

	private _maskSprite: ISpriteMaskTarget;

	/** Mask matrix */
	public maskMatrix: Matrix;

	/**
	 * Sprite mask
	 * @type {PIXI.DisplayObject}
	 */
	public get maskSprite(): ISpriteMaskTarget {
		return this._maskSprite;
	}

	public set maskSprite(value: ISpriteMaskTarget) {
		this._maskSprite = value;

		if (this._maskSprite) {
			this._maskSprite.renderable = false;
		}
	}

	/**
	 * Basically, the KawaseBlurFilter and the EraseFilter having a baby.
	 *
	 * @param {ISpriteMaskTarget} mask - The mask for the blur. In other words, the part where you want the blur to happen.
	 * @param {number|number[]} [blur=4] - The blur of the filter. Should be greater than `0`. If
	 *        value is an Array, setting kernels.
	 * @param {number} [quality=3] - The quality of the filter. Should be an integer greater than `1`.
	 * @param {boolean} [clamp=false] - Clamp edges, useful for removing dark edges
	 *        from fullscreen filters or bleeding to the edge of filterArea.
	 */
	constructor(mask: ISpriteMaskTarget, blur: number | number[] = 4, quality = 3, clamp = false) {
		super(vertex, clamp ? fragmentClamp : fragment);

		this.maskSprite = mask;
		this.maskMatrix = new Matrix();

		this.uniforms.uOffset = new Float32Array(2);

		this._pixelSize = new Point();
		this.pixelSize = 1;
		this._clamp = clamp;

		// if `blur` is array , as kernels
		if (Array.isArray(blur)) {
			this.kernels = blur;
		} else {
			this._blur = blur;
			this.quality = quality;
		}
	}

	/**
	 * Overrides apply
	 * @private
	 */
	public override apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
		const maskSprite = this._maskSprite;
		const tex = maskSprite._texture;

		if (!tex.valid) {
			return;
		}
		if (!tex.uvMatrix) {
			// margin = 0.0, let it bleed a bit, shader code becomes easier
			// assuming that atlas textures were made with 1-pixel padding
			tex.uvMatrix = new TextureMatrix(tex, 0.0);
		}
		tex.uvMatrix.update();

		this.uniforms.npmAlpha = tex.baseTexture.alphaMode ? 0.0 : 1.0;
		this.uniforms.mask = tex;
		// get _normalized sprite texture coords_ and convert them to _normalized atlas texture coords_ with `prepend`
		this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, maskSprite).prepend(tex.uvMatrix.mapCoord);
		this.uniforms.alpha = maskSprite.worldAlpha;
		this.uniforms.maskClamp = tex.uvMatrix.uClampFrame;

		// end of mask - beginning of blur

		const uvX = this._pixelSize.x / input._frame.width;
		const uvY = this._pixelSize.y / input._frame.height;

		let offset;

		if (this._quality === 1 || this._blur === 0) {
			offset = this._kernels[0] + 0.5;
			this.uniforms.uOffset[0] = offset * uvX;
			this.uniforms.uOffset[1] = offset * uvY;
			filterManager.applyFilter(this, input, output, clear);
		} else {
			const renderTarget = filterManager.getFilterTexture();

			let source = input;
			let target = renderTarget;
			let tmp;

			const last = this._quality - 1;

			for (let i = 0; i < last; i++) {
				offset = this._kernels[i] + 0.5;
				this.uniforms.uOffset[0] = offset * uvX;
				this.uniforms.uOffset[1] = offset * uvY;
				filterManager.applyFilter(this, source, target, 1);

				tmp = source;
				source = target;
				target = tmp;
			}
			offset = this._kernels[last] + 0.5;
			this.uniforms.uOffset[0] = offset * uvX;
			this.uniforms.uOffset[1] = offset * uvY;
			filterManager.applyFilter(this, source, output, clear);

			filterManager.returnFilterTexture(renderTarget);
		}
	}

	private _updatePadding(): void {
		this.padding = Math.ceil(this._kernels.reduce((acc, v) => acc + v + 0.5, 0));
	}

	/**
	 * Auto generate kernels by blur & quality
	 * @private
	 */
	private _generateKernels(): void {
		const blur = this._blur;
		const quality = this._quality;
		const kernels: number[] = [blur];

		if (blur > 0) {
			let k = blur;
			const step = blur / quality;

			for (let i = 1; i < quality; i++) {
				k -= step;
				kernels.push(k);
			}
		}

		this._kernels = kernels;

		this._updatePadding();
	}
}
