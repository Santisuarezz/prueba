import type { IPointData } from "pixi.js";
import { Point } from "pixi.js";

export function wrap(input: number, min: number, max: number): number {
	// stolen from haxeflixel
	const range: number = max - min + 1;

	if (input < min) {
		input += range * Math.trunc((min - input) / range + 1);
	}

	return min + ((input - min) % range);
}

export function clamp(input: number, min: number, max: number): number {
	return Math.min(Math.max(input, min), max);
}

export function secondsToMSS(s: number): string {
	s = Math.round(s);
	return `${(s - (s %= 60)) / 60}${9 < s ? ":" : ":0"}${s}`;
}

export function fract(x: number): number {
	return x - Math.floor(x);
}

export function secondsToHMMSS(s: number): string {
	s = Math.round(s);
	if (s == 0) {
		return "00:00";
	}
	const hours: number = Math.floor(s / 3600);
	s %= 3600;
	const minutes: number = Math.floor(s / 60);
	const seconds: number = Math.floor(s % 60);
	return `${hours > 0 ? `${hours.toString()}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function lerpIPointData(a: IPointData, b: IPointData, t: number): IPointData {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function lerpPoint(a: Point, b: Point, t: number): Point {
	return new Point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
}

export function lerp(x: number, y: number, a: number): number {
	return x * (1 - a) + y * a;
}

/**
 * if you give me an inputDataA I return an outputDataA.
 * if you give me an inputDataB I return an outputDataB.
 * then you can give me any input and I will return a value according to the values passed before.
 * If clamp is true, the returns values will be held between outputDataA and outputDataB
 */
export function ruleOfFive(inputDataA: number, outputDataA: number, inputDataB: number, outputDataB: number, input: number, clamp: boolean): number {
	const t: number = (input - inputDataA) / (inputDataB - inputDataA);
	return outputDataA + (outputDataB - outputDataA) * (clamp ? Math.min(Math.max(t, 0), 1) : t);
}

export function ruleOfThree(inputData: number, outputData: number, input: number): number {
	return (input * outputData) / inputData;
}

/**
 * if you give me an inputDataA I return an 0.
 * if you give me an inputDataB I return an 1.
 * then you can give me any input and I will return a value between 0 and 1 according to the values passed before.
 */
export function linearstep(inputDataA: number, inputDataB: number, input: number): number {
	const t: number = (input - inputDataA) / (inputDataB - inputDataA);
	return clamp(t, 0, 1);
}

export function numberWithCommas(value: number): string {
	value = Math.round(value);
	let retval: string = value.toString();
	const arr: Array<string> = new Array<string>();
	do {
		arr.push(retval.substr(-3, 3));
		retval = retval.substring(0, retval.length - 3);
	} while (retval.length > 0);

	arr.reverse();
	return arr.join(",");
}

// #region fuzzy comparisons
export const FLOATING_EPSILON: number = Math.pow(2, -16); // Floating point correction for fuzzy matching needs
export function fuzzyComp(a: number, b: number): 0 | 1 | -1 {
	if (Math.abs(a - b) < FLOATING_EPSILON) {
		return 0;
	}
	return Math.sign(a - b) as 0 | 1 | -1;
}

export function fuzzySign(a: number): 0 | 1 | -1 {
	return fuzzyComp(a, 0);
}

export function fuzzyEq(a: number, b: number): boolean {
	return Math.abs(a - b) < FLOATING_EPSILON;
}
// #endregion
