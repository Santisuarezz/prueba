export class ObjectPool<T> {
	public get activeSize(): number {
		return this.size - this.inactiveSize;
	}
	public get inactiveSize(): number {
		return this.inactiveObjects.length;
	}
	public get size(): number {
		return this.allObjects.length;
	}

	private _maxSize: number;
	public get maxSize(): number {
		return this._maxSize;
	}
	public set maxSize(value: number) {
		this.purge(value);
		this._maxSize = value;
	}

	private readonly allObjects: T[] = [];
	private readonly inactiveObjects: T[] = [];

	private creator: () => T;
	private destroyer: (t: T) => void;
	private cleaner: (t: T) => void;
	private validator: (t: T) => boolean;

	private objectClass: new (...args: any[]) => T;

	constructor(options: ObjectPoolOptions<T>) {
		this.creator = options.creator;
		this.cleaner = options.cleaner;
		this.validator = options.validator;
		this.destroyer = options.destroyer;
		this._maxSize = options.maxSize || Number.POSITIVE_INFINITY; // 0 also means infinity

		// warmup
		if (options.warmup) {
			this.warmup(options.warmup);
		}
	}

	private createObject(active: boolean): T {
		if (this.size >= this.maxSize) {
			console.warn("The pool is full, can't allocate new object! returning null...");
			return null;
		}

		let newObj;
		if (this.creator) {
			newObj = this.creator();
		} else {
			newObj = new this.objectClass();
		}
		if (!active) {
			this.inactiveObjects.push(newObj);
		}
		this.allObjects.push(newObj);
		return newObj;
	}

	/**
	 * Creates inactive objects until the maximum size of the pool reaches the value specified
	 * @param warmup The number that will be compared with size
	 */
	public warmup(warmup: number): void {
		while (warmup > this.size) {
			this.createObject(false);
		}
	}

	/**
	 * Deletes inactive elements until the pool size (used + unused) reaches maxSize
	 * This doesn't modify the current maxSize of the pool
	 * DANGER: THIS IS A SOMEWHAT SLOW PROCESS DUE TO ARRAY DELETION!
	 * @param maxSize The final pool size.
	 */
	public purge(maxSize: number): void {
		if (maxSize <= this.size) {
			if (maxSize > this.inactiveSize) {
				console.warn("Not enough inactive objects to completely shrink the pool!. Will try to continue shriking it as objects return");
			}
			// while the number of inactive objects is smaller than the amount of active objects I can still have, we poppin'
			while (this.inactiveObjects.length < maxSize - this.activeSize && this.inactiveObjects.length > 0) {
				const destroyedObject = this.inactiveObjects.pop();
				this.allObjects.splice(this.allObjects.indexOf(destroyedObject), 1); // !this is the slow operation here
				if (this.destroyer) {
					this.destroyer(destroyedObject);
				}
			}
		}
	}

	/**
	 * Gets an clean item from the object pool
	 * (Fun fact: cleaning and validation are done when the object is released)
	 * @returns The ready to use object
	 */
	public get(): T {
		if (this.inactiveObjects.length == 0) {
			return this.createObject(true);
		} else {
			return this.inactiveObjects.pop();
		}
	}

	/**
	 * Releases an object inside the pool.
	 * DANGER: This doesn't check if the object is from the pool or not. I trust you.
	 * The object will be deleted if the pool is full (you changed maxSize) or the object fails the validate test
	 * otherwise it will be cleaned and put back in the pool.
	 * @param item The item you want to return to the pool.
	 */
	public put(item: T): void {
		if (this.size > this.maxSize || (this.validator && !this.validator(item))) {
			// we are overcrowded or the item is foobar
			this.allObjects.splice(this.allObjects.indexOf(item), 1); // !this is the slow operation here
			if (this.destroyer) {
				this.destroyer(item);
			}
		} else {
			if (this.cleaner) {
				this.cleaner(item);
			}
			// welcome home kiddo
			this.inactiveObjects.push(item);
		}
	}

	/**
	 * Destroy all objects in the pool
	 */
	public drain(): void {
		this.inactiveObjects.splice(0);
		while (this.allObjects.length > 0) {
			const destroyedObject = this.allObjects.pop();
			if (this.destroyer) {
				this.destroyer(destroyedObject);
			}
		}
	}
}

interface ObjectPoolOptions<T> {
	/**
	 * Function that creates a new object for the pool
	 */
	creator: () => T;

	/**
	 * Function that cleans an object before returning to the pool
	 *
	 * Default: do nothing
	 */
	cleaner?: (t: T) => void;

	/**
	 * Function that validates an object before returning to the pool
	 *
	 * Default: do nothing
	 */
	validator?: (t: T) => boolean;
	/**
	 * Function that destroys the object (used for purges and drains)
	 *
	 * Default: do nothing
	 */
	destroyer?: (t: T) => void;

	/**
	 * Amount of objects to create in the pool
	 *
	 * Default: 0
	 */
	warmup?: number;

	/**
	 * Max objects the pool can store. (0 = infinity)
	 *
	 * Default: Infinity
	 */
	maxSize?: number;
}
