import type { Group } from "tweedle.js";
import { Tween } from "tweedle.js";

/**
 * Simple timer implementation using Tween.js
 * 
 * Example:
 * ```
 * Timer.delay(5000, () => console.log("5 seconds passed"));
 * ```
 * 
 * Or fully configurable
 * ```
    new Timer()
        .to(5000)
        .onComplete(() => console.log("5 seconds passed!"))
        .start();
	```
 */
export class Timer extends Tween<number> {
	constructor(group?: Group) {
		super(1, group);
	}
	public override to(duration: number): this {
		return super.to({}, duration);
	}

	public static delay(duration: number, call: Function, group?: Group): void {
		new Timer(group)
			.to(duration)
			.onComplete(() => call())
			.start();
	}

	public static wait(duration: number, group?: Group): Promise<void> {
		return new Promise((resolve) => {
			new Timer(group)
				.to(duration)
				.onComplete(() => resolve())
				.start();
		});
	}
}
