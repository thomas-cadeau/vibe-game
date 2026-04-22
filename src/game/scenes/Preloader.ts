import { Scene } from 'phaser';

const PW = 32;   // player frame width
const PH = 48;   // player frame height
const EW = 28;   // enemy frame width
const EH = 44;   // enemy frame height

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        this.add.rectangle(512, 288, 468, 32).setStrokeStyle(1, 0x4caf50);
        const bar = this.add.rectangle(512 - 230, 288, 4, 28, 0x4caf50);
        this.add.text(512, 240, 'Cowabunga! Loading...', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#4caf50'
        }).setOrigin(0.5);
        this.load.on('progress', (p: number) => { bar.width = 4 + 460 * p; });
    }

    preload() {
        // all assets are generated programmatically
    }

    create() {
        this.generatePlayerTextures();
        this.generateEnemyTextures();
        this.generatePizzaTexture();
        this.generateTileTextures();
        this.generateBackgroundTextures();
        this.generateShurikenTexture();
        this.createAnimations();
        this.scene.start('MainMenu');
    }

    // ── Player ────────────────────────────────────────────────────────────────

    private generatePlayerTextures() {
        const states = ['idle', 'idle2', 'run0', 'run1', 'run2', 'run3', 'jump', 'punch', 'kick', 'hurt', 'block'];
        const gfx = this.add.graphics();

        states.forEach((state, i) => this.drawPlayerFrame(gfx, i * PW, state));

        gfx.generateTexture('player', PW * states.length, PH);
        gfx.destroy();

        const tex = this.textures.get('player');
        states.forEach((_, i) => tex.add(i, 0, i * PW, 0, PW, PH));
    }

    private drawPlayerFrame(g: Phaser.GameObjects.Graphics, ox: number, state: string) {
        const C = { body: 0x4caf50, dark: 0x2e7d32, mask: 0x1565c0, eye: 0xffffff, shell: 0x8d6e63, shellDark: 0x5d4037 };
        const dy = state === 'hurt' ? 2 : 0;

        // head
        g.fillStyle(C.body); g.fillRect(ox + 10, dy + 4, 12, 12);
        // mask band
        g.fillStyle(C.mask); g.fillRect(ox + 8, dy + 8, 16, 5);
        g.fillRect(ox + 24, dy + 8, 6, 3); g.fillRect(ox + 24, dy + 11, 4, 3);
        // eyes
        g.fillStyle(C.eye); g.fillRect(ox + 10, dy + 9, 4, 3); g.fillRect(ox + 18, dy + 9, 4, 3);
        g.fillStyle(C.dark); g.fillRect(ox + 12, dy + 10, 2, 2); g.fillRect(ox + 20, dy + 10, 2, 2);
        // neck + torso
        g.fillStyle(C.body); g.fillRect(ox + 13, dy + 16, 6, 3); g.fillRect(ox + 8, dy + 18, 16, 18);
        // shell
        g.fillStyle(C.shell); g.fillRect(ox + 10, dy + 19, 12, 15);
        g.fillStyle(C.shellDark);
        g.fillRect(ox + 10, dy + 23, 12, 1); g.fillRect(ox + 10, dy + 27, 12, 1);
        g.fillRect(ox + 10, dy + 31, 12, 1); g.fillRect(ox + 14, dy + 19, 1, 15);
        g.fillRect(ox + 18, dy + 19, 1, 15);

        // arms
        g.fillStyle(C.body);
        if (state === 'punch') {
            g.fillRect(ox + 0, dy + 20, 8, 6);
            g.fillRect(ox + 24, dy + 20, 10, 6);
        } else if (state === 'block') {
            g.fillRect(ox + 2, dy + 14, 6, 14); g.fillRect(ox + 24, dy + 14, 6, 14);
        } else {
            g.fillRect(ox + 2, dy + 20, 6, 8); g.fillRect(ox + 24, dy + 20, 6, 8);
        }

        // legs
        g.fillStyle(C.body);
        if (state === 'run0' || state === 'run2') {
            g.fillRect(ox + 9, dy + 36, 6, 12); g.fillRect(ox + 17, dy + 36, 6, 7);
            g.fillStyle(C.dark); g.fillRect(ox + 9, dy + 46, 6, 2);
        } else if (state === 'run1' || state === 'run3') {
            g.fillRect(ox + 9, dy + 36, 6, 7); g.fillRect(ox + 17, dy + 36, 6, 12);
            g.fillStyle(C.dark); g.fillRect(ox + 17, dy + 46, 6, 2);
        } else if (state === 'jump') {
            g.fillRect(ox + 7, dy + 36, 7, 8); g.fillRect(ox + 18, dy + 36, 7, 8);
        } else if (state === 'kick') {
            g.fillRect(ox + 9, dy + 36, 6, 10);
            g.fillRect(ox + 17, dy + 28, 15, 7);
            g.fillStyle(C.dark); g.fillRect(ox + 29, dy + 28, 3, 7);
        } else {
            g.fillRect(ox + 9, dy + 36, 6, 10); g.fillRect(ox + 17, dy + 36, 6, 10);
            g.fillStyle(C.dark); g.fillRect(ox + 9, dy + 44, 6, 2); g.fillRect(ox + 17, dy + 44, 6, 2);
        }

        if (state === 'hurt') {
            g.fillStyle(0xff4444, 0.35);
            g.fillRect(ox, 0, PW, PH);
        }
    }

    // ── Enemy ─────────────────────────────────────────────────────────────────

    private generateEnemyTextures() {
        const states = ['idle', 'idle2', 'run0', 'run1', 'run2', 'run3', 'attack', 'hurt', 'dead'];
        const gfx = this.add.graphics();

        states.forEach((state, i) => this.drawEnemyFrame(gfx, i * EW, state));

        gfx.generateTexture('enemy', EW * states.length, EH);
        gfx.destroy();

        const tex = this.textures.get('enemy');
        states.forEach((_, i) => tex.add(i, 0, i * EW, 0, EW, EH));
    }

    private drawEnemyFrame(g: Phaser.GameObjects.Graphics, ox: number, state: string) {
        const C = { body: 0x546e7a, dark: 0x263238, mask: 0x000000, band: 0x7b1fa2, eye: 0xffd600 };

        if (state === 'dead') {
            g.fillStyle(C.body); g.fillRect(ox, EH - 10, EW - 2, 10);
            g.fillStyle(C.band); g.fillRect(ox, EH - 9, 8, 5);
            return;
        }

        const dy = 0;
        // head
        g.fillStyle(C.dark); g.fillRect(ox + 8, dy + 4, 12, 12);
        // mask (lower face)
        g.fillStyle(C.mask); g.fillRect(ox + 6, dy + 10, 16, 6);
        // headband
        g.fillStyle(C.band); g.fillRect(ox + 6, dy + 7, 16, 4);
        g.fillRect(ox - 2, dy + 7, 9, 3);
        // eyes
        g.fillStyle(C.eye); g.fillRect(ox + 9, dy + 8, 3, 3); g.fillRect(ox + 16, dy + 8, 3, 3);
        // neck + torso
        g.fillStyle(C.body); g.fillRect(ox + 11, dy + 16, 6, 2); g.fillRect(ox + 6, dy + 18, 16, 16);

        // arms
        if (state === 'attack') {
            g.fillRect(ox + 0, dy + 20, 6, 6);
            g.fillRect(ox + 22, dy + 16, 10, 6);
        } else {
            g.fillRect(ox + 0, dy + 20, 6, 8); g.fillRect(ox + 22, dy + 20, 6, 8);
        }

        // legs
        g.fillStyle(C.dark);
        if (state === 'run0' || state === 'run2') {
            g.fillRect(ox + 7, dy + 34, 5, 10); g.fillRect(ox + 16, dy + 34, 5, 6);
        } else if (state === 'run1' || state === 'run3') {
            g.fillRect(ox + 7, dy + 34, 5, 6); g.fillRect(ox + 16, dy + 34, 5, 10);
        } else {
            g.fillRect(ox + 7, dy + 34, 5, 8); g.fillRect(ox + 16, dy + 34, 5, 8);
        }

        if (state === 'hurt') {
            g.fillStyle(0xff4444, 0.4);
            g.fillRect(ox, 0, EW, EH);
        }
    }

    // ── Pizza ─────────────────────────────────────────────────────────────────

    private generatePizzaTexture() {
        const gfx = this.add.graphics();
        // crust
        gfx.fillStyle(0xf57f17); gfx.fillCircle(12, 12, 11);
        // sauce
        gfx.fillStyle(0xc62828); gfx.fillCircle(12, 12, 8);
        // cheese
        gfx.fillStyle(0xffeb3b); gfx.fillCircle(12, 12, 6);
        // pepperoni
        gfx.fillStyle(0xb71c1c);
        gfx.fillCircle(9, 9, 2); gfx.fillCircle(15, 10, 2); gfx.fillCircle(11, 15, 2);
        gfx.generateTexture('pizza', 24, 24);
        gfx.destroy();
    }

    // ── Tiles ─────────────────────────────────────────────────────────────────

    private generateTileTextures() {
        // Ground tile 32×32
        const gg = this.add.graphics();
        gg.fillStyle(0x5d4037); gg.fillRect(0, 0, 32, 32);
        gg.fillStyle(0x8d6e63); gg.fillRect(0, 0, 32, 4);
        gg.fillStyle(0x4e342e);
        gg.fillRect(0, 4, 16, 1); gg.fillRect(16, 16, 16, 1);
        gg.fillRect(0, 14, 32, 1); gg.fillRect(0, 25, 32, 1);
        gg.generateTexture('ground', 32, 32);
        gg.destroy();

        // Platform tile 32×16
        const pg = this.add.graphics();
        pg.fillStyle(0x1565c0); pg.fillRect(0, 0, 32, 16);
        pg.fillStyle(0x42a5f5); pg.fillRect(0, 0, 32, 3);
        pg.fillStyle(0x0d47a1); pg.fillRect(0, 14, 32, 2); pg.fillRect(0, 8, 32, 1); pg.fillRect(16, 0, 1, 16);
        pg.generateTexture('platform', 32, 16);
        pg.destroy();
    }

    // ── Backgrounds ───────────────────────────────────────────────────────────

    private generateBackgroundTextures() {
        // Sky (1024×576)
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x1a1a4e, 0x1a1a4e);
        sky.fillRect(0, 0, 1024, 576);
        // moon
        sky.fillStyle(0xfffde7); sky.fillCircle(900, 80, 36);
        sky.fillStyle(0x0d1b2a); sky.fillCircle(916, 70, 32);
        // stars
        sky.fillStyle(0xffffff);
        [[50,30],[120,80],[200,20],[350,60],[450,10],[600,40],[700,70],[800,25],
         [150,120],[300,100],[500,90],[650,110],[750,50],[950,130]].forEach(([x,y]) => sky.fillRect(x, y, 2, 2));
        sky.generateTexture('bg-sky', 1024, 576);
        sky.destroy();

        // City silhouette (2048×576) – mid-layer parallax
        const city = this.add.graphics();
        const buildings = [
            [0,240],[130,200],[220,300],[330,180],[410,260],[560,220],[660,290],
            [780,170],[870,250],[1010,210],[1120,270],[1250,190],[1340,280],[1500,230],
            [1600,260],[1720,180],[1810,240],[1950,200]
        ];
        const bw = [120,80,100,70,140,90,110,80,130,100,120,80,150,90,110,80,130,100];
        const cols = [0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a4e];
        buildings.forEach(([bx, bh], i) => {
            city.fillStyle(cols[i % cols.length]);
            city.fillRect(bx, 576 - bh, bw[i], bh);
            // windows
            city.fillStyle(0xffd600, 0.7);
            for (let wy = 576 - bh + 10; wy < 560; wy += 18) {
                for (let wx = bx + 8; wx < bx + bw[i] - 6; wx += 14) {
                    if (Math.sin(bx * 0.1 + wx + wy) > 0) city.fillRect(wx, wy, 5, 7);
                }
            }
        });
        city.generateTexture('bg-city', 2048, 576);
        city.destroy();

        // Street layer (4096×576) – near parallax
        const street = this.add.graphics();
        street.fillStyle(0x1c1c1c); street.fillRect(0, 510, 4096, 66);
        // lane markings
        street.fillStyle(0xffffff, 0.3);
        for (let sx = 0; sx < 4096; sx += 80) street.fillRect(sx, 543, 40, 3);
        // trash cans
        street.fillStyle(0x4caf50);
        for (let gx = 200; gx < 4096; gx += 350) {
            street.fillRect(gx, 488, 18, 22); street.fillStyle(0x388e3c);
            street.fillRect(gx - 1, 486, 20, 4); street.fillStyle(0x4caf50);
        }
        street.generateTexture('bg-street', 4096, 576);
        street.destroy();
    }

    // ── Shuriken ──────────────────────────────────────────────────────────────

    private generateShurikenTexture() {
        const g = this.add.graphics();
        g.fillStyle(0xb0bec5);
        // Draw star shape using triangles (4-point star)
        g.fillTriangle(8, 0,  4, 8,  12, 8);   // top blade
        g.fillTriangle(8, 16, 4, 8,  12, 8);   // bottom blade
        g.fillTriangle(0, 8,  8, 4,  8,  12);  // left blade
        g.fillTriangle(16, 8, 8, 4,  8,  12);  // right blade
        g.fillStyle(0x78909c); g.fillCircle(8, 8, 3);
        g.generateTexture('shuriken', 16, 16);
        g.destroy();
    }

    // ── Animations ────────────────────────────────────────────────────────────

    private createAnimations() {
        const A = this.anims;

        A.create({ key: 'player-idle', frames: [{ key: 'player', frame: 0 }, { key: 'player', frame: 1 }], frameRate: 2, repeat: -1 });
        A.create({ key: 'player-run', frames: [0, 1, 2, 3].map(f => ({ key: 'player', frame: f + 2 })), frameRate: 8, repeat: -1 });
        A.create({ key: 'player-jump', frames: [{ key: 'player', frame: 6 }], frameRate: 1, repeat: 0 });
        A.create({ key: 'player-punch', frames: [{ key: 'player', frame: 7 }, { key: 'player', frame: 0 }], frameRate: 12, repeat: 0 });
        A.create({ key: 'player-kick', frames: [{ key: 'player', frame: 8 }, { key: 'player', frame: 0 }], frameRate: 10, repeat: 0 });
        A.create({ key: 'player-hurt', frames: [{ key: 'player', frame: 9 }], frameRate: 1, repeat: 0 });
        A.create({ key: 'player-block', frames: [{ key: 'player', frame: 10 }], frameRate: 1, repeat: 0 });

        A.create({ key: 'enemy-idle', frames: [{ key: 'enemy', frame: 0 }, { key: 'enemy', frame: 1 }], frameRate: 2, repeat: -1 });
        A.create({ key: 'enemy-run', frames: [0, 1, 2, 3].map(f => ({ key: 'enemy', frame: f + 2 })), frameRate: 8, repeat: -1 });
        A.create({ key: 'enemy-attack', frames: [{ key: 'enemy', frame: 6 }, { key: 'enemy', frame: 0 }], frameRate: 6, repeat: 0 });
        A.create({ key: 'enemy-hurt', frames: [{ key: 'enemy', frame: 7 }], frameRate: 1, repeat: 0 });
        A.create({ key: 'enemy-dead', frames: [{ key: 'enemy', frame: 8 }], frameRate: 1, repeat: 0 });
    }
}
