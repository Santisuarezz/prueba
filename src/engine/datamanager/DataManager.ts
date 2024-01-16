import { PROJECT_NAME } from "../../flags";
import type { IPersistanceProvider } from "./IPersistanceProvider";

export class DataManager {
	private constructor() {}

	private static instance: IPersistanceProvider;
	private static savedataVersion: string;
	private static savedataConflictSolver: (oldSavedata: Record<string, any>, oldVersion: string) => Record<string, any>;

	private static readonly DEFAULT_SAVESLOT: string = `SAVEDATA_${PROJECT_NAME}`;

	public static initialize(
		persistanceProvider: IPersistanceProvider,
		savedataVersion: string = "1",
		savedataConflictSolver: (oldSavedata: Record<string, any>, oldVersion: string) => Record<string, any> = (_) => ({})
	): void {
		DataManager.instance = persistanceProvider;
		DataManager.savedataVersion = savedataVersion;
		DataManager.savedataConflictSolver = savedataConflictSolver;
	}
	public static save(saveslot?: string): Promise<void> {
		if (!DataManager.instance) {
			console.warn("You didn't call Initialize!");
			return Promise.reject("You didn't call Initialize!");
		}
		return DataManager.instance.save(saveslot ?? DataManager.DEFAULT_SAVESLOT);
	}

	public static async load(saveslot?: string): Promise<void> {
		if (!DataManager.instance) {
			console.warn("You didn't call Initialize!");
			return Promise.reject("You didn't call Initialize!");
		}
		await DataManager.instance.load(saveslot ?? DataManager.DEFAULT_SAVESLOT);
		const storedVersion = await DataManager.instance.getSavedataVersion(saveslot ?? DataManager.DEFAULT_SAVESLOT);
		if (storedVersion != DataManager.savedataVersion) {
			console.warn("Savedata version missmatch!");
			DataManager.instance.internalMap = this.savedataConflictSolver(DataManager.instance.internalMap, storedVersion);
			await DataManager.instance.setSavedataVersion(DataManager.savedataVersion, saveslot ?? DataManager.DEFAULT_SAVESLOT);
			await DataManager.save(saveslot ?? DataManager.DEFAULT_SAVESLOT);
		}
		return;
	}

	public static delete(saveslot?: string): Promise<void> {
		if (!DataManager.instance) {
			console.warn("You didn't call Initialize!");
			return Promise.reject("You didn't call Initialize!");
		}
		return DataManager.instance.delete(saveslot ?? DataManager.DEFAULT_SAVESLOT);
	}

	public static getValue<T>(key: string): T {
		if (!DataManager.instance) {
			console.warn("You didn't call Initialize!");
			return null;
		}
		return DataManager.instance.getValue(key);
	}

	public static setValue<T>(key: string, value: T): T {
		if (!DataManager.instance) {
			console.warn("You didn't call Initialize!");
			return null;
		}
		return DataManager.instance.setValue(key, value);
	}
}
