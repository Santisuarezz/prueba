import { Graphics } from "pixi.js";
import { DEG_TO_RAD, Rectangle } from "pixi.js";

export class GraphicsHelper {
	private constructor() {}

	public static rectangle(rect: Rectangle, color?: number, alpha?: number): Graphics;
	public static rectangle(x: number, y: number, width: number, height: number, color?: number, alpha?: number): Graphics;
	public static rectangle(rectOrX?: Rectangle | number, yOrColor?: number, widthOrAlpha?: number, height?: number, color: number = 0xff00ff, alpha: number = 1): Graphics {
		const retval = new Graphics();
		if (rectOrX instanceof Rectangle) {
			retval.beginFill(yOrColor, widthOrAlpha);
			retval.drawRect(rectOrX.x, rectOrX.y, rectOrX.width, rectOrX.height);
		} else {
			retval.beginFill(color, alpha);
			retval.drawRect(rectOrX, yOrColor, widthOrAlpha, height);
		}
		retval.endFill();
		return retval;
	}

	public static circle(x: number, y: number, radius: number, color: number = 0xff00ff, alpha: number = 1): Graphics {
		const retval = new Graphics();
		retval.beginFill(color, alpha);
		retval.drawCircle(x, y, radius);
		retval.endFill();
		return retval;
	}

	public static pixel(color?: number, alpha?: number, visible?: boolean): Graphics {
		const rv: Graphics = this.rectangle(new Rectangle(0, 0, 1, 1), color, alpha);
		if (visible != undefined) {
			rv.visible = visible;
		}
		return rv;
	}

	public static roundedRect(width: number, height: number, radius: number, color?: number, alpha?: number): Graphics {
		const rv: Graphics = new Graphics();
		rv.beginFill(color ?? 0xff00ff, alpha ?? 1);
		rv.moveTo(0, radius);
		rv.lineTo(0, height - radius);
		rv.arc(radius, height - radius, radius, 180 * DEG_TO_RAD, 90 * DEG_TO_RAD, true);
		rv.lineTo(width - radius, height);
		rv.arc(width - radius, height - radius, radius, 90 * DEG_TO_RAD, 0 * DEG_TO_RAD, true);
		rv.lineTo(width, radius);
		rv.arc(width - radius, radius, radius, 0, -90 * DEG_TO_RAD, true);
		rv.lineTo(radius, 0);
		rv.arc(radius, radius, radius, 0, 90 * DEG_TO_RAD, true);
		rv.endFill();
		return rv;
	}

	public static arrow(params: { x: number; y: number; color?: number; magnitude?: number; alpha?: number; headSize?: number; width?: number }): Graphics {
		const defaults = {
			color: 0xff00ff,
			magnitude: 1,
			alpha: 1,
			headSize: 10,
			width: 2,
		};
		const { x, y, color, magnitude, alpha, headSize } = {
			...defaults,
			...params,
		};

		const rv: Graphics = new Graphics();
		rv.lineStyle(2, color, alpha);
		rv.moveTo(0, 0);
		rv.lineTo(x * magnitude, y * magnitude);

		const angle = Math.atan2(-y, -x);
		let headAngle = angle + Math.PI / 4;
		let headEndX = x * magnitude + headSize * Math.cos(headAngle);
		let headEndY = y * magnitude + headSize * Math.sin(headAngle);

		rv.moveTo(x * magnitude, y * magnitude);
		rv.lineTo(headEndX, headEndY);

		headAngle = angle - Math.PI / 4;
		headEndX = x * magnitude + headSize * Math.cos(headAngle);
		headEndY = y * magnitude + headSize * Math.sin(headAngle);

		rv.moveTo(x * magnitude, y * magnitude);
		rv.lineTo(headEndX, headEndY);

		rv.endFill();
		return rv;
	}
}
