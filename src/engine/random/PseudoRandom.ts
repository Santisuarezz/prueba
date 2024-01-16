import Random from "./Random";

/**
 * Not really. These are the Theoretical C values from 0 to 1 in increments of 0.05.
 * The C values are interpolated between these values.
 *
 * These are called "theoretical" because Warcraft III (and by extent dota) had wrong values
 * that only worked up to 25% percent chance because W3 never needed any higher number.
 *
 * Chance is estimated by the formula: C * (1 + countSinceLastTrue)
 */
const C_DOTA_ARRAY: number[] = [
	0, 0.0038, 0.01475, 0.03222, 0.0557, 0.08474, 0.11895, 0.15798, 0.20155, 0.24931, 0.3021, 0.3604, 0.42265, 0.48113, 0.57143, 0.66667, 0.75, 0.82353, 0.88889, 0.94737, 1,
];

/**
 * Warcraft III/Dota 2 Inspired Pseudo Random Number Generator.
 * It is designed to prevent long streaks of bad/good luck.
 * Use this when you have a single chance of something happening.
 * For example: The chance to crit, or the chance to dodge.
 */
export class PseudoRandomBoolean {
	private random: Random;
	public countSinceLastTrue = 0;
	public chanceToBeTrue: number;

	constructor(chanceToBeTrue: number, seed?: number) {
		this.random = new Random(seed);
		this.chanceToBeTrue = chanceToBeTrue;
	}

	private findDotaC(chanceToBeTrue: number): number {
		chanceToBeTrue = Math.min(1, Math.max(0, chanceToBeTrue)) * 20;

		const lowerC = C_DOTA_ARRAY[Math.floor(chanceToBeTrue)];
		const upperC = C_DOTA_ARRAY[Math.ceil(chanceToBeTrue)];

		return lowerC + (upperC - lowerC) * (chanceToBeTrue - Math.floor(chanceToBeTrue));
	}

	public next(): boolean {
		this.countSinceLastTrue++;
		const c = this.findDotaC(this.chanceToBeTrue);
		const r = this.random.random();
		const retval = r < c * this.countSinceLastTrue;
		if (retval) {
			this.countSinceLastTrue = 0;
		}
		return retval;
	}
}

/**
 * Warcraft III/Dota 2 Inspired Pseudo Random Number Generator.
 * It is designed to prevent long streaks of bad/good luck.
 * Initially it will favor the biggest weights, but as time goes on it will favor the smallest weights.
 */
export class PseudoRandomPicker {
	private random: Random;
	public readonly countSinceLastPick: Record<string, number> = {};
	public readonly weights: Record<string, number> = {};

	constructor(weights: Record<string, number>, seed?: number) {
		this.random = new Random(seed);
		this.weights = weights;
	}

	private findDotaC(chanceToBeTrue: number): number {
		chanceToBeTrue = Math.min(1, Math.max(0, chanceToBeTrue)) * 20;

		const lowerC = C_DOTA_ARRAY[Math.floor(chanceToBeTrue)];
		const upperC = C_DOTA_ARRAY[Math.ceil(chanceToBeTrue)];

		return lowerC + (upperC - lowerC) * (chanceToBeTrue - Math.floor(chanceToBeTrue));
	}

	public next(): string {
		// increase all chances
		let accumulated = 0;
		for (const key in this.weights) {
			if (this.countSinceLastPick[key] !== undefined) {
				this.countSinceLastPick[key]++;
			} else {
				this.countSinceLastPick[key] = 1;
			}

			accumulated += this.weights[key];
		}

		const weigthedWeights: number[] = [];
		const weigthedKeys: string[] = [];
		for (const key in this.weights) {
			if (this.countSinceLastPick[key] !== undefined) {
				this.countSinceLastPick[key]++;
			} else {
				this.countSinceLastPick[key] = 1;
			}
			weigthedWeights.push(this.findDotaC(this.weights[key] / accumulated) * this.countSinceLastPick[key]);
			weigthedKeys.push(key);
		}

		const retval: string = weigthedKeys[this.random.pickWeight(...weigthedWeights)];
		this.countSinceLastPick[retval] = 0;

		return retval;
	}
}
