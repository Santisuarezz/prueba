import XSadd from "ml-xsadd";

export default class Random {
	public static readonly shared = new Random();
	private readonly xorshift: XSadd;
	constructor(seed?: number) {
		this.xorshift = new XSadd(seed ?? Math.floor(Math.random() * Math.pow(2, 32)));
	}
	/** Returns a random float in the range [minInc, maxExc) */
	public random(minInc = 0, maxExc = 1): number {
		return this.xorshift.getFloat() * (maxExc - minInc) + minInc;
	}
	/** Returns a random integer in the range [minInc, maxExc) */
	public randomInt(minInc: number, maxExc: number): number {
		return (this.xorshift.getUint32() % (maxExc - minInc)) + minInc;
	}
	/** Returns a random float in the range [center - distanceToEdges, center + distanceToEdges) */
	public randomCentered(center: number, distanceToEdges: number): number {
		return this.random(center - distanceToEdges, center + distanceToEdges);
	}
	/** Returns a random integer in the range [center - distanceToEdges, center + distanceToEdges) */
	public randomIntCentered(center: number, distanceToEdges: number): number {
		return this.randomInt(center - distanceToEdges, center + distanceToEdges);
	}
	/**
	 * Picks an element from an array
	 * @param from The array to pick an element from.
	 * @param start The first index of the array, inclusive.
	 * @param end The last index of the array, exclusive.
	 */
	public pickOne<T>(from: T[], start: number = 0, end: number = from.length): T {
		return from[this.randomInt(start, end)];
	}

	/**
	 * Pick an index from an array of weights
	 * @param weights An array of weights
	 * @returns the picked index from the array.
	 */
	public pickWeight(...weights: number[]): number {
		if (weights.length <= 1) {
			if (weights.length == 1) {
				return 0;
			} else {
				throw new Error("This function really doesn't make sense to use without parameters");
			}
		}
		const maxValue = weights.reduce((prevValue, currentValue) => {
			return prevValue + currentValue;
		});
		const randomValue = this.random(0, maxValue);
		let index = 0;
		let acc = 0;
		do {
			acc += weights[index++];
		} while (acc <= randomValue);
		return index - 1;
	}
	public shuffleArray<T>(array: T[]): T[] {
		// Bad implementation of Fisher and Yates' shuffle algorithm
		// its back!
		let aux: T = null;
		let random: number = 0;
		let i = array.length;
		while (i-- > 1) {
			// for (let i = array.length; i > 1; i--) {
			random = this.randomInt(0, i + 1);
			aux = array[random];
			array[random] = array[i];
			array[i] = aux;
		}
		return array;
	}

	public seed(newSeed: number): void {
		this.xorshift.init(newSeed);
	}
}
