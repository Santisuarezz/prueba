import { Tween } from "tweedle.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { Assets } from "pixi.js";
import type { StandardMaterial } from "pixi3d/pixi7";
import { Container3D, Light, LightingEnvironment, Model, Camera, LightType, Color } from "pixi3d/pixi7";
import { RAD_TO_DEG } from "pixi.js";
import { Sprite } from "pixi.js";
import { fancyGroupLog, fancyLog, silencedLog } from "../../loggers";

export class DuckScene extends PixiScene {
	public static readonly BUNDLES = ["3d"];

	private gigaCube: Container3D;

	private cubeSize: number = 5;
	private cubeSpacing: number = 10;
	constructor() {
		super();

		const duckModel = Assets.get("duckModel");

		const dirLight = new Light();
		dirLight.type = LightType.directional;
		dirLight.intensity = 1;
		dirLight.color = new Color(1, 1, 1);
		dirLight.rotationQuaternion.setEulerAngles(45, -75, 0);
		LightingEnvironment.main.lights.push(dirLight);

		const dirLight2 = new Light();
		dirLight2.type = LightType.directional;
		dirLight2.intensity = 1;
		dirLight2.color = new Color(1, 1, 1);
		dirLight2.rotationQuaternion.setEulerAngles(45, 75, 0);
		LightingEnvironment.main.lights.push(dirLight2);

		this.gigaCube = new Container3D();
		this.addChild(this.gigaCube);

		const sideSize = 5;
		const lowBound = -Math.floor(sideSize / 2);
		const upBound = Math.ceil(sideSize / 2);

		for (let i = lowBound; i < upBound; i++) {
			for (let j = lowBound; j < upBound; j++) {
				for (let k = lowBound; k < upBound; k++) {
					// const newCube = new Mesh(this.cubeGeom, new MeshLambertMaterial({ color: Math.random() * 0xffffff }));
					const newDuck = Model.from(duckModel);
					newDuck.position.set(
						i * this.cubeSize + this.cubeSpacing, //
						j * this.cubeSize + this.cubeSpacing, //
						k * this.cubeSize + this.cubeSpacing //
					);
					new Tween({ x: 0, y: 0, z: 0 })
						.to({ x: -Math.PI, y: -Math.PI * 3, z: -Math.PI * 6 }, 60000)
						.onUpdate((obj) => {
							newDuck.rotationQuaternion.setEulerAngles(obj.x * RAD_TO_DEG, obj.y * RAD_TO_DEG, obj.z * RAD_TO_DEG);
						})
						.repeat(Infinity)
						.start();
					this.gigaCube.addChild(newDuck);
				}
			}
		}

		Camera.main.position.set(0, upBound * this.cubeSize + this.cubeSpacing, upBound * this.cubeSize + this.cubeSpacing);
		Camera.main.rotationQuaternion.setEulerAngles(-180 + 45, 0, -180);
		// let control = new CameraOrbitControl(app.view);
		// control.angles.x = 25;

		new Tween({ x: 0, y: 0, z: 0 })
			.to({ x: Math.PI, y: Math.PI * 3, z: Math.PI * 6 }, 60000)
			.onUpdate((obj) => {
				this.gigaCube.rotationQuaternion.setEulerAngles(obj.x * RAD_TO_DEG, obj.y * RAD_TO_DEG, obj.z * RAD_TO_DEG);
			})
			.repeat(Infinity)
			.start();

		// Regular sprite on top of the ducks but below the stormtrooper
		const regularSprite = Sprite.from("gridTexture");
		this.addChild(regularSprite);

		const dancingStormtrooperObject = Model.from(Assets.get("dancingStormtrooper"));
		dancingStormtrooperObject.animations[0].loop = true;
		dancingStormtrooperObject.animations[0].play();
		dancingStormtrooperObject.scale.set(500);
		dancingStormtrooperObject.meshes.forEach((mesh) => {
			const mat = mesh.material as StandardMaterial;
			mat.exposure = 1.1;
			mat.roughness = 0.6;
			mat.metallic = 0;
		});
		dancingStormtrooperObject.position.set(0);
		this.addChild(dancingStormtrooperObject);

		// Example of how to use the logger

		fancyLog("Fancy logs with correct line numbers over there ---->");

		fancyGroupLog("we also have fancy groups!");
		fancyLog("Remember to call groupend :P");
		console.groupEnd();

		silencedLog("Silenced in the loggers.ts file!");
	}

	public override update(dt: number): void {
		dt;
	}
}
