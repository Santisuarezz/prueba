export interface IPersistanceProvider {
	save(saveslot: string): Promise<void>;
	load(saveslot: string): Promise<void>;
	delete(saveslot: string): Promise<void>;
	getValue<T>(key: string): T;
	setValue<T>(key: string, value: T): T;
	setSavedataVersion(version: string, saveslot: string): Promise<void>;
	getSavedataVersion(saveslot: string): Promise<string>;

	internalMap: Record<string, any>;
}
