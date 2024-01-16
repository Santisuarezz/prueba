import XSadd from "ml-xsadd";
import { DEBUG } from "../../flags";
import { Key } from "../input/Key";
import { legacyKeyboardHelper } from "../input/legacyKeyboardHelper";

export function preventDrag(): void {
	window.addEventListener(
		"touchmove",
		function (event) {
			event.preventDefault();
		},
		{ capture: false, passive: false }
	);
}

export function preventKeys(codes: string[] = [Key.UP_ARROW, Key.DOWN_ARROW, Key.RIGHT_ARROW, Key.LEFT_ARROW, Key.ENTER, Key.SPACE]): void {
	document.addEventListener("keydown", (e) => {
		if (codes.includes(e.code) || codes.includes(legacyKeyboardHelper[e.keyCode])) {
			e.preventDefault();
		}
	}); // Prevent screen from moving
}

export function forceFocus(): void {
	// It happened that touch events woudn't focus the body element of our iframe.
	// without focus we can't lose it and trigger the blur event.
	// this forces the touch event to give focus to our window.
	document.addEventListener("click", () => window.focus());
	document.addEventListener("mouseup", () => window.focus());
	document.addEventListener("pointerup", () => window.focus());
	document.addEventListener("touchend", () => window.focus());
	document.addEventListener("touchstart", () => window.focus());
	document.addEventListener("pointerup", () => window.focus());
	document.addEventListener("mouseup", () => window.focus());
	document.addEventListener("pointerdown", () => window.focus());
	document.addEventListener("mousedown", () => window.focus());
}

export function registerWorker(): void {
	if ("serviceWorker" in navigator) {
		window.addEventListener("load", () => {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					console.log("SW registered: ", registration);
				})
				.catch((registrationError) => {
					console.log("SW registration failed: ", registrationError);
				});
		});
	}
}

export function makeLogger(tag: string, color?: string): (message?: any, ...optionalParams: any[]) => void {
	if (!DEBUG) {
		return () => {};
	}
	if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
		let hash = 0;
		for (let i = 0; i < tag.length; i++) {
			const code = tag.charCodeAt(i);
			hash = (hash << 5) - hash + code;
			hash = hash & hash; // Convert to 32bit integer
		}
		let logColor = color ?? "";
		if (logColor == "") {
			const rng = new XSadd(hash);

			const r = Math.max(0, Math.floor(rng.getFloat() * 255 - 255 * 0.4));
			const g = Math.max(0, Math.floor(rng.getFloat() * 255 - 255 * 0.7));
			const b = Math.max(0, Math.floor(rng.getFloat() * 255 - 255 * 0.2));
			logColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
		}
		const styles = ["color: white", `background: ${logColor}`, "border-radius: 0.3rem", "margin-right:5px", "padding: 1px 5px"].join(";");

		return Function.prototype.bind.apply(console.log, [console, "%c%s", styles, tag]);
	} else {
		return Function.prototype.bind.apply(console.log, [console, `[${tag}]`]);
	}
}

export function makeGroupLogger(tag: string, color?: string, collapsed?: boolean): (...label: any[]) => void {
	if (!DEBUG) {
		return () => {};
	}
	if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
		let hash = 0;
		for (let i = 0; i < tag.length; i++) {
			const code = tag.charCodeAt(i);
			hash = (hash << 5) - hash + code;
			hash = hash & hash; // Convert to 32bit integer
		}
		let logColor = color ?? "";
		if (logColor == "") {
			const rng = new XSadd(hash);

			const r = Math.max(0, Math.floor(rng.getFloat() * 255 - 255 * 0.4));
			const g = Math.max(0, Math.floor(rng.getFloat() * 255 - 255 * 0.7));
			const b = Math.max(0, Math.floor(rng.getFloat() * 255 - 255 * 0.2));
			logColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
		}
		const styles = ["color: white", `background: ${logColor}`, "border-radius: 0.3rem", "margin-right:5px", "padding: 1px 5px"].join(";");

		return Function.prototype.bind.apply(collapsed ? console.groupCollapsed : console.group, [console, "%c%s", styles, tag]);
	} else {
		return Function.prototype.bind.apply(collapsed ? console.groupCollapsed : console.group, [console, `[${tag}]`]);
	}
}
