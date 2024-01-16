/**
 * Connect all pixi.js moving parts.
 */

import "pixi3d/pixi7";

// Renderer plugins
import { extensions } from "pixi.js";

import { MTSDFRenderer } from "./engine/mtsdfSprite/MTSDFRenderer";
extensions.add(MTSDFRenderer);

// Loader plugins

import "@pixi/sound";

import "./engine/sdftext/MTSDFFontLoader";
import "./engine/localization/LangLoaderPlugin";
