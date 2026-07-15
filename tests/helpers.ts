import path from 'path';
import { pathToFileURL } from 'url';
import { Page } from '@playwright/test';

export const GAME_URL = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

export async function loadGame(page: Page) {
  await page.goto(GAME_URL);
  await page.waitForFunction(() => !!(window as any).__game);
}

export interface ChickenSnapshot {
  type: string;
  brooding: boolean;
  herded: boolean;
  delivered: boolean;
  clicksNeeded: number;
  clicksSoFar: number;
}

export interface SceneSnapshot {
  chickenCount: number;
  delivered: number;
  gameEnded: boolean;
  netActive: boolean;
  grassRemaining: number;
  chickens: ChickenSnapshot[];
}

export function getSceneSnapshot(page: Page): Promise<SceneSnapshot> {
  return page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene') as any;
    return {
      chickenCount: scene.chickens.length,
      delivered: scene.delivered,
      gameEnded: scene.gameEnded,
      netActive: scene.netActive,
      grassRemaining: scene.grassRemaining,
      chickens: scene.chickens.map((c: any) => ({
        type: c.getData('type'),
        brooding: !!c.getData('brooding'),
        herded: !!c.getData('herded'),
        delivered: !!c.getData('delivered'),
        clicksNeeded: c.getData('clicksNeeded'),
        clicksSoFar: c.getData('clicksSoFar')
      }))
    };
  });
}

/** Directly drives the scene's update loop with a synthetic absolute time, without waiting real wall-clock time. */
export function tickScene(page: Page, time: number, delta = 16) {
  return page.evaluate(({ time, delta }) => {
    const scene = (window as any).__game.scene.getScene('MainScene') as any;
    scene.update(time, delta);
  }, { time, delta });
}

export async function getCanvasBox(page: Page) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('canvas not found');
  return box;
}

/** Clicks at the given in-game (canvas-space) coordinates, e.g. a chicken's x/y. */
export async function clickAtGameCoords(page: Page, x: number, y: number) {
  const box = await getCanvasBox(page);
  await page.mouse.click(box.x + x, box.y + y);
}

export function getConstants(page: Page) {
  // Bare identifiers here resolve at runtime through the page's shared top-level
  // script scope (constants.js), not through `window` - classic <script> `const`
  // declarations are not attached to the global object.
  return page.evaluate(() => ({
    TOTAL_CHICKENS,
    MAX_CHICKENS,
    UNCLICKED_TIMEOUT,
    BROODING_DURATION,
    TURKEY_SPAWN_INTERVAL,
    TURKEY_CLICKS_NEEDED,
    HEN_CLICKS_NEEDED,
    NET_UNLOCK_COUNT,
    TIME_LIMIT_MS,
    GRASS_COUNT,
    TURKEY_POINTS
  }));
}
