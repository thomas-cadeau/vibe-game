import { Physics, Animations, GameObjects, Math as PhaserMath, Scene } from 'phaser';
import { Player } from './Player';

const ENEMY_SPEED = 95;
const ENEMY_HP = 30;
const ENEMY_DAMAGE = 10;
const CHASE_RANGE = 320;
const ATTACK_RANGE = 52;
const ATTACK_COOLDOWN = 1600;
const HURT_DURATION = 400;
const SCORE_VALUE = 100;

type EnemyState = 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';

export class Enemy extends Physics.Arcade.Sprite {
    private hp: number;
    private readonly maxHp: number;
    private enemyState: EnemyState = 'patrol';
    private patrolDir = 1;
    private patrolTimer = 0;
    private attackTimer = 0;
    private hurtTimer = 0;
    private readonly target: Player;
    private readonly onDead: (x: number, y: number) => void;
    private readonly onScorePlayer: (pts: number) => void;

    private hpBarBg!: GameObjects.Rectangle;
    private hpBar!: GameObjects.Rectangle;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        target: Player,
        onDead: (x: number, y: number) => void,
        onScorePlayer: (pts: number) => void
    ) {
        super(scene, x, y, 'enemy', 0);
        this.hp = ENEMY_HP;
        this.maxHp = ENEMY_HP;
        this.target = target;
        this.onDead = onDead;
        this.onScorePlayer = onScorePlayer;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scene.add.existing(this as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scene.physics.add.existing(this as any);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(18, 40);
        body.setOffset(5, 4);
        this.setCollideWorldBounds(true);
        this.setDepth(8);

        this.hpBarBg = scene.add.rectangle(x, y - 28, 28, 5, 0x333333).setDepth(20);
        this.hpBar = scene.add.rectangle(x, y - 28, 28, 5, 0xff3333).setDepth(21);

        this.patrolDir = Math.random() > 0.5 ? 1 : -1;
        this.patrolTimer = PhaserMath.Between(1200, 2800);
        this.anims.play('enemy-idle');
    }

    update(_time: number, delta: number) {
        if (this.enemyState === 'dead') return;

        // Keep HP bar above enemy
        this.hpBarBg.setPosition(this.x, this.y - 28);
        const pct = Math.max(0, this.hp / this.maxHp);
        const barW = pct * 28;
        this.hpBar.setPosition(this.x - 14 + barW / 2, this.y - 28);
        this.hpBar.width = barW;

        if (this.enemyState === 'hurt') {
            this.hurtTimer -= delta;
            if (this.hurtTimer <= 0) {
                this.enemyState = 'patrol';
                this.clearTint();
            }
            return;
        }

        this.attackTimer = Math.max(0, this.attackTimer - delta);

        const dist = PhaserMath.Distance.Between(this.x, this.y, this.target.x, this.target.y);
        const playerAlive = this.target.getHp() > 0;

        if (dist < ATTACK_RANGE + 10 && this.attackTimer <= 0 && playerAlive) {
            this.doAttack();
        } else if (dist < CHASE_RANGE && dist >= ATTACK_RANGE + 10 && playerAlive) {
            this.doChase();
        } else if (this.enemyState !== 'attack') {
            this.doPatrol(delta);
        }
    }

    private doAttack() {
        if (this.enemyState === 'attack') return;
        this.enemyState = 'attack';
        this.attackTimer = ATTACK_COOLDOWN;
        this.setVelocityX(0);
        this.anims.play('enemy-attack', true);

        this.once(Animations.Events.ANIMATION_COMPLETE, () => {
            if (this.enemyState !== 'attack') return;
            this.enemyState = 'patrol';
            const nowDist = PhaserMath.Distance.Between(this.x, this.y, this.target.x, this.target.y);
            if (nowDist < ATTACK_RANGE + 20 && this.target.getHp() > 0) {
                const dir = this.target.x > this.x ? 1 : -1;
                this.target.takeDamage(ENEMY_DAMAGE, dir);
            }
        });
    }

    private doChase() {
        this.enemyState = 'chase';
        const dir = this.target.x > this.x ? 1 : -1;
        this.setVelocityX(dir * ENEMY_SPEED);
        this.setFlipX(dir < 0);
        this.anims.play('enemy-run', true);
    }

    private doPatrol(delta: number) {
        this.enemyState = 'patrol';
        this.patrolTimer -= delta;
        const body = this.body as Physics.Arcade.Body;

        if (this.patrolTimer <= 0 || body.blocked.left || body.blocked.right) {
            this.patrolDir *= -1;
            this.patrolTimer = PhaserMath.Between(1500, 3000);
        }

        this.setVelocityX(this.patrolDir * ENEMY_SPEED * 0.45);
        this.setFlipX(this.patrolDir < 0);
        this.anims.play('enemy-idle', true);
    }

    takeDamage(amount: number, knockbackDir = 0) {
        if (this.enemyState === 'dead') return;

        this.hp -= amount;
        this.enemyState = 'hurt';
        this.hurtTimer = HURT_DURATION;
        this.setTint(0xff4444);
        this.anims.play('enemy-hurt', true);

        if (knockbackDir !== 0) {
            this.setVelocityX(knockbackDir * 260);
            this.setVelocityY(-120);
        }

        if (this.hp <= 0) this.die();
    }

    private die() {
        this.enemyState = 'dead';
        this.setVelocityX(0);
        this.anims.play('enemy-dead', true);
        this.hpBarBg.destroy();
        this.hpBar.destroy();
        this.onScorePlayer(SCORE_VALUE);

        // 55% chance to drop pizza
        if (Math.random() < 0.55) this.onDead(this.x, this.y - 10);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            delay: 900,
            duration: 500,
            onComplete: () => { if (this.active) this.destroy(); }
        });
    }

    destroy(fromScene?: boolean) {
        if (this.hpBarBg?.active) this.hpBarBg.destroy();
        if (this.hpBar?.active) this.hpBar.destroy();
        super.destroy(fromScene);
    }

    isDead() { return this.enemyState === 'dead'; }
}
