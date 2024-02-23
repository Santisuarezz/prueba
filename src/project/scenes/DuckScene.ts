import { Graphics, Sprite, Text } from "pixi.js";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import { ScaleHelper } from "../../engine/utils/ScaleHelper";

export class DuckScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];

	private kratos;
	private cuadrado;
	constructor() {
		super();
		this.kratos = Sprite.from("kratos");
		this.addChild(this.kratos);
		this.cuadrado = Sprite.from("cuadrado");
		this.addChild(this.cuadrado);
		this.cuadrado.position.set(0, 400);
		this.cuadrado.width = 400;
		this.cuadrado.scale.y = this.cuadrado.scale.x;

		const myGraph: Graphics = new Graphics();
		myGraph.lineStyle({ color: 0xff00ff, width: 5, alpha: 1 });
		myGraph.moveTo(0, 0);
		myGraph.lineTo(0, 0);
		myGraph.lineTo(100, 300);
		myGraph.lineTo(100, 100);

		myGraph.position.set(1024 / 2, 768 / 2);
		this.addChild(myGraph);

		const myText: Text = new Text("asdasdasd", { fontSize: 108, fill: 0xff0000 });
		myText.position.x = 0;
		myText.position.y = 300;
		myText.angle = 45;
		myText.scale.set(3);
	}

	public override onResize(_newW: number, _newH: number): void {
		ScaleHelper.setScaleRelativeToScreen(this.kratos, _newW, _newH, 1, 1);
	}

	public override update(dt: number): void {
		dt;
	}
}
