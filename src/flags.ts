import p from "../package.json";
export { VERSION as PIXI_VERSION } from "pixi.js";

export const BUILD_DATE: string = process.env.DATE;
export const DEBUG: boolean = process.env.NODE_ENV == "development";
export const SHOW_COLLIDERS: boolean = true && DEBUG;
export const STATS: boolean = true && DEBUG;
export const VERSION: string = p.version;
export const SAVEDATA_VERSION: string = "1.0.0";
export const PROJECT_NAME: string = p.name;
export const USE_BOX2D: boolean = false;

// DO NOT MODIFY THIS TO TEST! Use `http://localhost:3000/?lang=<language code here>` instead
export const LANG = (window.location.search.match(/[?&]lang=([a-z]{2}([-_][a-z]{2})?)/) || [])[1] || document.documentElement.lang || navigator.language;
