export class BiMap<K, V> {
	private keyValueMap: Map<K, V>;
	private valueKeyMap: Map<V, K>;

	constructor() {
		this.keyValueMap = new Map();
		this.valueKeyMap = new Map();
	}

	public set(key: K, value: V): void {
		this.keyValueMap.set(key, value);
		this.valueKeyMap.set(value, key);
	}

	public get(key: K): V {
		return this.keyValueMap.get(key);
	}

	public getByValue(valueKey: V): K {
		return this.valueKeyMap.get(valueKey);
	}

	public delete(key: K): void {
		const value: V = this.keyValueMap.get(key);
		this.keyValueMap.delete(key);
		this.valueKeyMap.delete(value);
	}

	public clear(): void {
		this.keyValueMap.clear();
		this.valueKeyMap.clear();
	}

	public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
		this.keyValueMap.forEach(callbackfn, thisArg);
	}
}
