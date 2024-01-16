import type { IScene } from "../IScene";

export interface IRenderer {
	width: number;
	height: number;
	devicePixelRatio: number;
	readonly canvas: HTMLCanvasElement;
	backgroundColor: { r: number; g: number; b: number; a: number };

	preRender?(): void;
	postRender?(): void;
	renderScene(sceneToRender: IScene): void;
	resize(w: number, h: number, devicePixelRatio?: number): void;

	externalPause?(): void;
	externalResume?(): void;
	getDetails(): string;
}
