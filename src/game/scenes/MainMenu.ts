import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        // Background
        this.add.image(512, 288, 'bg-sky');

        // Title
        const title = this.add.text(512, 140, 'NINJA TURTLE', {
            fontFamily: 'Arial Black', fontSize: 72, color: '#4caf50',
            stroke: '#000000', strokeThickness: 10, align: 'center'
        }).setOrigin(0.5);

        this.add.text(512, 220, 'B R A W L E R', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#ffeb3b',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        // Bounce animation on title
        this.tweens.add({
            targets: title,
            y: 150, scaleX: 1.03, scaleY: 1.03,
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Start prompt (blinking)
        const startText = this.add.text(512, 330, 'PRESS ENTER or CLICK TO START', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        this.tweens.add({ targets: startText, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

        // Controls
        this.add.text(512, 400, '← → Move   |   Space/↑ Jump   |   Z Punch   |   X Kick', {
            fontFamily: 'monospace', fontSize: 14, color: '#b0bec5'
        }).setOrigin(0.5);
        this.add.text(512, 424, 'Q Shuriken (5)   |   S Block (reduces damage)', {
            fontFamily: 'monospace', fontSize: 14, color: '#b0bec5'
        }).setOrigin(0.5);

        this.add.text(512, 470, 'Defeat all ninjas! Eat pizza to restore health.', {
            fontFamily: 'Arial', fontSize: 16, color: '#ffcc80', fontStyle: 'italic'
        }).setOrigin(0.5);

        // Draw a little turtle as decoration
        const g = this.add.graphics();
        g.fillStyle(0x4caf50); g.fillCircle(512, 540, 24);
        g.fillStyle(0x1565c0); g.fillRect(492, 534, 40, 10);
        g.fillStyle(0x8d6e63); g.fillCircle(512, 541, 16);

        // Input
        const enter = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.input.once('pointerdown', () => this.startGame());
        this.input.keyboard!.once('keydown-ENTER', () => this.startGame());
        this.input.keyboard!.once('keydown-SPACE', () => this.startGame());

        void enter; // suppress unused warning

        EventBus.emit('current-scene-ready', this);
    }

    private startGame() {
        this.cameras.main.fade(400, 0, 0, 0, false, (_cam: unknown, progress: number) => {
            if (progress === 1) this.scene.start('Game');
        });
    }
}
