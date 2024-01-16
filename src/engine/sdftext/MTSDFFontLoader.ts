import type { Loader } from "pixi.js";
import { type AssetExtension, LoaderParserPriority, type LoadAsset } from "pixi.js";
import { extensions, ExtensionType, utils } from "pixi.js";
import { BitmapFont, BitmapFontData } from "pixi.js";

const supportedFormats = ["msdf", "mtsdf", "sdf"];

const mtsdfAssetExtension: AssetExtension<MSDFJson | BitmapFont, any> = {
	extension: ExtensionType.Asset,

	/**
	 * This is after the file was downloaded. Checks if it is a font json and creates the bitmapfont
	 */
	loader: {
		extension: {
			type: ExtensionType.LoadParser,
			priority: LoaderParserPriority.Normal,
		},

		testParse(asset: unknown, options: LoadAsset): Promise<boolean> {
			return Promise.resolve(options.src.includes(".json") && MTSDFFontLoader.test(asset));
		},

		async parse<BitmapFont>(asset: MSDFJson, options: LoadAsset, loader: Loader): Promise<BitmapFont> {
			// this regex extracts the filename without extension from a path
			const fileName = options.src.replace(/^.*[\\\/]/, "").replace(/\.[^/.]+$/, "");
			const fontData = MTSDFFontLoader.parse(asset, fileName);

			const { src } = options;
			const { page: pages } = fontData;
			const textureUrls = [];

			for (let i = 0; i < pages.length; ++i) {
				const pageFile = pages[i].file;
				const imagePath = utils.path.join(utils.path.dirname(src), pageFile);

				textureUrls.push(imagePath);
			}

			const loadedTextures = await loader.load(textureUrls);
			const textures = textureUrls.map((url) => loadedTextures[url]);

			return BitmapFont.install(fontData, textures, true) as BitmapFont;
		},

		unload(bitmapFont: BitmapFont): void {
			bitmapFont.destroy();
		},
	},
};

extensions.add(mtsdfAssetExtension);

/**
 * BitmapFont in msdf-atlas-gen JSON format
 *
 * @class
 * @private
 */
namespace MTSDFFontLoader {
	/**
	 * Check if resource refers to json MSDF font data exported from msdf-atlas-gen
	 *
	 * @static
	 * @private
	 * @param {any} data
	 * @return {boolean} True if resource could be treated as font data, false otherwise.
	 */
	export function test(data: unknown): boolean {
		for (let i = 0; i < supportedFormats.length; i++) {
			const type: string = (data as Partial<MSDFJson>)?.atlas?.type;

			if (type === supportedFormats[i]) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Convert the JSON into BitmapFontData that we can use.
	 *
	 * @static
	 * @private
	 * @param {MSDFJson} json
	 * @return {BitmapFontData} Data to use for BitmapFont
	 */
	export function parse(json: MSDFJson, filename: string): BitmapFontData {
		const data = new BitmapFontData();

		data.info = [{ face: json.name, size: json.atlas.size }];

		data.common = [{ lineHeight: json.metrics.lineHeight * json.atlas.size }];

		// msdf-atlas-gen doesn't support multiple textures
		// Actually, msdf-atlas-gen output doesn't support textures at all :|
		data.page = [{ file: `${filename}.png`, id: 0 }];

		for (let i = 0; i < json.glyphs.length; i++) {
			const letter = json.glyphs[i];

			const atlasBounds = letter.atlasBounds ?? {
				bottom: 0,
				left: 0,
				right: 0,
				top: 0,
			};
			const planeBounds = letter.planeBounds ?? {
				bottom: 0,
				left: 0,
				right: 0,
				top: 0,
			};

			const charHeight = Math.abs(atlasBounds.top - atlasBounds.bottom);
			let y = atlasBounds.top;
			let yoffset = (1 + planeBounds.top) * json.atlas.size;

			if (json.atlas.yOrigin === "bottom") {
				y = json.atlas.height - y;
				yoffset = (1 - planeBounds.top) * json.atlas.size;
			}

			data.char.push({
				id: letter.unicode,
				page: 0,
				height: charHeight,
				width: Math.abs(atlasBounds.left - atlasBounds.right),
				x: atlasBounds.left,
				y,
				xadvance: letter.advance * json.atlas.size,
				xoffset: planeBounds.left * json.atlas.size,
				yoffset,
			});
		}

		for (let i = 0; i < json.kerning.length; i++) {
			const pair = json.kerning[i];

			data.kerning.push({
				amount: pair.advance * json.atlas.size,
				first: pair.unicode1,
				second: pair.unicode2,
			});
		}

		data.distanceField = [{ distanceRange: json.atlas.distanceRange, fieldType: json.atlas.type }];

		return data;
	}
	// #endregion
}

interface Atlas {
	type: string;
	distanceRange: number;
	size: number;
	width: number;
	height: number;
	yOrigin: string;
}

interface Metrics {
	emSize: number;
	lineHeight: number;
	ascender: number;
	descender: number;
	underlineY: number;
	underlineThickness: number;
}

interface PlaneBounds {
	left: number;
	bottom: number;
	right: number;
	top: number;
}

interface AtlasBounds {
	left: number;
	bottom: number;
	right: number;
	top: number;
}

interface Glyph {
	unicode: number;
	advance: number;
	planeBounds?: PlaneBounds;
	atlasBounds?: AtlasBounds;
}

interface Kerning {
	unicode1: number;
	unicode2: number;
	advance: number;
}

interface MSDFJson {
	atlas: Atlas;
	name: string;
	metrics: Metrics;
	glyphs: Glyph[];
	kerning: Kerning[];
}
