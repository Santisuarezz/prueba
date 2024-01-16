import type { IScene } from "../IScene";
import type { IRenderer } from "./IRenderer";
import { autoDetectRenderer, type IRendererOptionsAuto, Program, VERSION, type IRenderer as PixiRendererInterface } from "pixi.js";
import { PRECISION } from "pixi.js";
import { Container } from "pixi.js";
import { DEBUG } from "../../../flags";
import { ScaleHelper } from "../../utils/ScaleHelper";
export class PixiRenderer implements IRenderer {
	public width: number;
	public height: number;
	public devicePixelRatio: number;

	public readonly letterboxScale: boolean;

	public get canvas(): HTMLCanvasElement {
		return this.pixiRenderer.view;
	}

	public get backgroundColor(): { r: number; g: number; b: number; a: number } {
		const rgba: [number, number, number, number] = (this.pixiRenderer as any).background.colorRgba ?? [0, 0, 0, 0];
		return { r: rgba[0], g: rgba[1], b: rgba[2], a: rgba[3] };
	}
	public set backgroundColor(value: { r: number; g: number; b: number; a: number }) {
		(this.pixiRenderer as any).background.color = (value.r << 16) | (value.g << 8) | value.b;
		(this.pixiRenderer as any).background.alpha = value.a;
	}

	/**
	 * The reference to the pixi renderer
	 */
	public readonly pixiRenderer: PixiRendererInterface<HTMLCanvasElement>;

	private inputCatcher: Container;

	public constructor(pixiOptions?: PixiRendererOptions, letterboxScale?: boolean) {
		// some settings that can't be set from outside
		Program.defaultFragmentPrecision = PRECISION.HIGH;

		this.devicePixelRatio = pixiOptions.resolution ?? (devicePixelRatio || 1);
		this.width = pixiOptions.width;
		this.height = pixiOptions.height;

		// If you didn't pick, I would suggest not clearing before render because we will need to render a loooot of stuff
		const auxPixiOptions = Object.assign<PixiRendererOptions, PixiRendererOptions>({ clearBeforeRender: false }, pixiOptions);
		// initialize the pixi renderer
		this.pixiRenderer = autoDetectRenderer<HTMLCanvasElement>(auxPixiOptions);

		this.letterboxScale = Boolean(letterboxScale);

		this.inputCatcher = new Container();
		if (pixiOptions.interactionTestsAllScenes) {
			Object.defineProperty(this.pixiRenderer, "lastObjectRendered", {
				get: () => {
					return this.inputCatcher;
				},
			});
		}

		if (DEBUG) {
			// hopefully enabling pixi debugger one day....
			(globalThis as any).__PIXI_RENDERER__ = this.pixiRenderer; // eslint-disable-line
		}
	}

	/**
	 * Saves image by drawing it to a canvas, then creating a blob, then a link and then clicking the link.
	 * @param objectToSave A pixi object you want to turn into an image
	 * @param filename Please include your extension here, thx
	 * @param [mimeType] What filetype you want to use. png, jpg, webp, or some other mime that I don't know of.
	 * @param [quality] between 0 and 1. For png it means nothing, jpg default 0.80, webp default 0.92
	 */
	// public saveImage(objectToSave: DisplayObject | RenderTexture, filename: string, mimeType?: "image/png" | "image/jpeg" | "image/webp", quality?: number): void;
	// public saveImage(objectToSave: DisplayObject | RenderTexture, filename: string, mimeType?: string, quality?: number): void;
	// public saveImage(objectToSave: DisplayObject | RenderTexture, filename: string, mimeType: string = "image/png", quality?: number): void {
	// 	(this.pixiRenderer.plugins.extract as Extract).canvas(objectToSave).toBlob(
	// 		(blob) => {
	// 			const anchor = document.createElement("a");
	// 			anchor.download = filename;
	// 			anchor.href = URL.createObjectURL(blob);
	// 			anchor.click(); // ✨ magic!
	// 			URL.revokeObjectURL(anchor.href); // remove it from memory and save on memory! 😎
	// 		},
	// 		mimeType,
	// 		quality
	// 	);
	// }

	public preRender(): void {
		if ("clear" in this.pixiRenderer) {
			this.pixiRenderer.clear();
		}

		this.inputCatcher.removeChildren();
	}

	public postRender(): void {
		// track the state of the gl
	}
	public renderScene(sceneToRender: IScene): void {
		let couldRender: boolean = false;
		// If I have stages in the scene
		if (sceneToRender.stages) {
			// for each stage
			for (const stage of sceneToRender.stages) {
				// double check in case a punk stored a null in that array
				if (stage) {
					if (stage instanceof Container) {
						// Do I need all this resets?
						this.pixiRenderer.render(stage);
						couldRender = true;

						if (stage.interactiveChildren) {
							this.inputCatcher.addChild(stage);
						}
					}
				}
			}
		}
		if (!couldRender) {
			console.warn(`Pixi render failed to render your scene: ${sceneToRender.constructor.name}`);
		}
	}
	public resize(w: number, h: number, devicePixelRatio?: number): void {
		document
			.getElementById("viewport")
			.setAttribute("content", "width=device-width, minimum-scale=1.0, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover");

		this.devicePixelRatio = devicePixelRatio || 1;
		this.width = w;
		this.height = h;

		if (this.letterboxScale) {
			// Code below makes the game "letterbox scale"
			this.width = ScaleHelper.IDEAL_WIDTH;
			this.height = ScaleHelper.IDEAL_HEIGHT;

			const pixiView: HTMLCanvasElement = this.pixiRenderer.view;
			const scale = Math.min(w / ScaleHelper.IDEAL_WIDTH, h / ScaleHelper.IDEAL_HEIGHT);
			pixiView.style.width = `${Math.floor(scale * ScaleHelper.IDEAL_WIDTH)}px`;
			pixiView.style.height = `${Math.floor(scale * ScaleHelper.IDEAL_HEIGHT)}px`;
			pixiView.style.marginLeft = pixiView.style.marginRight = `${(w - Math.floor(scale * ScaleHelper.IDEAL_WIDTH)) / 2}px`;
			pixiView.style.marginTop = pixiView.style.marginBottom = `${(h - Math.floor(scale * ScaleHelper.IDEAL_HEIGHT)) / 2}px`;
		} else {
			// This just werks
			this.devicePixelRatio = devicePixelRatio || 1;
			this.width = w;
			this.height = h;

			(this.pixiRenderer as any).resolution = this.devicePixelRatio;
			this.pixiRenderer.resize(w, h);
		}
	}
	public externalPause?(): void {
		// ! KILL THE INPUTS IN PIXI.
		this.pixiRenderer.plugins.interaction.useSystemTicker = false;
	}
	public externalResume?(): void {
		// ! REVIVE THE INPUTS IN PIXI.
		this.pixiRenderer.plugins.interaction.useSystemTicker = true;
	}

	public getDetails(): string {
		return `Pixi Renderer - PixiJS v${VERSION}`;
	}
}

export interface PixiRendererOptions extends Partial<IRendererOptionsAuto> {
	interactionTestsAllScenes?: boolean;
}
