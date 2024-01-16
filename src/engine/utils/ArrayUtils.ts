export function flatten<T>(array: T[], depth: number = 1): T[] {
	const flattend = [];
	for (const el of array) {
		if (Array.isArray(el) && depth > 0) {
			flattend.push(...flatten(el, depth - 1));
		} else {
			flattend.push(el);
		}
	}
	return flattend;
}

/**
 * Stable sort.
 * NOT IN PLACE.
 * If your compare function returns a falsy value (undefined, 0 or NaN) then it retains the order of those two elements.
 * @param arr The array to sort.
 * @param compare compare function. If it returns a falsy value (undefined, 0 or NaN) then it retains the order of those two elements.
 * @returns sort The sorted array. Again, THIS IS NOT IN PLACE!
 */
export function stableSort<T>(arr: T[], compare: (a: T, z: T) => number): T[] {
	// Store the index of all the elements and use the indexs as tiebreaker for the regular sort.
	return arr
		.map((item, index) => ({ item, index }))
		.sort((a, b) => compare(a.item, b.item) || a.index - b.index)
		.map(({ item }) => item);
}
