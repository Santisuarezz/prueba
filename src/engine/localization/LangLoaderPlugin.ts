import type { AssetExtension, LoadAsset, Loader, ResolveAsset } from "pixi.js";
import { LoaderParserPriority } from "pixi.js";
import { extensions, ExtensionType } from "pixi.js";
import i18next from "i18next";
import { DEBUG, LANG } from "../../flags";

const langAssetExtension: AssetExtension = {
	extension: ExtensionType.Asset,

	/** Fill in the language metadata. */
	resolver: {
		test: (value: string): boolean => {
			const tempURL = value.split("?")[0];
			const split = tempURL.split(".");
			const extension = split.pop();
			const i18Marker = split.pop();

			return extension === "json" && i18Marker === "i18";
		},
		parse: (value: string): ResolveAsset => {
			const filename = value.split("?")[0].split("/").pop();
			const splitName = filename.split(".").reverse(); // json , i18, locale code, namespace if any

			return {
				data: {
					lng: splitName[2] ?? "en",
					ns: splitName[3] ?? "translation",
				},
				src: value,
			};
		},
	},

	/**
	 * This is after the file was downloaded. Checks if we should parse it as a locale and then parses it.
	 * Remember that once a parser triggers, it eats the input!
	 */
	loader: {
		extension: {
			type: ExtensionType.LoadParser,
			priority: LoaderParserPriority.Normal,
		},

		testParse(_asset: any, options: LoadAsset): Promise<boolean> {
			return Promise.resolve(options.src.includes("i18.json") && options.data.lng && options.data.ns);
		},

		parse(asset: any, options: LoadAsset, _loader: Loader): Promise<any> {
			i18next.addResourceBundle(options.data.lng, options.data.ns, asset, true, false);
			return Promise.resolve(asset);
		},

		// not really needed
		// unload(parsedThingy: any) {
		// 	i18next.removeResourceBundle(...)
		// },
	},
};

i18next.init({
	debug: DEBUG,
	resources: {},
	lng: LANG,
	fallbackLng: DEBUG
		? "cimode"
		: {
				// custom fallbacks for languages
				// "pt": ["es"], // example: if we don't have pt, fallback to es instead of english, since spanish is more similar to portuguese

				default: ["en"],
		  },
});

extensions.add(langAssetExtension);
