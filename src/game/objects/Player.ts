import { Physics, Input, Animations, GameObjects, Scene } from 'phaser';
import type { Types } from 'phaser';
import { EventBus } from '../EventBus';

const SPEED = 200;
const JUMP_VEL = -560;
const COYOTE_MS = 120;
const ATTACK_COOLDOWN = 380;
const HURT_DURATION = 500;

export interface IDamageable extends GameObjects.GameObject {
    x: number;
    y: number;
    active: boolean;
    takeDamage(amount: number, knockbackDir: number): void;
}

export class Player extends Physics.Arcade.Sprite {
    private hp = 100;
    private readonly maxHp = 100;
    private score = 0;
    private shurikens = 5;

    private cursors!: Types.Input.Keyboard.CursorKeys;
    private keyZ!: Input.Keyboard.Key;  // punch
    private keyX!: Input.Keyboard.Key;  // kick
    private keyA!: Input.Keyboard.Key;  // left
    private keyD!: Input.Keyboard.Key;  // right
    private keyW!: Input.Keyboard.Key;  // jump
    private keyS!: Input.Keyboard.Key;  // block/duck
    private keyQ!: Input.Keyboard.Key;  // shuriken

    isAttacking = false;
    attackDamage = 0;
    attackRange = 0;
    attackJustStarted = false;
    facingRight = true;

    private isBlocking = false;
    private isHurt = false;
    private attackCooldown = 0;
    private hurtTimer = 0;
    private coyoteTime = 0;

    private comboCount = 0;
    private comboTimer = 0;

    // Callback for Game scene to register shurikens with the physics group
    onShurikenCreated: ((shuriken: Physics.Arcade.Image) => void) | null = null;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'player', 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scene.add.existing(this as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scene.physics.add.existing(this as any);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(20, 42);
        body.setOffset(6, 4);
        this.setCollideWorldBounds(true);
        this.setDepth(10);

        this.setupInput();
        this.anims.play('player-idle');
    }

    private setupInput() {
        const kb = this.scene.input.keyboard!;
        this.cursors = kb.createCursorKeys();
        this.keyZ = kb.addKey(Input.Keyboard.KeyCodes.Z);
        this.keyX = kb.addKey(Input.Keyboard.KeyCodes.X);
        this.keyA = kb.addKey(Input.Keyboard.KeyCodes.A);
        this.keyD = kb.addKey(Input.Keyboard.KeyCodes.D);
        this.keyW = kb.addKey(Input.Keyboard.KeyCodes.W);
        this.keyS = kb.addKey(Input.Keyboard.KeyCodes.S);
        this.keyQ = kb.addKey(Input.Keyboard.KeyCodes.Q);
    }

    update(_time: number, delta: number) {
        this.attackJustStarted = false;

        if (this.isHurt) {
            this.hurtTimer -= delta;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
                this.clearTint();
            }
            return;
        }

        const body = this.body as Physics.Arcade.Body;
        const onGround = body.blocked.down;

        if (onGround) this.coyoteTime = COYOTE_MS;
        else this.coyoteTime = Math.max(0, this.coyoteTime - delta);

        this.attackCooldown = Math.max(0, this.attackCooldown - delta);
        this.comboTimer = Math.max(0, this.comboTimer - delta);
        if (this.comboTimer <= 0) this.comboCount = 0;

        const left = this.cursors.left!.isDown || this.keyA.isDown;
        const right = this.cursors.right!.isDown || this.keyD.isDown;
        const jumpJust = Input.Keyboard.JustDown(this.cursors.space!) ||
                         Input.Keyboard.JustDown(this.cursors.up!) ||
                         Input.Keyboard.JustDown(this.keyW);
        const block = (this.cursors.down!.isDown || this.keyS.isDown) && onGround;
        const punchJust = Input.Keyboard.JustDown(this.keyZ);
        const kickJust = Input.Keyboard.JustDown(this.keyX);
        const shurikenJust = Input.Keyboard.JustDown(this.keyQ);

        this.isBlocking = block;

        if (this.isAttacking) return;

        if (this.isBlocking) {
            this.setVelocityX(0);
            this.anims.play('player-block', true);
            return;
        }

        // Horizontal movement
        if (left) {
            this.setVelocityX(-SPEED);
            this.facingRight = false;
            this.setFlipX(true);
        } else if (right) {
            this.setVelocityX(SPEED);
            this.facingRight = true;
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        // Jump
        if (jumpJust && this.coyoteTime > 0) {
            this.setVelocityY(JUMP_VEL);
            this.coyoteTime = 0;
            // Dust particle on jump
            EventBus.emit('player-jump', { x: this.x, y: this.y + 22 });
        }

        // Attacks
        if (punchJust && this.attackCooldown <= 0) {
            this.startAttack('punch', 15, 60);
        } else if (kickJust && this.attackCooldown <= 0) {
            this.startAttack('kick', 25, 72);
        } else if (shurikenJust && this.shurikens > 0) {
            this.doThrowShuriken();
        }

        // Animations
        if (!onGround) {
            this.anims.play('player-jump', true);
        } else if (left || right) {
            this.anims.play('player-run', true);
        } else {
            this.anims.play('player-idle', true);
        }
    }

    private startAttack(type: 'punch' | 'kick', damage: number, range: number) {
        this.isAttacking = true;
        this.attackDamage = damage;
        this.attackRange = range;
        this.attackCooldown = ATTACK_COOLDOWN;
        this.attackJustStarted = true;
        this.setVelocityX(0);

        this.anims.play(`player-${type}`, true);
        this.once(Animations.Events.ANIMATION_COMPLETE, () => {
            this.isAttacking = false;
        });
    }

    private doThrowShuriken() {
        this.shurikens--;
        const velX = this.facingRight ? 650 : -650;
        const shuriken = this.scene.physics.add.image(
            this.x + (this.facingRight ? 20 : -20),
            this.y - 8,
            'shuriken'
        );
        shuriken.setVelocityX(velX);
        (shuriken.body as Physics.Arcade.Body).setAllowGravity(false);
        shuriken.setDepth(9);
        // Spin
        this.scene.tweens.add({ targets: shuriken, angle: this.facingRight ? 360 : -360, duration: 200, repeat: -1 });
        this.scene.time.delayedCall(2200, () => { if (shuriken.active) shuriken.destroy(); });

        if (this.onShurikenCreated) this.onShurikenCreated(shuriken);
        EventBus.emit('hud-update', { shurikens: this.shurikens });
    }

    onHitEnemy() {
        this.comboCount++;
        this.comboTimer = 1500;
        if (this.comboCount >= 3) EventBus.emit('combo-hit', this.comboCount);
        this.scene.cameras.main.shake(70, 0.005);
    }

    takeDamage(amount: number, knockbackDir: number = 0) {
        if (this.isHurt) return;

        const dmg = this.isBlocking ? Math.max(1, Math.floor(amount * 0.15)) : amount;
        this.hp = Math.max(0, this.hp - dmg);
        this.isHurt = true;
        this.hurtTimer = HURT_DURATION;
        this.setTint(0xff4444);
        this.anims.play('player-hurt', true);

        if (knockbackDir !== 0) {
            this.setVelocityX(knockbackDir * 220);
            this.setVelocityY(-160);
        }
        this.scene.cameras.main.shake(100, 0.01);
        EventBus.emit('hud-update', { hp: this.hp });

        if (this.hp <= 0) EventBus.emit('player-dead');
    }

    heal(amount: number) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        EventBus.emit('hud-update', { hp: this.hp });
    }

    addScore(pts: number) {
        this.score += pts;
        EventBus.emit('hud-update', { score: this.score });
    }

    getHp() { return this.hp; }
    getMaxHp() { return this.maxHp; }
    getScore() { return this.score; }
    getShurikens() { return this.shurikens; }
    getComboCount() { return this.comboCount; }
}
