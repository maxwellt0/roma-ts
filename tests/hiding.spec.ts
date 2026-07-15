import { test, expect } from '@playwright/test';
import { loadGame, clickAtGameCoords } from './helpers';

// Вимоги #17, #17a, #17b: курча ховається за кущем (тіло невидиме, голова видима),
// і поки сховане - не рухається.
test('звичайне курча ховається за кущем: тіло невидиме, голова видима, рух зупинено', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const bush = scene.bushes[0];
    const chicken = scene.spawnChicken(bush.x, bush.y, 'chicken');

    const hidden = scene.updateHiding(chicken);
    scene.update(1000, 16);

    const head = chicken.getData('head');
    return {
      hidden,
      chickenVisible: chicken.visible,
      headVisible: head.visible,
      vx: chicken.body.velocity.x,
      vy: chicken.body.velocity.y
    };
  });

  expect(result.hidden).toBe(true);
  expect(result.chickenVisible).toBe(false);
  expect(result.headVisible).toBe(true);
  expect(result.vx).toBe(0);
  expect(result.vy).toBe(0);
});

// Вимога #17a: клік по голові (яка виглядає з-за куща) теж заганяє курча.
test('реальний клік по голові схованого курчати заганяє його', async ({ page }) => {
  await loadGame(page);

  const headPos = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const bush = scene.bushes[0];
    const chicken = scene.spawnChicken(bush.x, bush.y, 'chicken');
    scene.updateHiding(chicken);
    scene.update(1000, 16);
    (window as any).__testChicken = chicken;
    const head = chicken.getData('head');
    return { x: head.x, y: head.y };
  });

  await clickAtGameCoords(page, headPos.x, headPos.y);
  await page.waitForTimeout(100);

  const herded = await page.evaluate(() => (window as any).__testChicken.getData('herded'));
  expect(herded).toBe(true);
});

// Вимога (ця сесія): індики та квочки НЕ ховаються за кущами - лише звичайні курчата.
test('індики та квочки не ховаються за кущами', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const bush = scene.bushes[0];

    const turkey = scene.spawnChicken(bush.x, bush.y, 'turkey');
    const turkeyHidden = scene.updateHiding(turkey);

    const hen = scene.spawnChicken(bush.x, bush.y, 'chicken');
    hen.setData('brooding', true);
    const henHidden = scene.updateHiding(hen);

    return { turkeyHidden, henHidden };
  });

  expect(result.turkeyHidden).toBe(false);
  expect(result.henHidden).toBe(false);
});
