/* eslint-disable @typescript-eslint/naming-convention */
import Box2DFactory from "box2d-wasm";
import type { IPointData, ISize } from "pixi.js";
import { DisplayObject } from "pixi.js";
import { utils } from "pixi.js";
import { BiMap } from "./BiMap";

export enum Box2DBodyType {
	Static = 0,
	Kinematic = 1,
	Dynamic = 2,
}

export enum Box2DState {
	Null = 0,
	Add = 1,
	Persist = 2,
	Remove = 3,
}

interface Box2DContactBase {
	contact: Box2D.b2Contact;
	body: Box2D.b2Body;
	anotherBody: Box2D.b2Body;
	displayObject: DisplayObject;
	anotherDisplayObject: DisplayObject;
	oldManifold: Box2D.b2Manifold;
	impulse: Box2D.b2ContactImpulse;
}

export type Box2DContact = Omit<Box2DContactBase, "oldManifold" | "impulse">;
export type Box2DPreSolveContact = Omit<Box2DContactBase, "impulse">;
export type Box2DPostSolveContact = Omit<Box2DContactBase, "oldManifold">;

export interface CreateBodyParams {
	type: Box2DBodyType;
	isSensor: boolean;
	mass: number;
	displayObject: DisplayObject;
	enabled?: boolean;
	friction?: number;
	restitution?: number;
	initialPosition?: IPointData;
	initialAngle?: number;
	/** https://aurelienribon.wordpress.com/2011/07/01/box2d-tutorial-collision-filtering/ */
	categoryBits?: number;
	/** https://aurelienribon.wordpress.com/2011/07/01/box2d-tutorial-collision-filtering/ */
	maskBits?: number;
	/** SetTransform doesn't work inside of this callback */
	onBeginContact?: (contact: Box2DContact) => void;
	/** SetTransform doesn't work inside of this callback */
	onEndContact?: (contact: Box2DContact) => void;
	/** SetTransform doesn't work inside of this callback */
	onPreSolve?: (contact: Box2DPreSolveContact) => void;
	/** SetTransform doesn't work inside of this callback */
	onPostSolve?: (contact: Box2DPostSolveContact) => void;
}

export class Box2DHelper extends utils.EventEmitter {
	public static box2D: typeof Box2D & EmscriptenModule;

	private static world: Box2D.b2World;
	private static bodies: BiMap<Box2D.b2Body, DisplayObject> = new BiMap();
	private static onBeginContacts: Map<Box2D.b2Body, (contact: Box2DContact) => void> = new Map();
	private static onEndContacts: Map<Box2D.b2Body, (contact: Box2DContact) => void> = new Map();
	private static onPreSolveContacts: Map<Box2D.b2Body, (contact: Box2DPreSolveContact) => void> = new Map();
	private static onPostSolveContacts: Map<Box2D.b2Body, (contact: Box2DPostSolveContact) => void> = new Map();

	public static async initialize(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			Box2DFactory()
				.then((box2D: typeof Box2D & EmscriptenModule) => {
					Box2DHelper.box2D = box2D;
					resolve();
				})
				.catch((e) => {
					reject(e);
				});
		});
	}

	public static getVec2(x: number, y: number): Box2D.b2Vec2;
	public static getVec2(point: IPointData): Box2D.b2Vec2;
	public static getVec2(xOrPoint: number | IPointData, y?: number): Box2D.b2Vec2 {
		if (typeof xOrPoint == "number") {
			return new Box2DHelper.box2D.b2Vec2(xOrPoint, y);
		}
		return new Box2DHelper.box2D.b2Vec2(xOrPoint.x, xOrPoint.y);
	}

	public static createb2World(gravity?: IPointData): void {
		if (Box2DHelper.world != undefined) {
			console.warn("Box2DHelper.world already exists");
		}

		Box2DHelper.world = new Box2DHelper.box2D.b2World(new Box2DHelper.box2D.b2Vec2(gravity?.x ?? 0, gravity?.y ?? 0));

		const listener: Box2D.JSContactListener = new Box2DHelper.box2D.JSContactListener();
		listener.BeginContact = Box2DHelper.onBeginContact.bind(Box2DHelper);
		listener.EndContact = Box2DHelper.onEndContact.bind(Box2DHelper);
		listener.PreSolve = Box2DHelper.onPreSolve.bind(Box2DHelper);
		listener.PostSolve = Box2DHelper.onPostSolve.bind(Box2DHelper);
		Box2DHelper.world.SetContactListener(listener);
	}

	public static createBoxBody(params: CreateBodyParams & { size: ISize }): Box2D.b2Body {
		const shape: Box2D.b2PolygonShape = new Box2DHelper.box2D.b2PolygonShape();
		shape.SetAsBox(params.size.width / 2, params.size.height / 2);
		return Box2DHelper.createBody(params, shape);
	}

	public static createCircleBody(params: CreateBodyParams & { radius: number }): Box2D.b2Body {
		const shape: Box2D.b2CircleShape = new Box2DHelper.box2D.b2CircleShape();
		shape.set_m_radius(params.radius);
		return Box2DHelper.createBody(params, shape);
	}

	public static createPolygonBody(params: CreateBodyParams & { vertices: IPointData[] }): Box2D.b2Body {
		const shape: Box2D.b2PolygonShape = Box2DHelper.createPolygonShape(params.vertices.map((vertex) => new Box2DHelper.box2D.b2Vec2(vertex.x, vertex.y)));
		return Box2DHelper.createBody(params, shape);
	}

	public static getBody(displayObject: DisplayObject): Box2D.b2Body {
		return Box2DHelper.bodies.getByValue(displayObject);
	}

	public static getDisplayObject(body: Box2D.b2Body): DisplayObject {
		return Box2DHelper.bodies.get(body);
	}

	public static update(dtMs: number): void {
		Box2DHelper.world?.Step(dtMs / 1000, 8, 3);

		const bodiesToRemove: Array<Box2D.b2Body> = new Array();
		Box2DHelper.bodies.forEach((displayObject, body) => {
			// @ts-expect-error
			if (body.toDestroy || displayObject.destroyed) {
				bodiesToRemove.push(body);
			} else {
				const bodyPos: Box2D.b2Vec2 = body.GetPosition();
				displayObject.position.set(bodyPos.get_x(), bodyPos.get_y());
				displayObject.rotation = body.GetAngle();
			}
		});

		for (const body of bodiesToRemove) {
			Box2DHelper.bodies.delete(body);
			Box2DHelper.world.DestroyBody(body);
		}
	}

	public static quitAndDestroyBody(displayObject: DisplayObject): void {
		const body: Box2D.b2Body = Box2DHelper.bodies.getByValue(displayObject);
		this.destroyBody(body);
	}

	public static destroyBody(body: Box2D.b2Body): void {
		body.SetEnabled(false);
		// @ts-expect-error
		body.toDestroy = true;
	}

	public static changeCategoryBits(bodyOrDisplayObject: Box2D.b2Body | DisplayObject, categoryBits: number): void {
		const body: Box2D.b2Body = bodyOrDisplayObject instanceof DisplayObject ? Box2DHelper.bodies.getByValue(bodyOrDisplayObject) : bodyOrDisplayObject;
		const fixture: Box2D.b2Fixture = body.GetFixtureList();
		const filter: Box2D.b2Filter = fixture.GetFilterData();
		filter.set_categoryBits(categoryBits);
	}

	public static changeMaskBits(bodyOrDisplayObject: Box2D.b2Body | DisplayObject, maskBits: number): void {
		const body: Box2D.b2Body = bodyOrDisplayObject instanceof DisplayObject ? Box2DHelper.bodies.getByValue(bodyOrDisplayObject) : bodyOrDisplayObject;
		const fixture: Box2D.b2Fixture = body.GetFixtureList();
		const filter: Box2D.b2Filter = fixture.GetFilterData();
		filter.set_maskBits(maskBits);
	}

	public static clearWorld(): void {
		Box2DHelper.bodies.clear();
		Box2DHelper.onBeginContacts.clear();
		Box2DHelper.onEndContacts.clear();
		Box2DHelper.onPreSolveContacts.clear();
		Box2DHelper.onPostSolveContacts.clear();
		Box2DHelper.world.__destroy__();
		Box2DHelper.world = null;
	}

	public static updatePositionFromDisplayObject(bodyOrDisplayObject: Box2D.b2Body | DisplayObject): void {
		if (bodyOrDisplayObject instanceof DisplayObject) {
			const displayObject: DisplayObject = bodyOrDisplayObject;
			const body: Box2D.b2Body = Box2DHelper.bodies.getByValue(displayObject);
			body.SetTransform(new Box2DHelper.box2D.b2Vec2(displayObject.x, displayObject.y), displayObject.rotation);
		} else {
			const body: Box2D.b2Body = bodyOrDisplayObject;
			const displayObject: DisplayObject = Box2DHelper.bodies.get(body);
			body.SetTransform(new Box2DHelper.box2D.b2Vec2(displayObject.x, displayObject.y), displayObject.rotation);
		}
	}

	private static createBody(params: CreateBodyParams, shape: Box2D.b2Shape): Box2D.b2Body {
		const bodyDef: Box2D.b2BodyDef = new Box2DHelper.box2D.b2BodyDef();
		bodyDef.set_type(params.type);
		if (params.initialPosition != undefined) {
			bodyDef.set_position(new Box2DHelper.box2D.b2Vec2(params.initialPosition.x, params.initialPosition.y));
			params.displayObject.position.set(params.initialPosition.x, params.initialPosition.y);
		}
		if (params.initialAngle != undefined) {
			bodyDef.set_angle(params.initialAngle);
			params.displayObject.rotation = params.initialAngle;
		}
		const body: Box2D.b2Body = Box2DHelper.world.CreateBody(bodyDef);
		const fixture: Box2D.b2Fixture = body.CreateFixture(shape, params.mass ?? 0);
		fixture.SetFriction(params.friction ?? 0);
		fixture.SetRestitution(params.restitution ?? 0);
		fixture.SetSensor(params.isSensor);
		const filter: Box2D.b2Filter = fixture.GetFilterData();
		if (params.categoryBits != undefined) {
			filter.set_categoryBits(params.categoryBits);
		}
		if (params.maskBits != undefined) {
			filter.set_maskBits(params.maskBits);
		}

		Box2DHelper.bodies.set(body, params.displayObject);

		body.SetEnabled(params.enabled ?? true);

		if (params.onBeginContact != undefined) {
			Box2DHelper.onBeginContacts.set(body, params.onBeginContact);
		}
		if (params.onEndContact != undefined) {
			Box2DHelper.onEndContacts.set(body, params.onEndContact);
		}
		if (params.onPreSolve != undefined) {
			Box2DHelper.onPreSolveContacts.set(body, params.onPreSolve);
		}
		if (params.onPostSolve != undefined) {
			Box2DHelper.onPostSolveContacts.set(body, params.onPostSolve);
		}

		return body;
	}

	private static onBeginContact(contactId: number): void {
		const contact: Box2D.b2Contact = Box2DHelper.box2D.wrapPointer(contactId, Box2DHelper.box2D.b2Contact);
		const bodyA: Box2D.b2Body = contact.GetFixtureA().GetBody();
		const bodyB: Box2D.b2Body = contact.GetFixtureB().GetBody();
		const displayObjectA: DisplayObject = Box2DHelper.bodies.get(bodyA);
		const displayObjectB: DisplayObject = Box2DHelper.bodies.get(bodyB);

		Box2DHelper.onBeginContacts.get(bodyA)?.({
			contact,
			body: bodyA,
			anotherBody: bodyB,
			displayObject: displayObjectA,
			anotherDisplayObject: displayObjectB,
		});
		Box2DHelper.onBeginContacts.get(bodyB)?.({
			contact,
			body: bodyB,
			anotherBody: bodyA,
			displayObject: displayObjectB,
			anotherDisplayObject: displayObjectA,
		});
	}

	private static onEndContact(contactId: number): void {
		const contact: Box2D.b2Contact = Box2DHelper.box2D.wrapPointer(contactId, Box2DHelper.box2D.b2Contact);
		const bodyA: Box2D.b2Body = contact.GetFixtureA().GetBody();
		const bodyB: Box2D.b2Body = contact.GetFixtureB().GetBody();
		const displayObjectA: DisplayObject = Box2DHelper.bodies.get(bodyA);
		const displayObjectB: DisplayObject = Box2DHelper.bodies.get(bodyB);

		Box2DHelper.onEndContacts.get(bodyA)?.({
			contact,
			body: bodyA,
			anotherBody: bodyB,
			displayObject: displayObjectA,
			anotherDisplayObject: displayObjectB,
		});
		Box2DHelper.onEndContacts.get(bodyB)?.({
			contact,
			body: bodyB,
			anotherBody: bodyA,
			displayObject: displayObjectB,
			anotherDisplayObject: displayObjectA,
		});
	}

	private static onPreSolve(contactId: number, oldManifoldId: number): void {
		const contact: Box2D.b2Contact = Box2DHelper.box2D.wrapPointer(contactId, Box2DHelper.box2D.b2Contact);
		const oldManifold = Box2DHelper.box2D.wrapPointer(oldManifoldId, Box2DHelper.box2D.b2Manifold);
		const bodyA: Box2D.b2Body = contact.GetFixtureA().GetBody();
		const bodyB: Box2D.b2Body = contact.GetFixtureB().GetBody();
		const displayObjectA: DisplayObject = Box2DHelper.bodies.get(bodyA);
		const displayObjectB: DisplayObject = Box2DHelper.bodies.get(bodyB);

		Box2DHelper.onPreSolveContacts.get(bodyA)?.({
			contact,
			body: bodyA,
			anotherBody: bodyB,
			displayObject: displayObjectA,
			anotherDisplayObject: displayObjectB,
			oldManifold,
		});
		Box2DHelper.onPreSolveContacts.get(bodyB)?.({
			contact,
			body: bodyB,
			anotherBody: bodyA,
			displayObject: displayObjectB,
			anotherDisplayObject: displayObjectA,
			oldManifold,
		});
	}

	private static onPostSolve(contactId: number, impulseId: number): void {
		const contact: Box2D.b2Contact = Box2DHelper.box2D.wrapPointer(contactId, Box2DHelper.box2D.b2Contact);
		const impulse = Box2DHelper.box2D.wrapPointer(impulseId, Box2DHelper.box2D.b2ContactImpulse);
		const bodyA: Box2D.b2Body = contact.GetFixtureA().GetBody();
		const bodyB: Box2D.b2Body = contact.GetFixtureB().GetBody();
		const displayObjectA: DisplayObject = Box2DHelper.bodies.get(bodyA);
		const displayObjectB: DisplayObject = Box2DHelper.bodies.get(bodyB);

		Box2DHelper.onPostSolveContacts.get(bodyA)?.({
			contact,
			body: bodyA,
			anotherBody: bodyB,
			displayObject: displayObjectA,
			anotherDisplayObject: displayObjectB,
			impulse,
		});
		Box2DHelper.onPostSolveContacts.get(bodyB)?.({
			contact,
			body: bodyB,
			anotherBody: bodyA,
			displayObject: displayObjectB,
			anotherDisplayObject: displayObjectA,
			impulse,
		});
	}

	private static createPolygonShape(vertices: Box2D.b2Vec2[]): Box2D.b2PolygonShape {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { _malloc, b2Vec2, b2PolygonShape, HEAPF32, wrapPointer } = Box2DHelper.box2D;
		const shape = new b2PolygonShape();
		const buffer = _malloc(vertices.length * 8);
		let offset = 0;
		for (let i = 0; i < vertices.length; i++) {
			HEAPF32[(buffer + offset) >> 2] = vertices[i].get_x();
			HEAPF32[(buffer + (offset + 4)) >> 2] = vertices[i].get_y();
			offset += 8;
		}
		// eslint-disable-next-line @typescript-eslint/naming-convention
		const ptr_wrapped = wrapPointer(buffer, b2Vec2);
		shape.Set(ptr_wrapped, vertices.length);
		return shape;
	}

	// http://stackoverflow.com/questions/12792486/emscripten-bindings-how-to-create-an-accessible-c-c-array-from-javascript
	// private static createChainShape(vertices: Box2D.b2Vec2[], closedLoop: boolean): Box2D.b2ChainShape {
	// 	// eslint-disable-next-line @typescript-eslint/naming-convention
	// 	const { _malloc, b2Vec2, b2ChainShape, HEAPF32, wrapPointer } = Box2DHelper.box2D;
	// 	const shape = new b2ChainShape();
	// 	const buffer = _malloc(vertices.length * 8);
	// 	let offset = 0;
	// 	for (let i = 0; i < vertices.length; i++) {
	// 		HEAPF32[(buffer + offset) >> 2] = vertices[i].get_x();
	// 		HEAPF32[(buffer + (offset + 4)) >> 2] = vertices[i].get_y();
	// 		offset += 8;
	// 	}
	// 	// eslint-disable-next-line @typescript-eslint/naming-convention
	// 	const ptr_wrapped = wrapPointer(buffer, b2Vec2);
	// 	if (closedLoop) {
	// 		shape.CreateLoop(ptr_wrapped, vertices.length);
	// 	} else {
	// 		throw new Error("CreateChain API has changed in Box2D 2.4, need to update this");
	// 		// shape.CreateChain(ptr_wrapped, vertices.length);
	// 	}
	// 	return shape;
	// }
}
