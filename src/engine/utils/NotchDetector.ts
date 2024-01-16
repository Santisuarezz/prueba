export class NotchDetector {
	private constructor() {}

	private static initialized(): boolean {
		return Boolean(getComputedStyle(document.documentElement).getPropertyValue("--notch-detector"));
	}
	private static addCSS(): void {
		console.log("adding rule...");
		const sheet = document.styleSheets[0];
		sheet.insertRule(
			":root{--sait:env(safe-area-inset-top);--saib:env(safe-area-inset-bottom);--sail:env(safe-area-inset-left);--sair:env(safe-area-inset-right);--notch-detector:true}"
		);
		// --sait: env(safe-area-inset-top);
		// --saib: env(safe-area-inset-bottom);
		// --sail: env(safe-area-inset-left);
		// --sair: env(safe-area-inset-right);
	}

	public static get TOP(): number {
		if (!NotchDetector.initialized()) {
			NotchDetector.addCSS();
		}
		return parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sait")) || 0;
	}
	public static get BOTTOM(): number {
		if (!NotchDetector.initialized()) {
			NotchDetector.addCSS();
		}
		return parseInt(getComputedStyle(document.documentElement).getPropertyValue("--saib")) || 0;
	}
	public static get LEFT(): number {
		if (!NotchDetector.initialized()) {
			NotchDetector.addCSS();
		}
		return parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sail")) || 0;
	}
	public static get RIGHT(): number {
		if (!NotchDetector.initialized()) {
			NotchDetector.addCSS();
		}
		return parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sair")) || 0;
	}
}
