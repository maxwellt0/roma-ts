"use strict";
function arcadeBody(sprite) {
    return sprite.body;
}
class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.delivered = 0;
        this.gameEnded = false;
        this.netActive = false;
        this.lastTurkeySpawnAt = 0;
        this.audioCtx = null;
        this.bushes = [];
        this.grassRemaining = 0;
        this.chickens = [];
    }
    playHerdSound() {
        if (!this.audioCtx)
            return;
        playCluck(this.audioCtx, 0);
    }
    playBirthSound() {
        if (!this.audioCtx)
            return;
        playTone(this.audioCtx, 500, 0.1, 'square', 0.1, 0);
        playTone(this.audioCtx, 650, 0.1, 'square', 0.1, 0.12);
    }
    playWinSound() {
        if (!this.audioCtx)
            return;
        const ctx = this.audioCtx;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(ctx, f, 0.22, 'triangle', 0.18, i * 0.15));
    }
    playGameOverSound() {
        if (!this.audioCtx)
            return;
        const ctx = this.audioCtx;
        [400, 320, 260, 180].forEach((f, i) => playTone(ctx, f, 0.3, 'sawtooth', 0.14, i * 0.18));
    }
    playNetUnlockSound() {
        if (!this.audioCtx)
            return;
        const ctx = this.audioCtx;
        [700, 1000, 1300].forEach((f, i) => playTone(ctx, f, 0.15, 'sine', 0.16, i * 0.08));
    }
    preload() {
        this.createTextures();
    }
    createTextures() {
        const g = this.make.graphics({ x: 0, y: 0 });
        // Курча - тіло (спільне для обох кадрів ходи)
        const drawChickenBody = () => {
            g.fillStyle(0xfff3c4, 1);
            g.fillEllipse(17, 24, 30, 20); // тіло
            g.fillStyle(0xffe08a, 1);
            g.fillEllipse(12, 26, 13, 10); // крило
            g.fillStyle(0xfff3c4, 1);
            g.fillCircle(29, 15, 9); // голова
            g.fillStyle(0xff5252, 1);
            g.fillTriangle(24, 7, 27, 2, 30, 7); // гребінь
            g.fillTriangle(28, 6, 31, 1, 33, 6);
            g.fillStyle(0xff9d3d, 1);
            g.fillTriangle(36, 14, 44, 12, 36, 18); // дзьоб
            g.fillStyle(0x2b2b2b, 1);
            g.fillCircle(32, 13, 1.6); // око
        };
        g.clear();
        drawChickenBody();
        g.fillStyle(0xff9d3d, 1);
        g.fillRect(12, 33, 2, 5);
        g.fillRect(21, 34, 2, 7);
        g.generateTexture('chicken0', 46, 42);
        g.clear();
        drawChickenBody();
        g.fillStyle(0xff9d3d, 1);
        g.fillRect(12, 34, 2, 7);
        g.fillRect(21, 33, 2, 5);
        g.generateTexture('chicken1', 46, 42);
        // Індик - тіло (більший, з хвостом-віялом і сережками)
        const drawTurkeyBody = () => {
            g.fillStyle(0x6b4226, 1);
            g.fillTriangle(0, 27, 20, 0, 20, 54); // хвіст-віяло темний
            g.fillStyle(0x8a5a34, 1);
            g.fillTriangle(6, 27, 20, 9, 20, 45); // хвіст світліший
            g.fillStyle(0x7a4a2a, 1);
            g.fillEllipse(35, 29, 34, 24); // тіло
            g.fillStyle(0x6b4226, 1);
            g.fillCircle(50, 17, 8); // голова
            g.fillStyle(0xd23c3c, 1);
            g.fillTriangle(50, 21, 54, 30, 47, 26); // сережка
            g.fillStyle(0xffb454, 1);
            g.fillTriangle(56, 16, 63, 15, 56, 19); // дзьоб
            g.fillStyle(0x000000, 1);
            g.fillCircle(52, 14, 1.6); // око
        };
        g.clear();
        drawTurkeyBody();
        g.fillStyle(0xffb454, 1);
        g.fillRect(31, 41, 3, 7);
        g.fillRect(41, 42, 3, 9);
        g.generateTexture('turkey0', 66, 56);
        g.clear();
        drawTurkeyBody();
        g.fillStyle(0xffb454, 1);
        g.fillRect(31, 42, 3, 9);
        g.fillRect(41, 41, 3, 7);
        g.generateTexture('turkey1', 66, 56);
        // Ґрунт - плитка фону (поле після вижирання трави)
        g.clear();
        g.fillStyle(0x9c8156, 1);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x91764c, 1);
        g.fillCircle(16, 20, 5);
        g.fillCircle(46, 42, 6);
        g.fillCircle(52, 12, 4);
        g.generateTexture('dirt', 64, 64);
        // Пучок трави (їжа)
        g.clear();
        g.fillStyle(0x4f9130, 1);
        g.fillTriangle(10, 22, 4, 2, 8, 22);
        g.fillStyle(0x5fae3a, 1);
        g.fillTriangle(10, 22, 10, 0, 14, 22);
        g.fillStyle(0x3f7d26, 1);
        g.fillTriangle(10, 22, 16, 4, 18, 22);
        g.generateTexture('grassTuft', 22, 22);
        // Голова курчати (виглядає з-за куща, коли тіло сховане)
        g.clear();
        g.fillStyle(0xfff3c4, 1);
        g.fillCircle(13, 14, 9);
        g.fillStyle(0xff5252, 1);
        g.fillTriangle(8, 6, 11, 1, 14, 6);
        g.fillTriangle(12, 5, 15, 0, 17, 5);
        g.fillStyle(0xff9d3d, 1);
        g.fillTriangle(20, 13, 27, 11, 20, 17);
        g.fillStyle(0x2b2b2b, 1);
        g.fillCircle(16, 12, 1.6);
        g.generateTexture('chickenHead', 28, 24);
        // Голова індика (виглядає з-за куща)
        g.clear();
        g.fillStyle(0x6b4226, 1);
        g.fillCircle(14, 15, 8);
        g.fillStyle(0xd23c3c, 1);
        g.fillTriangle(14, 19, 18, 27, 11, 23);
        g.fillStyle(0xffb454, 1);
        g.fillTriangle(20, 14, 28, 13, 20, 17);
        g.fillStyle(0x000000, 1);
        g.fillCircle(17, 12, 1.6);
        g.generateTexture('turkeyHead', 32, 30);
        // Кущ (декорація + місце для переховування)
        g.clear();
        g.fillStyle(0x2f5d34, 1);
        g.fillCircle(25, 32, 18);
        g.fillStyle(0x3f7d3f, 1);
        g.fillCircle(15, 20, 13);
        g.fillCircle(33, 18, 14);
        g.fillCircle(24, 24, 15);
        g.fillStyle(0x559955, 1);
        g.fillCircle(19, 15, 8);
        g.fillCircle(30, 13, 7);
        g.generateTexture('bush', 50, 46);
        g.destroy();
    }
    create() {
        this.delivered = 0;
        this.gameEnded = false;
        this.netActive = false;
        this.lastTurkeySpawnAt = this.time.now;
        // Аудіоконтекст для звукових ефектів (розблоковується першим кліком користувача)
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = AudioCtor ? new AudioCtor() : null;
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            this.useNet(pointer, currentlyOver);
        });
        // Фон (ґрунт), трава лежить зверху окремими пучками, що зникають
        this.add.tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 'dirt');
        this.drawPen();
        // Кущі (декорація + переховування)
        this.bushes = [];
        for (let i = 0; i < BUSH_COUNT; i++) {
            const x = Phaser.Math.Between(FIELD_BOUNDS.minX + 25, FIELD_BOUNDS.maxX - 25);
            const y = Phaser.Math.Between(FIELD_BOUNDS.minY + 25, FIELD_BOUNDS.maxY - 25);
            this.add.image(x, y, 'bush').setDepth(2);
            this.bushes.push({ x, y, radius: 20, slots: [null, null] });
        }
        // Трава
        this.grassGroup = this.add.group();
        for (let i = 0; i < GRASS_COUNT; i++) {
            const x = Phaser.Math.Between(FIELD_BOUNDS.minX, FIELD_BOUNDS.maxX);
            const y = Phaser.Math.Between(FIELD_BOUNDS.minY, FIELD_BOUNDS.maxY);
            const tuft = this.add.image(x, y, 'grassTuft');
            this.grassGroup.add(tuft);
        }
        this.grassRemaining = GRASS_COUNT;
        // UI
        this.scoreText = this.add.text(16, 16, '', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#1b1f2a',
            strokeThickness: 4,
            lineSpacing: 6
        });
        this.updateScoreText();
        // Курчата
        this.chickens = [];
        for (let i = 0; i < TOTAL_CHICKENS; i++) {
            this.spawnChicken();
        }
        // Одна квочка вже на старті (і після кожного перезапуску, бо create() викликається знову)
        const hen = this.spawnChicken();
        if (hen) {
            hen.setData('brooding', true);
            hen.setData('stateSince', this.time.now);
            hen.setData('clicksNeeded', HEN_CLICKS_NEEDED);
            hen.setTint(0xd2833f);
            hen.setScale(1.3);
        }
    }
    drawPen() {
        const g = this.add.graphics();
        const { x, y, width, height } = PEN_ZONE;
        g.fillStyle(0x8a6a4c, 0.9);
        g.fillRect(x, y, width, height);
        g.lineStyle(6, 0x6b4226, 1);
        g.strokeRect(x, y, width, height);
        // "Ворота" - розрив в лівій стінці (звідки заходять курчата)
        g.fillStyle(0x8a6a4c, 1);
        g.fillRect(x - 3, y + height * 0.3, 10, height * 0.4);
        // Стовпи по кутах
        g.fillStyle(0x4a2f1c, 1);
        const postSize = 10;
        [[x, y], [x + width, y], [x, y + height], [x + width, y + height]].forEach(([px, py]) => {
            g.fillRect(px - postSize / 2, py - postSize / 2, postSize, postSize);
        });
        this.add.text(x + width / 2, y - 18, 'Загін', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#1b1f2a',
            strokeThickness: 3
        }).setOrigin(0.5);
    }
    updateScoreText(timeRemainingMs) {
        const remaining = timeRemainingMs !== undefined ? timeRemainingMs : TIME_LIMIT_MS;
        const totalSec = Math.max(0, Math.ceil(remaining / 1000));
        const mm = Math.floor(totalSec / 60);
        const ss = String(totalSec % 60).padStart(2, '0');
        const netStatus = this.netActive ? 'активна 🕸️' : `${this.delivered}/${NET_UNLOCK_COUNT}`;
        this.scoreText.setText(`Час: ${mm}:${ss}\n` +
            `У загоні: ${this.delivered}\n` +
            `Курей на полі: ${this.chickens ? this.chickens.length : TOTAL_CHICKENS}/${MAX_CHICKENS}\n` +
            `Трава: ${this.grassRemaining}\n` +
            `Сітка: ${netStatus}`);
    }
    spawnChicken(x, y, type) {
        type = type || 'chicken';
        if (this.chickens && this.chickens.length >= MAX_CHICKENS)
            return null;
        const px = x !== undefined ? Phaser.Math.Clamp(x, FIELD_BOUNDS.minX, FIELD_BOUNDS.maxX)
            : Phaser.Math.Between(FIELD_BOUNDS.minX, FIELD_BOUNDS.maxX);
        const py = y !== undefined ? Phaser.Math.Clamp(y, FIELD_BOUNDS.minY, FIELD_BOUNDS.maxY)
            : Phaser.Math.Between(FIELD_BOUNDS.minY, FIELD_BOUNDS.maxY);
        const chicken = this.physics.add.image(px, py, `${type}0`);
        chicken.setInteractive({ useHandCursor: true });
        chicken.setData('type', type);
        chicken.setData('herded', false);
        chicken.setData('delivered', false);
        chicken.setData('brooding', false);
        chicken.setData('wasHen', false);
        chicken.setData('stateSince', this.time.now);
        chicken.setData('nextWanderAt', this.time.now);
        chicken.setData('penOffsetX', Phaser.Math.Between(-50, 50));
        chicken.setData('penOffsetY', Phaser.Math.Between(-45, 45));
        chicken.setData('clicksNeeded', type === 'turkey' ? TURKEY_CLICKS_NEEDED : 1);
        chicken.setData('clicksSoFar', 0);
        if (type === 'turkey') {
            chicken.setScale(0.82);
        }
        chicken.setDepth(3);
        // Супутній спрайт "голова", що виглядає з-за куща, коли тіло сховане
        const head = this.add.image(px, py, `${type}Head`);
        head.setVisible(false);
        head.setDepth(5);
        if (type === 'turkey')
            head.setScale(0.82);
        head.setInteractive({ useHandCursor: true });
        head.setData('owner', chicken);
        chicken.setData('head', head);
        chicken.on('pointerdown', () => this.herdChicken(chicken));
        head.on('pointerdown', () => this.herdChicken(chicken));
        this.chickens.push(chicken);
        this.pickNewWanderVelocity(chicken, this.time.now);
        return chicken;
    }
    herdChicken(chicken) {
        if (chicken.getData('herded') || chicken.getData('delivered'))
            return;
        const needed = chicken.getData('clicksNeeded');
        const clicks = chicken.getData('clicksSoFar') + 1;
        chicken.setData('clicksSoFar', clicks);
        this.playHerdSound();
        if (clicks < needed) {
            // Ще не досить кліків - лише фідбек, продовжує тікати як раніше
            this.tweens.add({
                targets: chicken,
                scaleX: chicken.scaleX * 1.2,
                scaleY: chicken.scaleY * 1.2,
                duration: 90,
                yoyo: true
            });
            return;
        }
        const wasHen = chicken.getData('brooding');
        chicken.setData('wasHen', wasHen);
        chicken.setData('herded', true);
        chicken.setData('brooding', false);
        arcadeBody(chicken).setVelocity(0, 0);
        this.releaseBushSlot(chicken);
        chicken.setVisible(true);
        const headSprite = chicken.getData('head');
        if (headSprite)
            headSprite.setVisible(false);
        if (wasHen) {
            // Залишається виглядати як квочка (тінт + більший розмір) аж до загону
            this.tweens.add({
                targets: chicken,
                scale: { from: 1.5, to: 1.3 },
                duration: 220,
                ease: 'Back.Out'
            });
        }
        else {
            chicken.clearTint();
            const baseScale = chicken.getData('type') === 'turkey' ? 0.82 : 1;
            this.tweens.add({
                targets: chicken,
                scale: { from: baseScale * 1.35, to: baseScale },
                duration: 220,
                ease: 'Back.Out'
            });
        }
    }
    getSpeedMult(chicken) {
        let mult = 1;
        if (chicken.getData('type') === 'turkey')
            mult *= TURKEY_SPEED_MULT;
        if (chicken.getData('brooding'))
            mult *= HEN_SPEED_MULT;
        return mult;
    }
    getEatMult(chicken) {
        let mult = 1;
        if (chicken.getData('type') === 'turkey')
            mult *= TURKEY_EAT_MULT;
        if (chicken.getData('brooding'))
            mult *= HEN_EAT_MULT;
        return mult;
    }
    pickNewWanderVelocity(chicken, time) {
        const mult = this.getSpeedMult(chicken);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(WANDER_SPEED_MIN, WANDER_SPEED_MAX) * mult;
        arcadeBody(chicken).setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        chicken.setData('nextWanderAt', time + Phaser.Math.Between(1000, 2600));
    }
    // Якщо курча вже сидить у кущі - лишається там. Інакше пробує зайняти вільне
    // місце (максимум BUSH_CAPACITY на кущ) і акуратно сідає рівно всередині нього.
    updateHiding(chicken) {
        const existing = chicken.getData('bushSlot');
        if (existing)
            return true;
        // Індики та квочки не ховаються в кущах - лише звичайні курчата
        if (chicken.getData('type') === 'turkey' || chicken.getData('brooding'))
            return false;
        for (const bush of this.bushes) {
            const dist = Phaser.Math.Distance.Between(chicken.x, chicken.y, bush.x, bush.y);
            if (dist < bush.radius + HIDE_RADIUS) {
                const freeIdx = bush.slots.findIndex(s => s === null);
                if (freeIdx !== -1) {
                    bush.slots[freeIdx] = chicken;
                    chicken.setData('bushSlot', { bush, idx: freeIdx });
                    const offset = BUSH_SLOT_OFFSETS[freeIdx];
                    chicken.x = bush.x + offset.x;
                    chicken.y = bush.y + offset.y;
                    return true;
                }
            }
        }
        return false;
    }
    releaseBushSlot(chicken) {
        const slot = chicken.getData('bushSlot');
        if (slot) {
            slot.bush.slots[slot.idx] = null;
            chicken.setData('bushSlot', null);
        }
    }
    activateNet() {
        this.netActive = true;
        this.playNetUnlockSound();
        const banner = this.add.text(WIDTH / 2, 90, '🕸️ Сітку відкрито! Клікай — і всі курчата поруч побіжать у загін', {
            fontSize: '18px',
            color: '#ffe08a',
            fontStyle: 'bold',
            stroke: '#1b1f2a',
            strokeThickness: 4,
            align: 'center',
            wordWrap: { width: 560 }
        }).setOrigin(0.5);
        this.tweens.add({
            targets: banner,
            alpha: 0,
            delay: 2200,
            duration: 800,
            onComplete: () => banner.destroy()
        });
        this.updateScoreText();
    }
    useNet(pointer, currentlyOver) {
        if (!this.netActive || this.gameEnded)
            return;
        // Виключаємо об'єкт(и), по яких щойно клікнули напряму (тіло чи голову),
        // щоб один клік не рахувався і як прямий клік, і як подвійне попадання в сітку.
        const directChickens = new Set();
        (currentlyOver || []).forEach((obj) => {
            const owner = obj.getData && obj.getData('owner');
            if (owner)
                directChickens.add(owner);
            else if (this.chickens.includes(obj))
                directChickens.add(obj);
        });
        const targets = this.chickens.filter(c => !c.getData('delivered') && !c.getData('herded') &&
            !directChickens.has(c) &&
            Phaser.Math.Distance.Between(pointer.x, pointer.y, c.x, c.y) <= NET_RADIUS);
        if (targets.length === 0)
            return;
        targets.forEach(c => {
            // Сітка ловить одразу, незалежно від кількості потрібних кліків
            c.setData('clicksSoFar', c.getData('clicksNeeded'));
            this.herdChicken(c);
        });
        this.showNetEffect(pointer.x, pointer.y);
    }
    showNetEffect(x, y) {
        const g = this.add.graphics();
        g.lineStyle(3, 0xffe08a, 0.9);
        g.strokeCircle(x, y, NET_RADIUS);
        this.tweens.add({
            targets: g,
            alpha: 0,
            scale: 1.15,
            duration: 350,
            onComplete: () => g.destroy()
        });
    }
    eatNearbyGrass(chicken, multiplier) {
        if (this.grassRemaining <= 0)
            return;
        let toEat = multiplier || 1;
        const tufts = this.grassGroup.getChildren();
        for (let i = 0; i < tufts.length && toEat > 0; i++) {
            const tuft = tufts[i];
            if (!tuft.active)
                continue;
            const dist = Phaser.Math.Distance.Between(chicken.x, chicken.y, tuft.x, tuft.y);
            if (dist < EAT_RADIUS) {
                tuft.destroy();
                this.grassRemaining--;
                toEat--;
                if (this.grassRemaining <= 0)
                    break;
            }
        }
    }
    update(time, delta) {
        if (this.gameEnded)
            return;
        for (const chicken of this.chickens) {
            if (chicken.getData('delivered'))
                continue;
            const type = chicken.getData('type');
            const herded = chicken.getData('herded');
            const headSprite = chicken.getData('head');
            if (herded) {
                chicken.setVisible(true);
                if (headSprite)
                    headSprite.setVisible(false);
                const targetX = Phaser.Math.Clamp(PEN_CENTER.x + chicken.getData('penOffsetX'), PEN_ZONE.x + 15, PEN_ZONE.x + PEN_ZONE.width - 15);
                const targetY = Phaser.Math.Clamp(PEN_CENTER.y + chicken.getData('penOffsetY'), PEN_ZONE.y + 15, PEN_ZONE.y + PEN_ZONE.height - 15);
                let herdSpeed = HERD_SPEED;
                if (type === 'turkey')
                    herdSpeed *= TURKEY_SPEED_MULT;
                if (chicken.getData('wasHen'))
                    herdSpeed *= HEN_SPEED_MULT;
                this.physics.moveTo(chicken, targetX, targetY, herdSpeed);
                const dist = Phaser.Math.Distance.Between(chicken.x, chicken.y, targetX, targetY);
                if (dist < 6 || Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(PEN_ZONE.x + 10, PEN_ZONE.y + 10, PEN_ZONE.width - 20, PEN_ZONE.height - 20), chicken.x, chicken.y)) {
                    arcadeBody(chicken).setVelocity(0, 0);
                    chicken.setData('delivered', true);
                    let points = 1;
                    if (type === 'turkey')
                        points = TURKEY_POINTS;
                    else if (chicken.getData('wasHen'))
                        points = 2;
                    this.delivered += points;
                    this.updateScoreText();
                    if (!this.netActive && this.delivered >= NET_UNLOCK_COUNT) {
                        this.activateNet();
                    }
                }
            }
            else {
                const hidden = this.updateHiding(chicken);
                chicken.setData('hidden', hidden);
                if (hidden) {
                    // Тіло повністю ховається за кущем, видно лише голівку - вона стоїть
                    // рівно всередині силуету куща і не вилазить за його межі
                    chicken.setVisible(false);
                    arcadeBody(chicken).setVelocity(0, 0);
                    const slot = chicken.getData('bushSlot');
                    const headOffset = HEAD_SLOT_OFFSETS[slot.idx];
                    headSprite.setPosition(slot.bush.x + headOffset.x, slot.bush.y + headOffset.y);
                    headSprite.setFlipX(slot.idx === 1);
                    if (chicken.getData('brooding'))
                        headSprite.setTint(0xd2833f);
                    else
                        headSprite.clearTint();
                    headSprite.setVisible(true);
                }
                else {
                    chicken.setVisible(true);
                    if (headSprite)
                        headSprite.setVisible(false);
                }
                const brooding = chicken.getData('brooding');
                const canBrood = type !== 'turkey';
                if (brooding) {
                    if (!hidden && time - chicken.getData('stateSince') >= BROODING_DURATION) {
                        // Висиджує двох курчат (з урахуванням ліміту)
                        this.spawnChicken(chicken.x - 20, chicken.y + 10);
                        this.spawnChicken(chicken.x + 20, chicken.y + 10);
                        this.playBirthSound();
                        chicken.setData('brooding', false);
                        chicken.setData('stateSince', time);
                        chicken.setData('clicksNeeded', 1);
                        chicken.setData('clicksSoFar', 0);
                        chicken.clearTint();
                        chicken.setScale(1);
                        this.pickNewWanderVelocity(chicken, time);
                        this.updateScoreText();
                    }
                    else if (hidden) {
                        chicken.setData('stateSince', time); // пауза розмноження, поки ховається
                    }
                }
                else if (canBrood && !hidden && time - chicken.getData('stateSince') >= UNCLICKED_TIMEOUT) {
                    chicken.setData('brooding', true);
                    chicken.setData('stateSince', time);
                    chicken.setData('clicksNeeded', HEN_CLICKS_NEEDED);
                    chicken.setData('clicksSoFar', 0);
                    chicken.setTint(0xd2833f);
                    chicken.setScale(1.3);
                    this.pickNewWanderVelocity(chicken, time);
                }
                else if (hidden) {
                    chicken.setData('stateSince', time);
                }
                // Рух: сховані в кущі птахи завмирають, решта - і кури, і квочки - ходять далі
                if (!hidden) {
                    if (time > chicken.getData('nextWanderAt')) {
                        this.pickNewWanderVelocity(chicken, time);
                    }
                    if (chicken.x <= FIELD_BOUNDS.minX && arcadeBody(chicken).velocity.x < 0) {
                        arcadeBody(chicken).velocity.x *= -1;
                    }
                    if (chicken.x >= FIELD_BOUNDS.maxX && arcadeBody(chicken).velocity.x > 0) {
                        arcadeBody(chicken).velocity.x *= -1;
                    }
                    if (chicken.y <= FIELD_BOUNDS.minY && arcadeBody(chicken).velocity.y < 0) {
                        arcadeBody(chicken).velocity.y *= -1;
                    }
                    if (chicken.y >= FIELD_BOUNDS.maxY && arcadeBody(chicken).velocity.y > 0) {
                        arcadeBody(chicken).velocity.y *= -1;
                    }
                    chicken.x = Phaser.Math.Clamp(chicken.x, FIELD_BOUNDS.minX, FIELD_BOUNDS.maxX);
                    chicken.y = Phaser.Math.Clamp(chicken.y, FIELD_BOUNDS.minY, FIELD_BOUNDS.maxY);
                }
                this.eatNearbyGrass(chicken, this.getEatMult(chicken));
            }
            // Анімація ходи: чергування кадрів лапок (без гойдання/зсуву тіла)
            const speed = arcadeBody(chicken).velocity.length();
            const base = type;
            if (speed > 1) {
                if (Math.abs(arcadeBody(chicken).velocity.x) > 5) {
                    chicken.flipX = arcadeBody(chicken).velocity.x < 0;
                }
                const frameInterval = herded ? 90 : 160;
                const frame = Math.floor(time / frameInterval) % 2 === 0 ? `${base}0` : `${base}1`;
                if (chicken.texture.key !== frame)
                    chicken.setTexture(frame);
            }
            else if (chicken.texture.key !== `${base}0`) {
                chicken.setTexture(`${base}0`);
            }
        }
        // Періодична поява індика
        if (time - this.lastTurkeySpawnAt >= TURKEY_SPAWN_INTERVAL) {
            this.lastTurkeySpawnAt = time;
            this.spawnChicken(undefined, undefined, 'turkey');
        }
        const timeRemaining = TIME_LIMIT_MS - time;
        this.updateScoreText(timeRemaining);
        if (this.grassRemaining <= 0) {
            this.showGameOver();
            return;
        }
        const activeCount = this.chickens.filter(c => !c.getData('delivered')).length;
        if (activeCount === 0) {
            this.showWin('Всі кури в загоні! 🎉');
            return;
        }
        if (timeRemaining <= 0) {
            this.showWin('Ти протримався 2 хвилини! 🎉');
        }
    }
    showWin(message) {
        this.gameEnded = true;
        this.playWinSound();
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.4);
        this.add.text(WIDTH / 2, HEIGHT / 2 - 20, message || 'Перемога! 🎉', {
            fontSize: '36px',
            color: '#ffe08a',
            fontStyle: 'bold',
            stroke: '#1b1f2a',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.add.text(WIDTH / 2, HEIGHT / 2 + 40, 'Клік, щоб зіграти знову', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.input.once('pointerdown', () => this.scene.restart());
    }
    showGameOver() {
        this.gameEnded = true;
        this.playGameOverSound();
        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55);
        this.add.text(WIDTH / 2, HEIGHT / 2 - 20, 'Гру закінчено 🌾💀\nКурчата з\'їли всю траву!', {
            fontSize: '34px',
            color: '#ff6b6b',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#1b1f2a',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.add.text(WIDTH / 2, HEIGHT / 2 + 60, `У загоні залишилось: ${this.delivered}`, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(WIDTH / 2, HEIGHT / 2 + 95, 'Клік, щоб зіграти знову', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.input.once('pointerdown', () => this.scene.restart());
    }
}
