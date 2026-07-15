import { test, expect } from '@playwright/test';
import { loadGame } from './helpers';

// Баг #20: квочки завмирали на місці і не могли ходити.
test('квочка рухається під час блукання (не завмирає)', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const hen = scene.chickens.find((c: any) => c.getData('brooding'));
    hen.setData('nextWanderAt', 1e9); // без перевибору напрямку - лише перевіряємо, що рух не обнуляється
    hen.x = 300;
    hen.y = 300;
    hen.body.setVelocity(50, 0);
    scene.update(1000, 16);
    return { vx: hen.body.velocity.x, vy: hen.body.velocity.y };
  });

  expect(Math.abs(result.vx) + Math.abs(result.vy)).toBeGreaterThan(0);
});

// Баг #21: курчата "тряслися" через повторне відбиття від межі поля щокадру.
test('курча на межі поля відбивається один раз, не осцилює щокадру', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const chicken = scene.chickens.find((c: any) => c.getData('type') === 'chicken' && !c.getData('brooding'));
    chicken.setData('nextWanderAt', 1e9); // виключаємо перевибір напрямку з рівняння
    chicken.x = FIELD_BOUNDS.minX;
    chicken.body.setVelocity(-50, 0);

    scene.update(1000, 16);
    const v1 = chicken.body.velocity.x;
    scene.update(1016, 16);
    const v2 = chicken.body.velocity.x;

    return { v1, v2 };
  });

  expect(result.v1).toBeGreaterThan(0);
  expect(result.v2).toBeGreaterThan(0);
});
