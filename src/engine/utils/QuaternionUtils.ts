import type { Container3D } from "pixi3d/pixi7";
import { Point3D, Quaternion } from "pixi3d/pixi7";

/** returns the direction vector of a quaternion given. For example: to know the right of a quat, pass as parameter the quat and in direction pass a Point3D(1, 0, 0) */
function getVectorDirection(quat: Quaternion, direction: Point3D): Point3D {
	const num: number = quat.x * 2;
	const num2: number = quat.y * 2;
	const num3: number = quat.z * 2;
	const num4: number = quat.x * num;
	const num5: number = quat.y * num2;
	const num6: number = quat.z * num3;
	const num7: number = quat.x * num2;
	const num8: number = quat.x * num3;
	const num9: number = quat.y * num3;
	const num10: number = quat.w * num;
	const num11: number = quat.w * num2;
	const num12: number = quat.w * num3;
	const result: Point3D = new Point3D();
	result.x = (1 - (num5 + num6)) * direction.x + (num7 - num12) * direction.y + (num8 + num11) * direction.z;
	result.y = (num7 + num12) * direction.x + (1 - (num4 + num6)) * direction.y + (num9 - num10) * direction.z;
	result.z = (num8 - num11) * direction.x + (num9 + num10) * direction.y + (1 - (num4 + num5)) * direction.z;
	return result;
}

/** This function will return the positive Z vector of a rotation. This function is like the transform.forward in unity, but as three uses the right hand rule, we had to call it this way. */
export function getZPositive(quat: Quaternion): Point3D {
	return getVectorDirection(quat, new Point3D(0, 0, 1));
}

/** This function will return the negative Z vector of a rotation. This function is like the -transform.forward in unity, but as three uses the right hand rule, we had to call it this way. */
export function getZNegative(quat: Quaternion): Point3D {
	return getVectorDirection(quat, new Point3D(0, 0, -1));
}

/** This function will return the positive X vector of a rotation. This function is like the -transform.right in unity, but as three uses the right hand rule, we had to call it this way. */
export function getXPositive(quat: Quaternion): Point3D {
	return getVectorDirection(quat, new Point3D(1, 0, 0));
}

/** This function will return the negative X vector of a rotation. This function is like the transform.right in unity, but as three uses the right hand rule, we had to call it this way. */
export function getXNegative(quat: Quaternion): Point3D {
	return getVectorDirection(quat, new Point3D(-1, 0, 0));
}

/** This function will return the positive Y vector of a rotation. This function is like the transform.up in unity */
export function getUp(quat: Quaternion): Point3D {
	return getVectorDirection(quat, new Point3D(0, 1, 0));
}

/** This function will return the negative Y vector of a rotation. This function is like the -transform.up in unity */
export function getDown(quat: Quaternion): Point3D {
	return getVectorDirection(quat, new Point3D(0, -1, 0));
}

/** This function is like the lookAt of three, but with the difference that it also accepts an up vector, to know the roll of the quaternion to point towards that forward */
export function lookRotation(forward: Point3D, up?: Point3D): Quaternion {
	const vector: Point3D = forward.normalize();

	const vector2: Point3D = Point3D.cross(up ?? new Point3D(0, 1, 0), vector).normalize();
	const point3D: Point3D = Point3D.cross(vector, vector2);

	const m00: number = vector2.x;
	const m01: number = vector2.y;
	const m02: number = vector2.z;
	const m10: number = point3D.x;
	const m11: number = point3D.y;
	const m12: number = point3D.z;
	const m20: number = vector.x;
	const m21: number = vector.y;
	const m22: number = vector.z;

	const num8: number = m00 + m11 + m22;
	const quaternion = new Quaternion();

	if (num8 > 0) {
		let num: number = Math.sqrt(num8 + 1);
		quaternion.w = num * 0.5;
		num = 0.5 / num;
		quaternion.x = (m12 - m21) * num;
		quaternion.y = (m20 - m02) * num;
		quaternion.z = (m01 - m10) * num;
		return quaternion;
	}
	if (m00 >= m11 && m00 >= m22) {
		const num7: number = Math.sqrt(1 + m00 - m11 - m22);
		const num4: number = 0.5 / num7;
		quaternion.x = 0.5 * num7;
		quaternion.y = (m01 + m10) * num4;
		quaternion.z = (m02 + m20) * num4;
		quaternion.w = (m12 - m21) * num4;
		return quaternion;
	}
	if (m11 > m22) {
		const num6: number = Math.sqrt(1 + m11 - m00 - m22);
		const num3: number = 0.5 / num6;
		quaternion.x = (m10 + m01) * num3;
		quaternion.y = 0.5 * num6;
		quaternion.z = (m21 + m12) * num3;
		quaternion.w = (m20 - m02) * num3;
		return quaternion;
	}

	const num5: number = Math.sqrt(1 + m22 - m00 - m11);
	const num2: number = 0.5 / num5;
	quaternion.x = (m20 + m02) * num2;
	quaternion.y = (m21 + m12) * num2;
	quaternion.z = 0.5 * num5;
	quaternion.w = (m01 - m10) * num2;
	return quaternion;
}

/** sets a rotation from a new vector, if I want my right to be Point3D(0, 1, 0), pass as parameter in order: Point3D(1, 0, 0) and Point3D(0,1,0) */
function setVectorToNewVector(pivot: Point3D, newVector: Point3D): Quaternion {
	const normalizedPivot: Point3D = pivot.normalize();
	const normalizedNewVector: Point3D = newVector.normalize();
	const a: Point3D = Point3D.cross(normalizedPivot, normalizedNewVector);
	const w: number = Math.sqrt(1 + Point3D.dot(normalizedPivot, normalizedNewVector));
	const q: Quaternion = new Quaternion(a.x, a.y, a.z, w);
	return q.normalize();
}

/** This function sets the positive Z vector of a rotation. This function is like the transform.forward in unity, but as three uses the right hand rule, we had to call it this way. */
export function setZPositive(obj: Container3D, forward: Point3D): void {
	const rotation: Quaternion = lookRotation(forward);
	obj.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}

/** This function sets the negative Z vector of a rotation. This function is like the -transform.forward in unity, but as three uses the right hand rule, we had to call it this way. */
export function setZNegative(obj: Container3D, backward: Point3D): void {
	const rotation: Quaternion = lookRotation(new Point3D(backward.x, backward.y, -backward.z));
	obj.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}

/** This function sets the positive X vector of a rotation. This function is like the -transform.right in unity, but as three uses the right hand rule, we had to call it this way. */
export function setXPositive(obj: Container3D, right: Point3D): void {
	const rotation: Quaternion = setVectorToNewVector(new Point3D(1, 0, 0), right);
	obj.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}

/** This function sets the negative X vector of a rotation. This function is like the transform.right in unity, but as three uses the right hand rule, we had to call it this way. */
export function setXNegative(obj: Container3D, left: Point3D): void {
	const rotation: Quaternion = setVectorToNewVector(new Point3D(-1, 0, 0), left);
	obj.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}

/** This function sets the positive Y vector of a rotation. This function is like the transform.up in unity */
export function setUp(obj: Container3D, up: Point3D): void {
	const rotation: Quaternion = setVectorToNewVector(new Point3D(0, 1, 0), up);
	obj.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}

/** This function sets the negative Y vector of a rotation. This function is like the -transform.up in unity */
export function setDown(obj: Container3D, down: Point3D): void {
	const rotation: Quaternion = setVectorToNewVector(new Point3D(0, -1, 0), down);
	obj.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}

// /** this function receive a quaternion, and a vector, and an angle, and returns this quaternion by the angle around the axis of the vector */
// export function rotateAround(rotation: Quaternion, axis: Point3D, radians: number): Quaternion {
// 	const rv: Quaternion = new Quaternion();
// 	rv.setFromAxisAngle(axis, radians);
// 	return rotation.clone().premultiply(rv);
// }

// /** This function rotate a vector, in the axis given, with the angle given */
// export function rotate3DVector(vector: Point3D, axis: Point3D, angle: number): Point3D {
// 	const rv: Point3D = new Point3D();
// 	const q: Quaternion = new Quaternion();
// 	q.setFromAxisAngle(axis, angle);
// 	rv.copy(vector).applyQuaternion(q);
// 	return rv;
// }
