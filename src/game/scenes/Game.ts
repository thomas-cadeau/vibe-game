import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { HUD } from '../ui/HUD';

const WORLD_W = 4096;
const WORLD_H = 576;
const GROUND_Y = 544;   // top of ground tiles
const TILE_SIZE = 32;

// Platform definitions: [x, y, tilesWide]
const PLATFORMS: [number, number, number][] = [
    [160,  420, 6],
    [480,  340, 5],
    [768,  420, 5],
    [1056, 310, 6],
    [1408, 390, 5],
    [1696, 310, 5],
    [2080, 400, 6],
    [2464, 330, 5],
    [2816, 390, 5],
    [3168, 300, 6],
    [3488, 380, 5],
];

// Enemy spawn positions [x, y] (y=GROUND_Y-EH)
const ENEMY_SPAWNS: [number, number][] = [
    [380, GROUND_Y - 44],
    [680, GROUND_Y - 44],
    [980, GROUND_Y - 44],
    [1300, 310 - 44],    // on a platform
    [1700, GROUND_Y - 44],
    [2050, GROUND_Y - 44],
    [2400, 330 - 44],
    [2750, GROUND_Y - 44],
    [3100, GROUND_Y - 44],
    [3500, GROUND_Y - 44],
];

// Pizza spawn positions [x, y]
const PIZZA_SPAWNS: [number, number][] = [
    [300,  GROUND_Y - 24],
    [570,  340 - 24],
    [1090, 310 - 24],
    [1600, GROUND_Y - 24],
    [2500, 330 - 24],
    [3000, GROUND_Y - 24],
];

export class Game extends Scene {
    private player!: Player;
    private enemies!: Phaser.Physics.Arcade.Group;
    private pizzas!: Phaser.Physics.Arcade.StaticGroup;
    private ground!: Phaser.Physics.Arcade.StaticGroup;
    private hud!: HUD;
    private shurikenGroup!: Phaser.Physics.Arcade.Group;

    private totalEnemies = ENEMY_SPAWNS.length;
    private enemiesAlive = ENEMY_SPAWNS.length;
    private gameOver = false;

    private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super('Game');
    }

    create() {
        this.gameOver = false;
        this.enemiesAlive = this.totalEnemies;

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

        this.buildBackgrounds();
        this.buildLevel();
        this.buildDustEmitter();

        this.shurikenGroup = this.physics.add.group();
        this.player = new Player(this, 100, GROUND_Y - 50);
        this.player.onShurikenCreated = (sh) => this.shurikenGroup.add(sh as unknown as Phaser.Physics.Arcade.Sprite);
        this.spawnEnemies();
        this.spawnPizzas();

        this.setupColliders();
        this.setupCamera();

        this.hud = new HUD(this, 100, 5, this.totalEnemies);

        // Instructions hint (fades out)
        const hint = this.add.text(512, WORLD_H - 20, '← → Move  |  Space Jump  |  Z Punch  |  X Kick  |  Q Shuriken  |  S Block', {
            fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace'
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);
        this.tweens.add({ targets: hint, alpha: 0, delay: 5000, duration: 2000 });

        EventBus.on('player-dead', this.onPlayerDead, this);
        EventBus.on('player-jump', (data: { x: number; y: number }) => {
            this.dustEmitter.setPosition(data.x, data.y);
            this.dustEmitter.explode(6);
        }, this);

        EventBus.emit('current-scene-ready', this);
    }

    // ── Level building ────────────────────────────────────────────────────────

    private buildBackgrounds() {
        // Sky (fixed, no scroll)
        this.add.image(512, 288, 'bg-sky').setScrollFactor(0).setDepth(-3);

        // City silhouette – slow parallax (tile across world width)
        this.add.tileSprite(512, 288, 1024, 576, 'bg-city').setScrollFactor(0.15).setDepth(-2);

        // Street layer – near parallax
        this.add.tileSprite(512, 526, 1024, 100, 'bg-street').setScrollFactor(0.7).setDepth(-1);
    }

    private buildLevel() {
        this.ground = this.physics.add.staticGroup();
        this.pizzas = this.physics.add.staticGroup();

        // Ground tiles
        for (let gx = 0; gx < WORLD_W; gx += TILE_SIZE) {
            const tile = this.ground.create(gx + TILE_SIZE / 2, GROUND_Y + TILE_SIZE / 2, 'ground') as Phaser.Physics.Arcade.Image;
            tile.setDepth(0);
        }

        // Platform tiles
        for (const [px, py, tiles] of PLATFORMS) {
            for (let t = 0; t < tiles; t++) {
                const tile = this.ground.create(
                    px + t * TILE_SIZE + TILE_SIZE / 2,
                    py + 8,
                    'platform'
                ) as Phaser.Physics.Arcade.Image;
                tile.setDepth(1);
                (tile.body as Phaser.Physics.Arcade.StaticBody).setSize(32, 16);
            }
        }
    }

    private buildDustEmitter() {
        this.dustEmitter = this.add.particles(0, 0, 'ground', {
            speed: { min: 20, max: 60 },
            angle: { min: 200, max: 340 },
            scale: { start: 0.25, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 300,
            quantity: 0,
            tint: [0x8d6e63, 0xbcaaa4]
        }).setDepth(5);
    }

    private spawnEnemies() {
        this.enemies = this.physics.add.group();
        for (const [ex, ey] of ENEMY_SPAWNS) {
            const enemy = new Enemy(
                this, ex, ey,
                this.player,
                (x, y) => this.spawnPizzaAt(x, y),
                (pts) => {
                    this.player.addScore(pts);
                    this.enemiesAlive--;
                    EventBus.emit('hud-update', { enemies: this.enemiesAlive });
                    if (this.enemiesAlive <= 0) this.onVictory();
                }
            );
            this.enemies.add(enemy as unknown as Phaser.Physics.Arcade.Sprite);
        }
    }

    private spawnPizzas() {
        for (const [px, py] of PIZZA_SPAWNS) {
            this.spawnPizzaAt(px, py);
        }
    }

    private spawnPizzaAt(x: number, y: number) {
        const pizza = this.pizzas.create(x, y, 'pizza') as Phaser.Physics.Arcade.Image;
        pizza.setDepth(3);
        // Gentle bob
        this.tweens.add({ targets: pizza, y: y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ── Colliders & Overlaps ──────────────────────────────────────────────────

    private setupColliders() {
        this.physics.add.collider(this.player, this.ground, () => {
            // Landing dust
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            if (body.velocity.y > 200) {
                this.dustEmitter.setPosition(this.player.x, this.player.y + 22);
                this.dustEmitter.explode(8);
            }
        });
        this.physics.add.collider(this.enemies, this.ground);

        // Pizza collection
        this.physics.add.overlap(this.player, this.pizzas, (_p, pizza) => {
            const p = pizza as Phaser.Physics.Arcade.Image;
            if (!p.active) return;
            this.tweens.killTweensOf(p);
            p.destroy();
            this.player.heal(25);
            this.showFloatingText(this.player.x, this.player.y - 30, '+25 HP', '#4caf50');
        });

        // Player attack hits enemies
        this.physics.world.on('worldstep', () => {
            if (this.player.attackWindowMs <= 0) return;
            const dir = this.player.facingRight ? 1 : -1;
            const { attackDamage, attackRange } = this.player;
            let hit = false;

            this.enemies.getChildren().forEach(obj => {
                const enemy = obj as unknown as Enemy;
                if (!enemy.active || enemy.isDead()) return;
                if (this.player.hitThisSwing.has(enemy)) return;
                const dx = enemy.x - this.player.x;
                const dy = Math.abs(enemy.y - this.player.y);
                // Allow small tolerance behind the player (±15px) for close-range hits
                const inArc = this.player.facingRight ? dx >= -15 : dx <= 15;
                if (Math.abs(dx) < attackRange && inArc && dy < 70) {
                    enemy.takeDamage(attackDamage, dir);
                    this.player.hitThisSwing.add(enemy);
                    hit = true;
                }
            });

            if (hit) this.player.onHitEnemy();
        });

        // Single persistent shuriken-enemy overlap (no per-tick collider creation)
        this.physics.add.overlap(this.shurikenGroup, this.enemies, (shurikenObj, enemyObj) => {
            const enemy = enemyObj as unknown as Enemy;
            const shuriken = shurikenObj as Phaser.Physics.Arcade.Image;
            if (!enemy.active || enemy.isDead() || !shuriken.active) return;
            enemy.takeDamage(20, this.player.facingRight ? 1 : -1);
            this.player.onHitEnemy();
            shuriken.destroy();
        });
    }

    private setupCamera() {
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    // ── Win / Lose ────────────────────────────────────────────────────────────

    private onPlayerDead() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.cameras.main.flash(300, 255, 50, 50);
        this.time.delayedCall(1200, () => {
            this.scene.start('GameOver', { score: this.player.getScore(), won: false });
        });
    }

    private onVictory() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.cameras.main.flash(500, 80, 220, 80);
        this.showFloatingText(this.player.x, this.player.y - 60, 'VICTORY!', '#ffeb3b', 28);
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOver', { score: this.player.getScore(), won: true });
        });
    }

    // ── Update ────────────────────────────────────────────────────────────────

    update(time: number, delta: number) {
        if (this.gameOver) return;
        this.player.update(time, delta);
        this.hud.update(delta);

        this.enemies.getChildren().forEach(obj => {
            const enemy = obj as unknown as Enemy;
            if (enemy.active) enemy.update(time, delta);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private showFloatingText(x: number, y: number, msg: string, color: string, size = 18) {
        const txt = this.add.text(x, y, msg, {
            fontSize: `${size}px`, color, fontFamily: 'Arial Black',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(200).setScrollFactor(1);
        this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
    }

    // Clean up EventBus listeners when scene shuts down
    shutdown() {
        EventBus.off('player-dead', this.onPlayerDead, this);
        EventBus.off('player-jump', undefined, this);
        this.hud?.destroy();
    }
}
