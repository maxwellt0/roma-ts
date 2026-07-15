// Ambient declarations for identifiers that only exist inside the page context
// (classic, non-module scripts loaded by index.html). These are referenced from
// inside page.evaluate() callbacks, which actually execute in the browser.
declare const TOTAL_CHICKENS: number;
declare const MAX_CHICKENS: number;
declare const UNCLICKED_TIMEOUT: number;
declare const BROODING_DURATION: number;
declare const TURKEY_SPAWN_INTERVAL: number;
declare const TURKEY_CLICKS_NEEDED: number;
declare const HEN_CLICKS_NEEDED: number;
declare const NET_UNLOCK_COUNT: number;
declare const TIME_LIMIT_MS: number;
declare const GRASS_COUNT: number;
declare const TURKEY_POINTS: number;
declare const HIDE_RADIUS: number;
declare const BUSH_CAPACITY: number;
declare const FIELD_BOUNDS: { minX: number; maxX: number; minY: number; maxY: number };
declare const PEN_ZONE: { x: number; y: number; width: number; height: number };
declare const PEN_CENTER: { x: number; y: number };
