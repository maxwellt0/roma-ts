import { test, expect } from '@playwright/test';
import { loadGame, getConstants } from './helpers';

// Вимога #5: якщо курчата з'їли всю траву - game over.
test('game over, коли трава закінчилась', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    scene.grassRemaining = 0;
    scene.update(1000, 16);
    return { gameEnded: scene.gameEnded };
  });

  expect(result.gameEnded).toBe(true);
});

// Вимога #6: треба протриматись 2 хвилини (TIME_LIMIT_MS) - перемога.
test('перемога після виживання 2 хвилин, поки є трава', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);
  expect(constants.TIME_LIMIT_MS).toBe(120000);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const grassBefore = scene.grassRemaining;
    scene.update(120001, 16);
    return { gameEnded: scene.gameEnded, grassBefore, grassAfter: scene.grassRemaining };
  });

  expect(result.grassBefore).toBeGreaterThan(0);
  // Перемога мала спрацювати саме через ліміт часу, а не через вижирання трави.
  expect(result.grassAfter).toBeGreaterThan(0);
  expect(result.gameEnded).toBe(true);
});

// Вимога #9: перемога, якщо всіх курчат загнав у загін (спорожнення поля).
test('перемога, коли поле курчат спорожніло (всі доставлені)', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    scene.chickens.forEach((c: any) => c.setData('delivered', true));
    scene.update(1000, 16);
    return { gameEnded: scene.gameEnded };
  });

  expect(result.gameEnded).toBe(true);
});
