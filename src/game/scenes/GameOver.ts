import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create(data: { score?: number; won?: boolean }) {
        const score = data?.score ?? 0;
        const won = data?.won ?? false;

        this.cameras.main.setBackgroundColor(won ? 0x1a3a1a : 0x1a0000);

        // Background tint
        this.add.image(512, 288, 'bg-sky').setAlpha(0.4);

        // Main result text
        const resultText = won ? 'COWABUNGA!\nVICTORY!' : 'GAME OVER';
        const resultColor = won ? '#4caf50' : '#f44336';

        this.add.text(512, 160, resultText, {
            fontFamily: 'Arial Black', fontSize: 64, color: resultColor,
            stroke: '#000000', strokeThickness: 12, align: 'center'
        }).setOrigin(0.5);

        if (won) {
            this.add.text(512, 260, 'The Foot Clan has been defeated!', {
                fontFamily: 'Arial', fontSize: 18, color: '#b9f6ca', fontStyle: 'italic'
            }).setOrigin(0.5);
        } else {
            this.add.text(512, 260, 'The ninjas were too many this time...', {
                fontFamily: 'Arial', fontSize: 18, color: '#ff8a80', fontStyle: 'italic'
            }).setOrigin(0.5);
        }

        // Score
        this.add.text(512, 320, `SCORE: ${score}`, {
            fontFamily: 'Arial Black', fontSize: 36, color: '#ffeb3b',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        // Buttons
        this.createButton(512, 400, 'PLAY AGAIN', () => this.scene.start('Game'));
        this.createButton(512, 460, 'MAIN MENU', () => this.scene.start('MainMenu'));

        EventBus.emit('current-scene-ready', this);
    }

    private createButton(x: number, y: number, label: string, onClick: () => void) {
        const bg = this.add.rectangle(x, y, 220, 44, 0x2e2e2e, 1)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0x4caf50);

        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(0x4caf50); text.setColor('#000000'); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x2e2e2e); text.setColor('#ffffff'); });
        bg.on('pointerdown', onClick);
    }
}
