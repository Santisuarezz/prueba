/* eslint-disable @typescript-eslint/naming-convention */
import { MTSDFGeometry } from "./MTSDFGeometry";
import vert from "./mtsdfBatch.vert";
import frag from "./mtsdfBatch.frag";
import { utils } from "pixi.js";
import type { BLEND_MODES } from "pixi.js";
import type { ExtensionMetadata, Renderer, Texture, ViewableBuffer } from "pixi.js";
import { BatchRenderer, BatchShaderGenerator, ExtensionType } from "pixi.js";

export class MTSDFRenderer extends BatchRenderer {
	public static override extension: ExtensionMetadata = {
		name: "mtsdf",
		type: ExtensionType.RendererPlugin,
	};

	constructor(renderer: Renderer) {
		super(renderer);
		this.shaderGenerator = new BatchShaderGenerator(vert, frag);
		this.geometryClass = MTSDFGeometry;
		// Pixi's default 6 + 1 for fWidth. (this is size in _floats_. color is 4 bytes which roughly equals one float :P )
		this.vertexSize = 7;
	}

	public override packInterleavedGeometry(element: IMTSDFBatchableElement, attributeBuffer: ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number): void {
		const { uint32View, float32View } = attributeBuffer;
		const packedVertices = aIndex / this.vertexSize;
		const uvs = element.uvs;
		const indicies = element.indices;
		const vertexData = element.vertexData;
		const textureId = element._texture.baseTexture._batchLocation;
		const alpha = Math.min(element.worldAlpha, 1.0);
		const argb = alpha < 1.0 && element._texture.baseTexture.alphaMode ? utils.premultiplyTint(element._tintRGB, alpha) : element._tintRGB + ((alpha * 255) << 24);

		const { a, b, c, d } = element.worldTransform;
		const dx = Math.sqrt(a * a + b * b);
		const dy = Math.sqrt(c * c + d * d);
		const scale = (Math.abs(dx) + Math.abs(dy)) / 2;
		const fWidth = scale * element.range * this.renderer.resolution;

		// lets not worry about tint! for now..
		for (let i = 0; i < vertexData.length; i += 2) {
			float32View[aIndex++] = vertexData[i];
			float32View[aIndex++] = vertexData[i + 1];
			float32View[aIndex++] = uvs[i];
			float32View[aIndex++] = uvs[i + 1];
			uint32View[aIndex++] = argb;
			float32View[aIndex++] = textureId;
			float32View[aIndex++] = fWidth;
		}
		for (let i = 0; i < indicies.length; i++) {
			indexBuffer[iIndex++] = packedVertices + indicies[i];
		}
	}
}

export declare interface IMTSDFBatchableElement {
	range: number;
	worldTransform: { a: number; b: number; c: number; d: number };
	_texture: Texture;
	vertexData: Float32Array;
	indices: Uint16Array | Uint32Array | Array<number>;
	uvs: Float32Array;
	worldAlpha: number;
	_tintRGB: number;
	blendMode: BLEND_MODES;
}
