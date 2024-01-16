import { Timer } from "../../engine/tweens/Timer";
import { SoundLib } from "../../engine/sound/SoundLib";
import { StateMachineAnimator } from "../../engine/animation/StateMachineAnimation";
import { Easing, Tween } from "tweedle.js";
import i18next from "i18next";
import { Sprite } from "pixi.js";
import { Texture } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";

export class MenuScene extends PixiScene {
	public static readonly BUNDLES = ["package-1", "sfx", "music"];

	private anim: StateMachineAnimator;

	constructor() {
		super();

		// how to get localized values:
		console.log("The next string is localized:", i18next.t<string>("menu.title"));
		console.log("The next string is also localized:", i18next.t<string>("settings.muteSFX"));

		SoundLib.playMusic("music");

		const s: Sprite = Sprite.from("big_background");
		this.addChild(s);
		const t = new Tween(s);
		t.to({ x: 300, y: 300, scale: { x: -1, y: -1 }, alpha: 0.25 }, 3000);
		t.repeat(Infinity);
		t.yoyo(true);
		t.easing(Easing.Exponential.InOut);
		t.start();

		let textAux;
		const textArray: Texture[] = [];
		for (let i = 0; i < 4; i++) {
			textAux = Texture.from(`package-1/bronze_${i + 1}.png`, {}, true);
			textArray.push(textAux);
		}
		for (let i = 3; i > 0; i--) {
			textAux = Texture.from(`package-1/bronze_${i}.png`, {}, true);
			textArray.push(textAux);
		}

		this.anim = new StateMachineAnimator(false);
		this.anim.addState("hi", textArray, 5, true);
		this.anim.anchor.set(0.5);

		this.addChild(this.anim);

		this.anim.position.set(300, 300);

		this.anim.onFrameChange = (currentFrame) => {
			this.anim.scale.x = currentFrame > 3 ? -1 : 1;
		};

		this.anim.interactive = true;
		this.anim.on(
			"pointerdown",
			() => {
				this.anim.stop();
			},
			this
		);

		const tim = new Timer();
		tim.to(1000)
			.start()
			.onComplete(() => {
				console.log("timer complete");
			});
	}

	public override update(dt: number): void {
		this.anim.update(dt);
	}
}
