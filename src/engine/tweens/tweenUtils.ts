import type { Tween } from "tweedle.js";

export namespace TweenUtils {
	export function promisify<T>(tween: Tween<T>): Promise<{ object: T; tween: Tween<T> }> {
		const oldCallback = (tween as any)._onCompleteCallback;

		return new Promise((resolve) => {
			tween.onComplete((object, tween) => {
				if (oldCallback) {
					oldCallback(object, tween);
				}
				resolve({ object, tween });
			});
		});
	}
}
