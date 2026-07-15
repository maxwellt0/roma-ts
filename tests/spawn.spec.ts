import { test, expect } from '@playwright/test';
import { loadGame, getSceneSnapshot, tickScene } from './helpers';

// Вимога (ця сесія): на спавні завжди 10 курчат і 1 квочка, навіть після рестарту/перезавантаження.
test.describe('Спавн: 10 курчат + 1 квочка', () => {
  test('на старті рівно 10 курчат + 1 квочка', async ({ page }) => {
    await loadGame(page);
    const snap = await getSceneSnapshot(page);

    expect(snap.chickenCount).toBe(11);
    expect(snap.chickens.filter(c => c.brooding).length).toBe(1);
    expect(snap.chickens.filter(c => !c.brooding && c.type === 'chicken').length).toBe(10);
    expect(snap.chickens.every(c => c.type !== 'turkey')).toBe(true);
  });

  test('після рестарту завжди рівно 10 курчат + 1 квочка, навіть якщо перед тим розмножились до багатьох', async ({ page }) => {
    await loadGame(page);

    // Прокручуємо ігровий час напряму через update(), без реального очікування,
    // щоб курчата встигли перетворитись на квочок і розмножитись.
    await tickScene(page, 10000);
    await tickScene(page, 20000);
    await tickScene(page, 30000);
    await tickScene(page, 40000);

    const before = await getSceneSnapshot(page);
    expect(before.chickenCount).toBeGreaterThan(11);

    await page.evaluate(() => {
      const scene = (window as any).__game.scene.getScene('MainScene');
      scene.scene.restart();
    });
    await page.waitForTimeout(500);

    const after = await getSceneSnapshot(page);
    expect(after.chickenCount).toBe(11);
    expect(after.chickens.filter(c => c.brooding).length).toBe(1);
    expect(after.chickens.filter(c => !c.brooding && c.type === 'chicken').length).toBe(10);
  });

  test('рестарт відразу після завантаження (без очікування) теж дає рівно 11', async ({ page }) => {
    await loadGame(page);

    await page.evaluate(() => (window as any).__game.scene.getScene('MainScene').scene.restart());
    await page.waitForTimeout(500);
    await page.evaluate(() => (window as any).__game.scene.getScene('MainScene').scene.restart());
    await page.waitForTimeout(500);

    const snap = await getSceneSnapshot(page);
    expect(snap.chickenCount).toBe(11);
  });
});
