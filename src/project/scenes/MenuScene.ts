import { Graphics, Text } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";

import { Manager } from "../..";
import { GameScene } from "./GameScene";

export class MenuScene extends PixiScene {
	public static readonly BUNDLES = ["package-1", "sfx", "music"];
	private background: Graphics = new Graphics();

	constructor() {
		super();

		this.background.beginFill(0xa5a6af);
		this.background.drawRect(0, 0, 300, 400);
		this.addChild(this.background);

		// --------- BOTON PLAY ---------
		const botonplay: Graphics = new Graphics();
		botonplay.beginFill(0xf1cc13);
		botonplay.drawRoundedRect(-200 / 2, -55 / 2, 200, 55, 10);
		botonplay.position.set(this.background.width / 2, 100);

		const playText: Text = new Text("PLAY", { fill: 0x000000, fontSize: 30, align: "center", fontWeight: "bold" });
		playText.anchor.set(0.5);
		botonplay.addChild(playText);

		botonplay.eventMode = "static";
		botonplay.on("pointertap", () => {
			Manager.changeScene(GameScene);
		});

		botonplay.on("pointerover", () => {
			console.log("over");
			botonplay.scale.set(1.1);
		});
		botonplay.on("pointerout", () => {
			console.log("out");
			botonplay.scale.set(1);
		});

		// --------- BOTON CONFIG ---------

		const botonConf: Graphics = new Graphics();
		botonConf.beginFill(0xf1cc13);
		botonConf.drawRoundedRect(0, 0, 200, 55, 10);
		botonConf.position.set(this.background.width / 2 - botonConf.width / 2, 200 - botonConf.height / 2);

		const configText: Text = new Text("SETTINGS", { fill: 0x000000, fontSize: 30, align: "center", fontWeight: "bold" });
		configText.anchor.set(0.5);
		configText.position.set(botonConf.width / 2, botonConf.height / 2);
		botonConf.addChild(configText);

		// --------- BOTON CREDITS ---------

		const botonCredit: Graphics = new Graphics();
		botonCredit.beginFill(0xf1cc13);
		botonCredit.drawRoundedRect(0, 0, 200, 55, 10);
		botonCredit.position.set(this.background.width / 2 - botonCredit.width / 2, 300 - botonCredit.height / 2);

		const creditText: Text = new Text("CREDITS", { fill: 0x000000, fontSize: 30, align: "center", fontWeight: "bold" });
		creditText.anchor.set(0.5);
		creditText.position.set(botonCredit.width / 2, botonCredit.height / 2);
		botonCredit.addChild(creditText);

		// TEXT

		this.background.addChild(botonplay, botonConf, botonCredit);
	}

	public override update(_dt: number): void {}

	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.background, _newW, _newH, 0.8, 0.8);
		this.background.position.set(_newW / 2 - this.background.width / 2, _newH / 2 - this.background.height / 2);
	}
}
