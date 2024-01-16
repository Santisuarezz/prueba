import type { IPersistanceProvider } from "./IPersistanceProvider";
import localForage from "localforage";
export class ForagePersistanceProvider implements IPersistanceProvider {
	private readonly cryptoKey: string;
	public constructor(cryptoKey?: string) {
		this.cryptoKey = cryptoKey;
	}

	public internalMap: Record<string, any> = {};

	private xorCrypt(str: string): string {
		// no key, no crypto
		if (!this.cryptoKey) {
			return str;
		}

		let output = "";

		for (let i = 0; i < str.length; ++i) {
			output += String.fromCharCode(str.charCodeAt(i) ^ this.cryptoKey.charCodeAt(i % this.cryptoKey.length));
		}

		return output;
	}

	public async save(saveslot: string): Promise<void> {
		await localForage.setItem(saveslot, this.xorCrypt(JSON.stringify(this.internalMap)));
	}

	public async load(saveslot: string): Promise<void> {
		try {
			this.internalMap = JSON.parse(this.xorCrypt(await localForage.getItem(saveslot)));

			// safety dance
			if (!this.internalMap) {
				this.internalMap = {};
			}
		} catch (error) {
			console.warn("Data inconsistency detected. Nuking...");
			this.delete(saveslot);
		}
	}

	public async setSavedataVersion(version: string, saveslot: string): Promise<void> {
		await localForage.setItem(`${saveslot}_VERSION`, version);
	}
	public async getSavedataVersion(saveslot: string): Promise<string> {
		return await localForage.getItem(`${saveslot}_VERSION`);
	}

	public async delete(saveslot: string): Promise<void> {
		this.internalMap = {};
		await this.save(saveslot);
		console.info("Your savedata has been nuked. Have a nice day");
	}

	public getValue<T>(key: string): T {
		return this.internalMap[key];
	}

	public setValue<T>(key: string, value: T): T {
		this.internalMap[key] = value;
		return value;
	}
}
