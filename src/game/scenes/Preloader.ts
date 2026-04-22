import { Scene } from 'phaser';

const PW = 32;   // player frame width
const PH = 48;   // player frame height
const EW = 28;   // enemy frame width
const EH = 44;   // enemy frame height

// Helper to convert a hex number to CSS color string
function hex(n: number, alpha = 1): string {
    const r = (n >> 16) & 0xff;
    const g = (n >> 8)  & 0xff;
    const b =  n        & 0xff;
    return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

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
        // all assets generated programmatically in create()
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

    // ── Canvas texture helpers ─────────────────────────────────────────────────

    private makeTex(key: string, w: number, h: number): CanvasRenderingContext2D {
        const t = this.textures.createCanvas(key, w, h)!;
        return t.getContext();
    }

    private refreshTex(key: string) {
        (this.textures.get(key) as Phaser.Textures.CanvasTexture).refresh();
    }

    // ── Player ────────────────────────────────────────────────────────────────

    private generatePlayerTextures() {
        const states = ['idle', 'idle2', 'run0', 'run1', 'run2', 'run3', 'jump', 'punch', 'kick', 'hurt', 'block'];
        const w = PW * states.length;
        const ctx = this.makeTex('player', w, PH);

        states.forEach((state, i) => this.drawPlayerFrame(ctx, i * PW, state));
        this.refreshTex('player');

        const tex = this.textures.get('player');
        states.forEach((_, i) => tex.add(i, 0, i * PW, 0, PW, PH));
    }

    private drawPlayerFrame(ctx: CanvasRenderingContext2D, ox: number, state: string) {
        const C = { body: 0x4caf50, dark: 0x2e7d32, mask: 0x1565c0, eye: 0xffffff, shell: 0x8d6e63, shellDark: 0x5d4037 };
        const dy = state === 'hurt' ? 2 : 0;
        const fr = (c: number, a = 1) => { ctx.fillStyle = hex(c, a); };

        const rect = (x: number, y: number, w: number, h: number) => ctx.fillRect(ox + x, dy + y, w, h);

        // head
        fr(C.body); rect(10, 4, 12, 12);
        // mask band
        fr(C.mask); rect(8, 8, 16, 5); ctx.fillRect(ox + 24, dy + 8, 6, 3); ctx.fillRect(ox + 24, dy + 11, 4, 3);
        // eyes
        fr(C.eye); rect(10, 9, 4, 3); rect(18, 9, 4, 3);
        fr(C.dark); rect(12, 10, 2, 2); rect(20, 10, 2, 2);
        // neck + torso
        fr(C.body); rect(13, 16, 6, 3); rect(8, 18, 16, 18);
        // shell
        fr(C.shell); rect(10, 19, 12, 15);
        fr(C.shellDark);
        rect(10, 23, 12, 1); rect(10, 27, 12, 1); rect(10, 31, 12, 1);
        rect(14, 19, 1, 15); rect(18, 19, 1, 15);

        // arms
        fr(C.body);
        if (state === 'punch') {
            rect(0, 20, 8, 6); rect(22, 20, 10, 6);
        } else if (state === 'block') {
            rect(2, 14, 6, 14); rect(24, 14, 6, 14);
        } else {
            rect(2, 20, 6, 8); rect(24, 20, 6, 8);
        }

        // legs
        fr(C.body);
        if (state === 'run0' || state === 'run2') {
            rect(9, 36, 6, 12); rect(17, 36, 6, 7);
            fr(C.dark); rect(9, 46, 6, 2);
        } else if (state === 'run1' || state === 'run3') {
            rect(9, 36, 6, 7); rect(17, 36, 6, 12);
            fr(C.dark); rect(17, 46, 6, 2);
        } else if (state === 'jump') {
            rect(7, 36, 7, 8); rect(18, 36, 7, 8);
        } else if (state === 'kick') {
            rect(9, 36, 6, 10); rect(17, 28, 15, 7);
            fr(C.dark); rect(29, 28, 3, 7);
        } else {
            rect(9, 36, 6, 10); rect(17, 36, 6, 10);
            fr(C.dark); rect(9, 44, 6, 2); rect(17, 44, 6, 2);
        }

        if (state === 'hurt') {
            ctx.fillStyle = 'rgba(255,68,68,0.35)';
            ctx.fillRect(ox, 0, PW, PH);
        }
    }

    // ── Enemy ─────────────────────────────────────────────────────────────────

    private generateEnemyTextures() {
        const states = ['idle', 'idle2', 'run0', 'run1', 'run2', 'run3', 'attack', 'hurt', 'dead'];
        const ctx = this.makeTex('enemy', EW * states.length, EH);

        states.forEach((state, i) => this.drawEnemyFrame(ctx, i * EW, state));
        this.refreshTex('enemy');

        const tex = this.textures.get('enemy');
        states.forEach((_, i) => tex.add(i, 0, i * EW, 0, EW, EH));
    }

    private drawEnemyFrame(ctx: CanvasRenderingContext2D, ox: number, state: string) {
        const C = { body: 0x546e7a, dark: 0x263238, mask: 0x000000, band: 0x7b1fa2, eye: 0xffd600 };
        const fr = (c: number, a = 1) => { ctx.fillStyle = hex(c, a); };
        const rect = (x: number, y: number, w: number, h: number) => ctx.fillRect(ox + x, y, w, h);

        if (state === 'dead') {
            fr(C.body); rect(0, EH - 10, EW - 2, 10);
            fr(C.band); rect(0, EH - 9, 8, 5);
            return;
        }

        // head
        fr(C.dark); rect(8, 4, 12, 12);
        // mask
        fr(C.mask); rect(6, 10, 16, 6);
        // headband
        fr(C.band); rect(6, 7, 16, 4); rect(-2, 7, 9, 3);
        // eyes
        fr(C.eye); rect(9, 8, 3, 3); rect(16, 8, 3, 3);
        // torso
        fr(C.body); rect(11, 16, 6, 2); rect(6, 18, 16, 16);

        if (state === 'attack') {
            rect(0, 20, 6, 6); rect(22, 16, 10, 6);
        } else {
            rect(0, 20, 6, 8); rect(22, 20, 6, 8);
        }

        fr(C.dark);
        if (state === 'run0' || state === 'run2') {
            rect(7, 34, 5, 10); rect(16, 34, 5, 6);
        } else if (state === 'run1' || state === 'run3') {
            rect(7, 34, 5, 6); rect(16, 34, 5, 10);
        } else {
            rect(7, 34, 5, 8); rect(16, 34, 5, 8);
        }

        if (state === 'hurt') {
            ctx.fillStyle = 'rgba(255,68,68,0.4)';
            ctx.fillRect(ox, 0, EW, EH);
        }
    }

    // ── Pizza ─────────────────────────────────────────────────────────────────

    private generatePizzaTexture() {
        const ctx = this.makeTex('pizza', 24, 24);
        const circle = (x: number, y: number, r: number) => {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        };
        ctx.fillStyle = hex(0xf57f17); circle(12, 12, 11);
        ctx.fillStyle = hex(0xc62828); circle(12, 12, 8);
        ctx.fillStyle = hex(0xffeb3b); circle(12, 12, 6);
        ctx.fillStyle = hex(0xb71c1c);
        circle(9, 9, 2); circle(15, 10, 2); circle(11, 15, 2);
        this.refreshTex('pizza');
    }

    // ── Tiles ─────────────────────────────────────────────────────────────────

    private generateTileTextures() {
        // Ground tile 32×32
        const gg = this.makeTex('ground', 32, 32);
        gg.fillStyle = hex(0x5d4037); gg.fillRect(0, 0, 32, 32);
        gg.fillStyle = hex(0x8d6e63); gg.fillRect(0, 0, 32, 4);
        gg.fillStyle = hex(0x4e342e);
        gg.fillRect(0, 4, 16, 1); gg.fillRect(16, 16, 16, 1);
        gg.fillRect(0, 14, 32, 1); gg.fillRect(0, 25, 32, 1);
        this.refreshTex('ground');

        // Platform tile 32×16
        const pg = this.makeTex('platform', 32, 16);
        pg.fillStyle = hex(0x1565c0); pg.fillRect(0, 0, 32, 16);
        pg.fillStyle = hex(0x42a5f5); pg.fillRect(0, 0, 32, 3);
        pg.fillStyle = hex(0x0d47a1);
        pg.fillRect(0, 14, 32, 2); pg.fillRect(0, 8, 32, 1); pg.fillRect(16, 0, 1, 16);
        this.refreshTex('platform');
    }

    // ── Backgrounds ───────────────────────────────────────────────────────────

    private generateBackgroundTextures() {
        // Sky 1024×576
        const sky = this.makeTex('bg-sky', 1024, 576);
        const grad = sky.createLinearGradient(0, 0, 0, 576);
        grad.addColorStop(0, '#0d1b2a');
        grad.addColorStop(1, '#1a1a4e');
        sky.fillStyle = grad;
        sky.fillRect(0, 0, 1024, 576);
        // Moon
        sky.fillStyle = '#fffde7'; sky.beginPath(); sky.arc(900, 80, 36, 0, Math.PI * 2); sky.fill();
        sky.fillStyle = '#0d1b2a'; sky.beginPath(); sky.arc(916, 70, 32, 0, Math.PI * 2); sky.fill();
        // Stars
        sky.fillStyle = '#ffffff';
        [[50,30],[120,80],[200,20],[350,60],[450,10],[600,40],[700,70],[800,25],
         [150,120],[300,100],[500,90],[650,110],[750,50],[950,130]]
            .forEach(([x,y]) => sky.fillRect(x, y, 2, 2));
        this.refreshTex('bg-sky');

        // City silhouette 1024×576 (mid parallax)
        const city = this.makeTex('bg-city', 1024, 576);
        const buildings = [
            [0,240],[130,200],[220,300],[330,180],[410,260],[560,220],[660,290],
            [780,170],[870,250]
        ];
        const bw = [120,80,100,70,140,90,110,80,130];
        const cols = ['#1a1a2e','#16213e','#0f3460','#1a1a4e'];
        buildings.forEach(([bx, bh], i) => {
            city.fillStyle = cols[i % cols.length];
            city.fillRect(bx, 576 - bh, bw[i], bh);
            city.fillStyle = 'rgba(255,214,0,0.6)';
            for (let wy = 576 - bh + 10; wy < 560; wy += 18) {
                for (let wx = bx + 8; wx < bx + bw[i] - 6; wx += 14) {
                    if (Math.sin(bx * 0.1 + wx + wy) > 0) city.fillRect(wx, wy, 5, 7);
                }
            }
        });
        this.refreshTex('bg-city');

        // Street 1024×100 (near parallax)
        const street = this.makeTex('bg-street', 1024, 100);
        street.fillStyle = '#1c1c1c'; street.fillRect(0, 0, 1024, 100);
        street.fillStyle = 'rgba(255,255,255,0.25)';
        for (let sx = 0; sx < 1024; sx += 80) street.fillRect(sx, 50, 40, 3);
        this.refreshTex('bg-street');
    }

    // ── Shuriken ──────────────────────────────────────────────────────────────

    private generateShurikenTexture() {
        const ctx = this.makeTex('shuriken', 16, 16);
        ctx.fillStyle = hex(0xb0bec5);
        // 4-point star using triangles
        const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.fill();
        };
        tri(8, 0,  4, 8,  12, 8);
        tri(8, 16, 4, 8,  12, 8);
        tri(0, 8,  8, 4,  8,  12);
        tri(16, 8, 8, 4,  8,  12);
        ctx.fillStyle = hex(0x78909c);
        ctx.beginPath(); ctx.arc(8, 8, 3, 0, Math.PI * 2); ctx.fill();
        this.refreshTex('shuriken');
    }

    // ── Animations ────────────────────────────────────────────────────────────

    private createAnimations() {
        const A = this.anims;

        A.create({ key: 'player-idle', frames: [{ key: 'player', frame: 0 }, { key: 'player', frame: 1 }], frameRate: 2, repeat: -1 });
        A.create({ key: 'player-run', frames: [0, 1, 2, 3].map(f => ({ key: 'player', frame: f + 2 })), frameRate: 8, repeat: -1 });
        A.create({ key: 'player-jump', frames: [{ key: 'player', frame: 6 }], frameRate: 1, repeat: 0 });
        A.create({ key: 'player-punch', frames: [{ key: 'player', frame: 7 }, { key: 'player', frame: 0 }], frameRate: 5, repeat: 0 });
        A.create({ key: 'player-kick',  frames: [{ key: 'player', frame: 8 }, { key: 'player', frame: 0 }], frameRate: 5, repeat: 0 });
        A.create({ key: 'player-hurt', frames: [{ key: 'player', frame: 9 }], frameRate: 1, repeat: 0 });
        A.create({ key: 'player-block', frames: [{ key: 'player', frame: 10 }], frameRate: 1, repeat: 0 });

        A.create({ key: 'enemy-idle', frames: [{ key: 'enemy', frame: 0 }, { key: 'enemy', frame: 1 }], frameRate: 2, repeat: -1 });
        A.create({ key: 'enemy-run', frames: [0, 1, 2, 3].map(f => ({ key: 'enemy', frame: f + 2 })), frameRate: 8, repeat: -1 });
        A.create({ key: 'enemy-attack', frames: [{ key: 'enemy', frame: 6 }, { key: 'enemy', frame: 0 }], frameRate: 6, repeat: 0 });
        A.create({ key: 'enemy-hurt', frames: [{ key: 'enemy', frame: 7 }], frameRate: 1, repeat: 0 });
        A.create({ key: 'enemy-dead', frames: [{ key: 'enemy', frame: 8 }], frameRate: 1, repeat: 0 });
    }
}

