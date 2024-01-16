export function mapReplacer(key: any, value: any): any {
	const originalObject = this[key];
	if (originalObject instanceof Map) {
		return {
			dataType: "Map",
			value: Array.from(originalObject.entries()), // or with spread: value: [...originalObject]
		};
	} else {
		return value;
	}
}

export function mapReviver(_: any, value: any): any {
	if (typeof value === "object" && value !== null) {
		if (value.dataType === "Map") {
			return new Map(value.value);
		}
	}
	return value;
}
