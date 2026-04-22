import Phaser from 'phaser';
import { EventBus } from '../EventBus';

const BAR_W = 200;
const BAR_H = 18;

export class HUD {
    private scene: Phaser.Scene;
    private hpFill!: Phaser.GameObjects.Rectangle;
    private hpText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private shurikenText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private comboTimer = 0;
    private enemiesText!: Phaser.GameObjects.Text;
    private maxHp: number;

    constructor(scene: Phaser.Scene, hp: number, shurikens: number, totalEnemies: number) {
        this.scene = scene;
        this.maxHp = hp;
        this.build(hp, shurikens, totalEnemies);
        EventBus.on('hud-update', this.onHudUpdate, this);
        EventBus.on('combo-hit', this.onCombo, this);
    }

    private build(hp: number, shurikens: number, totalEnemies: number) {
        const f = 0; // scroll factor

        // HP bar background (no field needed, just displayed)
        this.scene.add.rectangle(16 + BAR_W / 2, 20, BAR_W + 4, BAR_H + 4, 0x111111)
            .setScrollFactor(f).setDepth(100).setAlpha(0.75);

        this.hpFill = this.scene.add.rectangle(16 + BAR_W / 2, 20, BAR_W, BAR_H, 0x4caf50)
            .setScrollFactor(f).setDepth(101);

        this.hpText = this.scene.add.text(16, 36, `HP ${hp}/${this.maxHp}`, {
            fontSize: '11px', color: '#ffffff', fontFamily: 'monospace'
        }).setScrollFactor(f).setDepth(102);

        // Score
        this.scoreText = this.scene.add.text(1024 - 12, 12, 'SCORE: 0', {
            fontSize: '16px', color: '#ffeb3b', fontFamily: 'Arial Black', stroke: '#000', strokeThickness: 3
        }).setOrigin(1, 0).setScrollFactor(f).setDepth(100);

        // Shurikens
        this.shurikenText = this.scene.add.text(12, 48, `★ Shurikens: ${shurikens}`, {
            fontSize: '13px', color: '#b0bec5', fontFamily: 'monospace'
        }).setScrollFactor(f).setDepth(100);

        // Enemy counter
        this.enemiesText = this.scene.add.text(12, 65, `Ninjas: ${totalEnemies}`, {
            fontSize: '13px', color: '#ff8a65', fontFamily: 'monospace'
        }).setScrollFactor(f).setDepth(100);

        // Combo text (hidden until combo)
        this.comboText = this.scene.add.text(512, 80, '', {
            fontSize: '28px', color: '#ffeb3b', fontFamily: 'Arial Black',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(f).setDepth(110).setAlpha(0);
    }

    update(delta: number) {
        if (this.comboTimer > 0) {
            this.comboTimer -= delta;
            if (this.comboTimer <= 0) {
                this.scene.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 });
            }
        }
    }

    private onHudUpdate(data: { hp?: number; score?: number; shurikens?: number; enemies?: number }) {
        if (data.hp !== undefined) {
            const pct = Math.max(0, data.hp / this.maxHp);
            this.hpFill.width = BAR_W * pct;
            this.hpFill.x = 16 + (BAR_W * pct) / 2;
            const col = pct > 0.6 ? 0x4caf50 : pct > 0.3 ? 0xffc107 : 0xf44336;
            this.hpFill.setFillStyle(col);
            this.hpText.setText(`HP ${data.hp}/${this.maxHp}`);
        }
        if (data.score !== undefined) this.scoreText.setText(`SCORE: ${data.score}`);
        if (data.shurikens !== undefined) this.shurikenText.setText(`★ Shurikens: ${data.shurikens}`);
        if (data.enemies !== undefined) this.enemiesText.setText(`Ninjas: ${data.enemies}`);
    }

    private onCombo(count: number) {
        this.comboText.setText(`${count}x COMBO!`);
        this.comboText.setAlpha(1);
        this.comboTimer = 1200;
        this.scene.tweens.add({
            targets: this.comboText,
            scaleX: 1.3, scaleY: 1.3,
            duration: 100, yoyo: true
        });
    }

    destroy() {
        EventBus.off('hud-update', this.onHudUpdate, this);
        EventBus.off('combo-hit', this.onCombo, this);
    }
}
