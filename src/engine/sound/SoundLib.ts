import type { PlayOptions, IMediaInstance, Sound } from "@pixi/sound";
import { sound as PixiSoundLibrary } from "@pixi/sound";
import { Easing, Tween } from "tweedle.js";

/** A volume/IMediaInstance pair used in {@link SoundLib.musicMap} */
type MusicMapPair = { volume: number; instance: IMediaInstance };
/**
 * Static class to manage sounds.
 *
 * The biggest difference between Music and Sound is that Musics are
 * stored inside a map for easy control while sounds are more of a "fire-and-forget" nature.
 *
 * The 2 main structures for this class are {@link IMediaInstance} and {@link Sound} classes:
 *
 * `IMediaInstance` is like a Sprite. Changes to this object wont affect others.
 * **Warning**: the object is unusable after it's stoped.
 *
 * `Sound` objects is like a Texture, anything modified here will affect *every* other `IMediaInstance` attached to it.
 */
export class SoundLib {
	/** Direct access to the pixi sound library for advanced use. */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public static readonly PixiSoundLibrary = PixiSoundLibrary;

	/** Currently playing music, for volume and other control purposes */
	private static musicMap: Map<string, MusicMapPair> = new Map<string, MusicMapPair>();

	/** Currently playing sounds for overlap checking purposes. */
	private static soundSet: Set<string> = new Set<string>();

	private static _musicVolume = 1;
	public static get musicVolume(): number {
		return SoundLib._musicVolume;
	}
	/** The music volume for every `Music`. 1 = 100% */
	public static set musicVolume(value) {
		SoundLib._musicVolume = value;
		SoundLib.musicMap.forEach(SoundLib.internalSetMusicVolume);
	}
	private static _muteMusic = false;
	/** If true, every music's volume will be set to 0 */
	public static set muteMusic(value: boolean) {
		SoundLib._muteMusic = value;
		SoundLib.musicMap.forEach(SoundLib.internalSetMusicVolume);
	}
	public static get muteMusic(): boolean {
		return SoundLib._muteMusic;
	}
	public static soundVolume = 1;
	/** The time Sounds (**not** these {@link Sound}) are unable to be played again */
	public static overlapTime = 0.1;
	/** If true, every sound's (**not** these {@link Sound}) volume will be set to 0 */
	public static muteSound = false;

	/** Sets the volume of an instance, taking into consideration the global music volume ({@link SoundLib.musicVolume}) and if it's muted ({@link SoundLib.muteMusic}) */
	private static internalSetMusicVolume(music: MusicMapPair): void {
		music.instance.volume = SoundLib.musicVolume * (SoundLib._muteMusic ? 0 : 1) * music.volume;
	}

	/**
	 * Gets the volume of a certain music
	 *
	 * The volume in the `IMediaInstance` is not the volume you get here because it's affected by other factors (see {@link SoundLib.internalSetMusicVolume})
	 */
	public static getMusicVolume(name: string): number {
		if (SoundLib.musicMap.has(name)) {
			return SoundLib.musicMap.get(name).volume;
		} else {
			console.warn(`Music '${name}' isn't playing. Can't read volume!`);
			return undefined;
		}
	}
	/**
	 * Sets the volume of a certain music
	 *
	 * The volume in the `IMediaInstance` is not the volume you set here because it's affected by other factors (see {@link SoundLib.internalSetMusicVolume})
	 */
	public static setMusicVolume(name: string, newVolume: number): void {
		if (SoundLib.musicMap.has(name)) {
			const musicObject = SoundLib.musicMap.get(name);
			musicObject.volume = newVolume;
			SoundLib.internalSetMusicVolume(musicObject);
		} else {
			console.warn(`Music '${name}' isn't playing. Can't write volume!`);
		}
	}

	/**
	 * **ADVANCED USE ONLY**
	 * This can be used to apply filters or other crazy manipulations on music.
	 * Don't try to change the volume from here! use {@link SoundLib.setMusicVolume} instead!
	 */
	public static getMusicInstance(name: string): IMediaInstance | undefined {
		if (SoundLib.musicMap.has(name)) {
			return SoundLib.musicMap.get(name).instance;
		} else {
			console.warn(`Music '${name}' isn't playing. Can't read instance!`);
			return undefined;
		}
	}

	/** Removes the music entries (in {@link SoundLib.musicMap}) that are already finished */
	private static purgeMusicMap(): void {
		for (const pair of SoundLib.musicMap.entries()) {
			if (pair[1].instance.loop == false && pair[1].instance.progress == 1) {
				SoundLib.musicMap.delete(pair[0]); // this should be safe in javascript...
			}
		}
	}

	/**
	 * Plays some music.
	 *
	 * If the music was already playing, it won't do anything.
	 * @param name The name of the music
	 * @param options Aditional parameters for the music. By default loops the music and sets the volume at 1 (Documentation [here](https://pixijs.io/sound/docs/PlayOptions.html))
	 */
	public static playMusic(name: string, options?: PlayOptions): void {
		SoundLib.purgeMusicMap();
		options = Object.assign({ loop: true, volume: 1 }, options);
		if (!SoundLib.musicMap.has(name)) {
			const mediaInstance: IMediaInstance = PixiSoundLibrary.play(name, options) as IMediaInstance;
			const musicObject = { volume: options.volume, instance: mediaInstance };
			SoundLib.internalSetMusicVolume(musicObject);
			SoundLib.musicMap.set(name, musicObject);
		} else {
			console.warn(`Music '${name}' is already playing!`);
		}
	}

	/**
	 * Stops some music with a fade (see {@link SoundLib.fadeMusic})
	 *
	 * If the music wasn't already playing, it won't do anything.
	 * @param name The name of the music
	 * @param fadeTime the fade's duration in miliseconds.
	 */
	public static async stopMusic(name: string, fadeTime: number = 0): Promise<void> {
		if (SoundLib.musicMap.has(name)) {
			if (fadeTime != 0) {
				await SoundLib.fadeMusic(name, 0, fadeTime);
			}
			const soundInstance = SoundLib.musicMap.get(name).instance;
			if (soundInstance.paused) {
				soundInstance.paused = false;
			}
			soundInstance.destroy();
			SoundLib.musicMap.delete(name);
		} else {
			console.warn(`Music '${name}' is not playing. Can't be stopped!`);
		}
	}

	/**
	 * Stops every music that is playing.
	 *
	 * Useful if if you want to change the music but don't know what is currently playing.
	 * @param fadeTime the fade's duration in miliseconds.
	 */
	public static stopAllMusic(fadeTime: number = 0): void {
		SoundLib.musicMap.forEach((_, name: string) => {
			SoundLib.stopMusic(name, fadeTime);
		});
	}

	/**
	 * Pauses some music
	 *
	 * If the music wasn't already playing, it won't do anything.
	 * @param name The name of the music
	 */
	public static pauseMusic(name: string): void {
		if (SoundLib.musicMap.has(name) && !SoundLib.musicMap.get(name).instance.paused) {
			SoundLib.musicMap.get(name).instance.paused = true;
		} else {
			console.warn(`Music '${name}' was already paused and can't be paused again!`);
		}
	}

	/**
	 * Resumes some music.
	 *
	 * If the music was already playing, it won't do anything.
	 * @param name The name of the music
	 */
	public static resumeMusic(name: string): void {
		if (SoundLib.musicMap.has(name) && SoundLib.musicMap.get(name).instance.paused) {
			SoundLib.musicMap.get(name).instance.paused = false;
		} else {
			console.warn(`Music '${name}' was not paused and can't be resumed!`);
		}
	}

	/**
	 * Changes the volume of a music linearly over time.
	 * @param name The name of the music
	 * @param targetVolume The volume of the music
	 * @param duration The duration of the fade in miliseconds
	 * @returns A promise resolved when the volume is at `targetVolume`
	 */
	public static fadeMusic(name: string, targetVolume: number, duration: number): Promise<void> {
		return new Promise((resolve) => {
			if (SoundLib.musicMap.get(name) !== undefined) {
				const musicObject = SoundLib.musicMap.get(name);
				new Tween(musicObject)
					.to({ volume: targetVolume }, duration)
					.easing(Easing.Linear.None)
					.onUpdate(() => SoundLib.internalSetMusicVolume(musicObject))
					.onComplete(() => resolve())
					.start();
			} else {
				console.warn(`Music '${name}' is not playing. Can't fade!`);
				resolve();
			}
		});
	}

	/**
	 * Plays a single sound.
	 * The `IMediaInstance` is not stored anywhere.
	 * It is up to you to save it if you need to manipulate it.
	 * @param name The name of the sound
	 * @param options Aditional parameters for the sound. By default doens't loop the sound and sets the volume at 1
	 * (Documentation [here](https://pixijs.io/sound/docs/PlayOptions.html)).
	 * It has an aditional option named `allowOverlap`. If true it will ignore the {@link SoundLib.overlapTime} and play the sound anyway. Default false.
	 */
	public static playSound(name: string, options: PlayOptions & { allowOverlap?: boolean }): IMediaInstance | undefined {
		options = Object.assign({ loop: false, volume: 1, allowOverlap: false }, options);
		if (options.allowOverlap || !SoundLib.soundSet.has(name)) {
			const retval = PixiSoundLibrary.play(name, options) as IMediaInstance;
			retval.volume = options.volume * SoundLib.soundVolume * (SoundLib.muteSound ? 0 : 1);
			if (!options.allowOverlap) {
				SoundLib.soundSet.add(name);
				// timeout instead of Tween to keep dependencies to a minimum and also deatach from the tick.
				setTimeout(() => {
					SoundLib.soundSet.delete(name);
				}, SoundLib.overlapTime);
			}
			return retval;
		} else {
			// No warn here, the whole point of not allowing overlap is to stop when sounds get fired too many times in a single frame
			return undefined;
		}
	}

	/**
	 * **ADVANCED USE ONLY**
	 * Gets the internal Sound object.
	 * Consider this the Texture of a sound
	 */
	public static getSound(name: string): Sound {
		return PixiSoundLibrary.find(name);
	}
}
