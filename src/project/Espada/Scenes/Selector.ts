import { Graphics } from "pixi.js";
import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { Manager } from "../../..";

export class Selector extends PixiScene {
	public static readonly BUNDLES = ["package-2"];
	constructor() {
		super();

		const espadachinselec: Graphics = new Graphics();
		espadachinselec.beginFill(0x3dff58);
		espadachinselec.drawRect(0, 0, 600, 300);
		espadachinselec.position.set(Manager.width / 2 - espadachinselec.width, Manager.height / 2 - espadachinselec.height);
		this.addChild(espadachinselec);

		// const lanceroselec: Graphics = new Graphics();
		// lanceroselec.beginFill(0x3dffcd);
		// lanceroselec.drawRect(0, 0, 300, 300);
		// lanceroselec.position.set(0, 0);
		// this.addChild(lanceroselec);
	}
}
