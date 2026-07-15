import { test, expect } from '@playwright/test';
import { loadGame, getSceneSnapshot, clickAtGameCoords, getConstants } from './helpers';

// Вимога #2: клік на курча забирає його в загін (реальний клік по канві, наскрізна перевірка).
test('клік на курча відправляє його в загін і зараховує очко', async ({ page }) => {
  await loadGame(page);

  const before = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const chicken = scene.chickens.find((c: any) => c.getData('type') === 'chicken' && !c.getData('brooding'));
    return { x: chicken.x, y: chicken.y, delivered: scene.delivered };
  });

  await clickAtGameCoords(page, before.x, before.y);

  // HERD_SPEED = 340px/s, поле максимум ~560px по діагоналі до загону - 3с з запасом.
  await page.waitForTimeout(3000);

  const after = await getSceneSnapshot(page);
  expect(after.delivered).toBeGreaterThan(before.delivered);
});

// Вимога #14: квочка потребує 2 кліків і дає 2 очки (замість 1 для звичайного курчати).
test('квочка: перший клік лише "не рахується" за фактом заганяння, другий заганяє і дає 2 очки', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);
  expect(constants.HEN_CLICKS_NEEDED).toBe(2);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const hen = scene.chickens.find((c: any) => c.getData('brooding'));

    scene.herdChicken(hen);
    const afterFirstClick = { herded: hen.getData('herded'), clicksSoFar: hen.getData('clicksSoFar') };

    scene.herdChicken(hen);
    const afterSecondClick = { herded: hen.getData('herded'), clicksSoFar: hen.getData('clicksSoFar') };

    // Ставимо квочку прямо в центр загону і робимо один тік, щоб зарахувалась доставка.
    hen.x = 685; hen.y = 495;
    scene.update(1000, 16);

    return { afterFirstClick, afterSecondClick, delivered: scene.delivered };
  });

  expect(result.afterFirstClick.herded).toBe(false);
  expect(result.afterSecondClick.herded).toBe(true);
  expect(result.delivered).toBe(2);
});

// Вимога #19: індик потребує 3 кліків і дає 3 очки.
test('індик: потребує 3 кліки і дає 3 очки', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);
  expect(constants.TURKEY_CLICKS_NEEDED).toBe(3);
  expect(constants.TURKEY_POINTS).toBe(3);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const turkey = scene.spawnChicken(400, 300, 'turkey');

    scene.herdChicken(turkey);
    scene.herdChicken(turkey);
    const beforeThird = turkey.getData('herded');
    scene.herdChicken(turkey);
    const afterThird = turkey.getData('herded');

    turkey.x = 685; turkey.y = 495;
    scene.update(1000, 16);

    return { beforeThird, afterThird, delivered: scene.delivered };
  });

  expect(result.beforeThird).toBe(false);
  expect(result.afterThird).toBe(true);
  expect(result.delivered).toBe(3);
});

// Вимога #9: якщо всіх курчат загнав у загін - екран перемоги.
test('перемога, коли всі курчата доставлені в загін', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    // Одразу доставляємо всіх наявних курчат в загін.
    scene.chickens.forEach((c: any) => {
      c.setData('herded', true);
      c.setData('delivered', true);
    });
    scene.update(1000, 16);
    return { gameEnded: scene.gameEnded };
  });

  expect(result.gameEnded).toBe(true);
});

// Вимога #10: після 10 доставлених курчат розблоковується сітка.
test('сітка розблоковується після 10 доставлених курчат', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);
  expect(constants.NET_UNLOCK_COUNT).toBe(10);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const targets = scene.chickens.slice(0, 10);
    targets.forEach((c: any) => {
      c.setData('herded', true);
      c.x = 685; c.y = 495;
    });
    scene.update(1000, 16);
    return { netActive: scene.netActive, delivered: scene.delivered };
  });

  expect(result.delivered).toBeGreaterThanOrEqual(10);
  expect(result.netActive).toBe(true);
});
