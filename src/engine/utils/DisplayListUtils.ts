import type { DisplayObject } from "pixi.js";
import { Container } from "pixi.js";
import type { Matrix, Point } from "pixi.js";

export function getWorldRotation(object: DisplayObject): number {
	let rv: number = object.rotation;
	while (object.parent != null) {
		object = object.parent;
		rv += object.rotation;
	}
	return rv;
}

export function setWorldRotation(object: DisplayObject, worldRotation: number): void {
	if (object.parent == null) {
		object.rotation = worldRotation;
		return;
	}

	const parentWorldRotation: number = getWorldRotation(object.parent);
	object.rotation = worldRotation - parentWorldRotation;
}

export function kidnapChild(object: DisplayObject, newParent: Container, index: number = -1): void {
	(newParent as any)._recursivePostUpdateTransform();
	const objectPivot: Point = object.pivot.clone();
	object.pivot.set(0);
	(object as any)._recursivePostUpdateTransform();
	const parentInverseWorldTransform: Matrix = newParent.worldTransform.clone().invert();
	const objectWorldTransform: Matrix = object.worldTransform.clone();
	const objectWorldRotation: number = getWorldRotation(object);

	const a: number = parentInverseWorldTransform.a * objectWorldTransform.a + parentInverseWorldTransform.c * objectWorldTransform.b;
	const b: number = parentInverseWorldTransform.b * objectWorldTransform.a + parentInverseWorldTransform.d * objectWorldTransform.b;
	const c: number = parentInverseWorldTransform.a * objectWorldTransform.c + parentInverseWorldTransform.c * objectWorldTransform.d;
	const d: number = parentInverseWorldTransform.b * objectWorldTransform.c + parentInverseWorldTransform.d * objectWorldTransform.d;
	const tx: number = parentInverseWorldTransform.a * objectWorldTransform.tx + parentInverseWorldTransform.c * objectWorldTransform.ty + parentInverseWorldTransform.tx;
	const ty: number = parentInverseWorldTransform.b * objectWorldTransform.tx + parentInverseWorldTransform.d * objectWorldTransform.ty + parentInverseWorldTransform.ty;

	if (index != -1) {
		newParent.addChildAt(object, index);
	} else {
		newParent.addChild(object);
	}

	setWorldRotation(object, objectWorldRotation);
	object.pivot.set(objectPivot.x, objectPivot.y);
	object.position.set(tx, ty);
	object.scale.set(a, d);
	object.skew.set(b, c);
}

export function setWorldTransform(object: DisplayObject, newWorldTransform: Matrix, worldRotation: number = 0): void {
	if (object.parent == null) {
		object.rotation = worldRotation;
		object.position.set(newWorldTransform.tx, newWorldTransform.ty);
		object.scale.set(newWorldTransform.a, newWorldTransform.d);
		object.skew.set(newWorldTransform.b, newWorldTransform.c);
		(object as any)._recursivePostUpdateTransform();
		return;
	}

	(object.parent as any)._recursivePostUpdateTransform();
	const parentInverseWorldTransform: Matrix = object.parent.worldTransform.clone().invert();

	const a: number = parentInverseWorldTransform.a * newWorldTransform.a + parentInverseWorldTransform.c * newWorldTransform.b;
	const b: number = parentInverseWorldTransform.b * newWorldTransform.a + parentInverseWorldTransform.d * newWorldTransform.b;
	const c: number = parentInverseWorldTransform.a * newWorldTransform.c + parentInverseWorldTransform.c * newWorldTransform.d;
	const d: number = parentInverseWorldTransform.b * newWorldTransform.c + parentInverseWorldTransform.d * newWorldTransform.d;
	const tx: number = parentInverseWorldTransform.a * newWorldTransform.tx + parentInverseWorldTransform.c * newWorldTransform.ty + parentInverseWorldTransform.tx;
	const ty: number = parentInverseWorldTransform.b * newWorldTransform.tx + parentInverseWorldTransform.d * newWorldTransform.ty + parentInverseWorldTransform.ty;

	setWorldRotation(object, worldRotation);
	object.position.set(tx, ty);
	object.scale.set(a, d);
	object.skew.set(b, c);
}

export function copyWorldProperties(originalObject: DisplayObject, clon: DisplayObject): void {
	const originalPivot: Point = originalObject.pivot.clone();
	originalObject.pivot.set(0);
	(originalObject as any)._recursivePostUpdateTransform();
	const originalWorldTransform: Matrix = originalObject.worldTransform.clone();
	const originalWorldRotation: number = getWorldRotation(originalObject);

	setWorldTransform(clon, originalWorldTransform, originalWorldRotation);
	originalObject.pivot.set(originalPivot.x, originalPivot.y);
	clon.pivot.set(originalPivot.x, originalPivot.y);
}

export function getAllDescendants(parent: Container | DisplayObject, includeSelf?: boolean): Array<DisplayObject> {
	const rv: Array<DisplayObject> = new Array<DisplayObject>();

	if (parent instanceof Container) {
		for (const child of parent.children) {
			rv.push(...getAllDescendants(child));
			rv.push(child);
		}
	}
	if (includeSelf) {
		rv.push(parent);
	}
	return rv;
}

type Constructor<T> = new (...args: any[]) => T;
export function getAllDescendantsOfClass<T extends DisplayObject>(typ: Constructor<T>, parent: Container, includeSelf?: boolean): Array<T> {
	const descendants: Array<DisplayObject> = getAllDescendants(parent, includeSelf);

	const rv: Array<T> = new Array<T>();
	for (const descendant of descendants) {
		if (descendant instanceof typ) {
			rv.push(descendant);
		}
	}
	return rv;
}

export function isDescendantOf(parent: Container, child: DisplayObject): boolean {
	if (parent == null || child == null) {
		return false;
	}
	let parentI: DisplayObject = child;
	while (parentI.parent != null) {
		const p: DisplayObject = parentI.parent;
		if (p == parent) {
			return true;
		}
		parentI = p;
	}
	return false;
}

export function getRoot(displayObject: DisplayObject): DisplayObject {
	let parent: DisplayObject = displayObject;
	let previousParent: DisplayObject = parent;
	while (parent.parent != null) {
		previousParent = parent;
		parent = parent.parent;
	}
	return previousParent;
}
