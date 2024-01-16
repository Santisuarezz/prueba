import type { Container } from "pixi.js";
import type { Rectangle } from "pixi.js";

/** Static class with helper methods to aid in the scale of pixi's containers to diferent screen resolutions. */
export class ScaleHelper {
	private constructor() {}
	/**
	 * The width of the ideal screen.
	 *
	 * The ideal screen is a section of the screen that should always be visible in any resolution
	 */
	public static IDEAL_WIDTH: number = 1920;

	/**
	 * The height of the ideal screen.
	 *
	 * The ideal screen is a section of the screen that should always be visible in any resolution
	 */
	public static IDEAL_HEIGHT: number = 1080;

	/** A function used to select between the X scale or the Y scale values */
	public static DEFAULT_TIEBREAKER: (a: number, b: number) => number = Math.min;

	/** Math.max */
	public static readonly FILL: (a: number, b: number) => number = Math.max;

	/** Math.min */
	public static readonly FIT: (a: number, b: number) => number = Math.min;

	/**
	 * Returns the scale to go from the ideal screen to the new screen times target
	 * @param target A number to multiply the result (I guess)
	 * @param idealScreenW The width of the ideal screen.
	 * @param idealScreenH The height of the ideal screen.
	 * @param screenW The new screen width.
	 * @param screenH The new screen height.
	 * @param tieBreakerFunction A function used to determine what the final scale is. Since you get 2 scale values (X and Y), it's necesary to determine only one value.
	 */
	public static idealScale(
		target: number = 1,
		screenW: number,
		screenH: number,
		idealScreenW: number = ScaleHelper.IDEAL_WIDTH,
		idealScreenH: number = ScaleHelper.IDEAL_HEIGHT,
		tieBreakerFunction: (a: number, b: number) => number = ScaleHelper.DEFAULT_TIEBREAKER
	): number {
		return tieBreakerFunction(screenW / idealScreenW, screenH / idealScreenH) * target;
	}

	/**
	 * Scales a container to be a fraction of the new screen.
	 * @param displayObject The container to scale.
	 * @param factorOfScreenSizeX How much of the new screen's width will this object use (1 for all the width)
	 * @param factorOfScreenSizeY How much of the new screen's height will this object use (1 for all the height)
	 * @param screenW The new screen width.
	 * @param screenH The new screen height.
	 * @param tieBreakerFunction A function used to determine what the final scale is. Since you get 2 scale values (X and Y), it's necesary to determine only one value.
	 */
	public static setScaleRelativeToScreen(
		displayObject: Container,
		screenW: number,
		screenH: number,
		factorOfScreenSizeX: number,
		factorOfScreenSizeY: number,
		tieBreakerFunction: (a: number, b: number) => number = ScaleHelper.DEFAULT_TIEBREAKER
	): number {
		const displayObjectLocalBounds: Rectangle = displayObject.getLocalBounds();
		displayObject.scale.set(
			tieBreakerFunction((screenW * factorOfScreenSizeX) / displayObjectLocalBounds.width, (screenH * factorOfScreenSizeY) / displayObjectLocalBounds.height)
		);
		return displayObject.scale.x;
	}

	/**
	 * Scales a container to be a fraction of the new screen.
	 * @param originalWidth the width of the object we want to modify.
	 * @param originalHeight the height of the object we want to modify.
	 * @param screenW The new screen width.
	 * @param screenH The new screen height.
	 * @param factorOfScreenSizeX How much of the new screen's width will this object use (1 for all the width)
	 * @param factorOfScreenSizeY How much of the new screen's height will this object use (1 for all the height)
	 * @param tieBreakerFunction A function used to determine what the final scale is. Since you get 2 scale values (X and Y), it's necesary to determine only one value.
	 */
	public static screenScale(
		originalWidth: number,
		originalHeight: number,
		screenW: number,
		screenH: number,
		factorOfScreenSizeX?: number,
		factorOfScreenSizeY?: number,
		tieBreakerFunction: (a: number, b: number) => number = ScaleHelper.DEFAULT_TIEBREAKER
	): number {
		return tieBreakerFunction((screenW * (factorOfScreenSizeX ?? 1)) / originalWidth, (screenH * (factorOfScreenSizeY ?? 1)) / originalHeight);
	}

	/**
	 * Scales a container to be a fraction of the new screen.
	 * @param originalSize the size of the object we want to modify.
	 * @param spaceAvailable The space available.
	 * @param factorOfSpaceAvailable How much of the spaceAvailable will this object use (1 for all the size)
	 */
	public static screenScale1D(originalSize: number, spaceAvailable: number, factorOfSpaceAvailable?: number): number {
		return (spaceAvailable * (factorOfSpaceAvailable ?? 1)) / originalSize;
	}

	/**
	 * Takes a container where it look fine in a certain screen size (the ideal) and scales it to a new resolution.
	 * @param displayObject The container to scale.
	 * @param idealScreenW The width of the ideal screen.
	 * @param idealScreenH The height of the ideal screen.
	 * @param screenW The new screen width.
	 * @param screenH The new screen height.
	 * @param tieBreakerFunction A function used to determine what the final scale is. Since you get 2 scale values (X and Y), it's necesary to determine only one value.
	 */
	public static setScaleRelativeToIdeal(
		displayObject: Container,
		screenW: number,
		screenH: number,
		idealScreenW: number = ScaleHelper.IDEAL_WIDTH,
		idealScreenH: number = ScaleHelper.IDEAL_HEIGHT,
		tieBreakerFunction: (a: number, b: number) => number = ScaleHelper.DEFAULT_TIEBREAKER
	): number {
		displayObject.scale.set(tieBreakerFunction(screenW / idealScreenW, screenH / idealScreenH));
		return displayObject.scale.x;
	}

	/**
	 * Forces width. Always returns the first parameter given
	 * @param w
	 * @param _h
	 * @returns width
	 */
	public static forceWidth(w: number, _h: number): number {
		return w;
	}

	/**
	 * Forces height. Always returns the second parameter given
	 * @param _w
	 * @param h
	 * @returns height
	 */
	public static forceHeight(_w: number, h: number): number {
		return h;
	}
}
