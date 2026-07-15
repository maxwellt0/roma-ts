import { test, expect } from '@playwright/test';
import { loadGame, getSceneSnapshot, getConstants } from './helpers';

test('game loads and exposes scene + top-level constants', async ({ page }) => {
  await loadGame(page);
  const snapshot = await getSceneSnapshot(page);
  expect(snapshot.chickenCount).toBeGreaterThan(0);

  const constants = await getConstants(page);
  expect(constants.TOTAL_CHICKENS).toBe(10);
});
