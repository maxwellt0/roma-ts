import { test, expect } from '@playwright/test';
import { loadGame, getSceneSnapshot, tickScene, getConstants } from './helpers';

// Вимоги #3, #7: якщо курча не клікати UNCLICKED_TIMEOUT (10с), воно стає квочкою;
// квочка за BROODING_DURATION (10с) висиджує ще двох курчат.
test('неклікнуте курча стає квочкою через 10с, і висиджує 2 курчат ще через 10с', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);
  expect(constants.UNCLICKED_TIMEOUT).toBe(10000);
  expect(constants.BROODING_DURATION).toBe(10000);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const plain = scene.chickens.find((c: any) => c.getData('type') === 'chicken' && !c.getData('brooding'));

    // Позиції курчати і кущів на полі рандомізовані, тож курча могло випадково
    // заспавнитись поруч із кущем (і тоді воно "сховане" й не рахує час до
    // перетворення на квочку). Відсуваємо його далеко від будь-якого куща,
    // щоб цей тест не залежав від випадкового розташування.
    plain.x = 5000;
    plain.y = 5000;

    // Ізолюємо: відсуваємо таймер усіх інших птахів далеко в майбутнє, щоб
    // спрацював тільки таймаут цільового курчати (інакше всі птахи мають
    // майже однаковий stateSince з моменту спавну і теж спрацюють одночасно).
    const isolate = () => scene.chickens.forEach((c: any) => { if (c !== plain) c.setData('stateSince', 1e9); });
    isolate();
    plain.setData('stateSince', 0);
    scene.lastTurkeySpawnAt = 1e9; // ізолюємо від періодичного спавну індика в цьому тесті

    const countBefore = scene.chickens.length;

    scene.update(10001, 16); // > 10с без кліку для цільового курчати
    const becameHen = plain.getData('brooding');

    isolate(); // цільова квочка сама скинула stateSince на 10001 - інших знову ізолюємо
    scene.update(20002, 16); // ще 10с брудінгу -> народження
    const countAfter = scene.chickens.length;

    return { countBefore, becameHen, countAfter };
  });

  expect(result.becameHen).toBe(true);
  expect(result.countAfter).toBe(result.countBefore + 2);
});

// Вимога #4: максимум 100 курчат на полі.
test('максимум 100 курчат: spawnChicken відмовляє понад ліміт', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);
  expect(constants.MAX_CHICKENS).toBe(100);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    for (let i = 0; i < 150; i++) {
      scene.spawnChicken();
    }
    return { count: scene.chickens.length };
  });

  expect(result.count).toBe(100);
});

// Вимога #16: квочка їсть траву вдвічі швидше; #19: індик - втричі швидше.
test('множники поїдання трави: квочка x2, індик x3, звичайне курча x1', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const plain = scene.chickens.find((c: any) => c.getData('type') === 'chicken' && !c.getData('brooding'));
    const hen = scene.chickens.find((c: any) => c.getData('brooding'));
    const turkey = scene.spawnChicken(100, 100, 'turkey');
    return {
      plain: scene.getEatMult(plain),
      hen: scene.getEatMult(hen),
      turkey: scene.getEatMult(turkey)
    };
  });

  expect(result.plain).toBe(1);
  expect(result.hen).toBe(2);
  expect(result.turkey).toBe(3);
});

// Вимога #18: квочка бігає вдвічі швидше; #19: індик - втричі швидше за курча.
test('множники швидкості: квочка x2, індик x3, звичайне курча x1', async ({ page }) => {
  await loadGame(page);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const plain = scene.chickens.find((c: any) => c.getData('type') === 'chicken' && !c.getData('brooding'));
    const hen = scene.chickens.find((c: any) => c.getData('brooding'));
    const turkey = scene.spawnChicken(100, 100, 'turkey');
    return {
      plain: scene.getSpeedMult(plain),
      hen: scene.getSpeedMult(hen),
      turkey: scene.getSpeedMult(turkey)
    };
  });

  expect(result.plain).toBe(1);
  expect(result.hen).toBe(2);
  expect(result.turkey).toBe(3);
});

// Вимога #19: індик з'являється кожні 20 секунд.
test('індик спавниться періодично кожні TURKEY_SPAWN_INTERVAL', async ({ page }) => {
  await loadGame(page);
  const constants = await getConstants(page);
  expect(constants.TURKEY_SPAWN_INTERVAL).toBe(20000);

  const result = await page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('MainScene');
    const turkeysBefore = scene.chickens.filter((c: any) => c.getData('type') === 'turkey').length;
    scene.update(21000, 16);
    const turkeysAfter = scene.chickens.filter((c: any) => c.getData('type') === 'turkey').length;
    return { turkeysBefore, turkeysAfter };
  });

  expect(result.turkeysBefore).toBe(0);
  expect(result.turkeysAfter).toBe(1);
});

// Регресійний баг (сесія): таймери на "старт" не повинні порівнюватись з абсолютним
// ігровим часом, інакше рестарт після довгої гри миттєво "спрацьовує" всі таймаути.
test('свіжоспавнене курча одразу після рестарту (в пізній момент гри) НЕ стає квочкою миттєво', async ({ page }) => {
  await loadGame(page);

  await tickScene(page, 50000); // довга гра

  await page.evaluate(() => (window as any).__game.scene.getScene('MainScene').scene.restart());
  await page.waitForTimeout(500);

  const snap = await getSceneSnapshot(page);
  // Одразу після рестарту - лише початкова квочка має brooding=true, решта - ні.
  expect(snap.chickens.filter(c => c.brooding).length).toBe(1);
});
