import { Sprite } from "pixi.js";
import { Graphics } from "pixi.js";

import { PixiScene } from "../../../engine/scenemanager/scenes/PixiScene";
import { Tween } from "tweedle.js";
import { Manager } from "../../..";
import { Keyboard } from "../../../engine/input/Keyboard";
import { Key } from "../../../engine/input/Key";
import { Bala } from "../elements/Bala";
import { Enemy } from "../elements/Enemy";

export class GameScene extends PixiScene {
	public static readonly BUNDLES = ["package-2"];
	private fondogame: Graphics = new Graphics();
	private nube: Sprite;
	private keybinds: Keyboard;

	private player: Graphics = new Graphics();
	private playerSpeed: number = 10;
	private shootDelayS: number = 10;
	private lastShoot: number = 0;

	private enemies: Array<Enemy> = new Array<Enemy>();
	private balas: Array<Bala> = new Array<Bala>();

	constructor() {
		super();

		this.fondogame.beginFill(0x86d3f0);
		this.fondogame.drawRect(0, 0, 1, 1);
		this.addChild(this.fondogame);

		this.nube = Sprite.from("nube");
		this.nube.x = Manager.width;
		this.nube.scale.set(0.5);
		this.addChild(this.nube);

		this.player.beginFill(0x4309ae);
		this.player.drawRect(0, 0, 65, 50);
		this.player.position.set(300, 500);
		this.addChild(this.player);

		new Tween(this.nube)
			.to({ x: -this.nube.width }, 1000)
			.start()
			.repeat(Infinity)
			.onRepeat(() => {
				this.nube.x = Manager.width;
				this.nube.y = 50 + 100 * Math.random();
			});
		this.keybinds = new Keyboard();

		this.spawnEnemy();
	}

	private spawnEnemy(): void {
		const enemy = new Enemy();
		this.enemies.push(enemy);
		this.addChild(enemy);
		enemy.position.set(1200, 500);
	}

	public override update(_dt: number): void {
		this.playerMovement();
		if (this.keybinds.isDown(Key.SPACE) && this.lastShoot >= this.shootDelayS) {
			this.lastShoot = 0;
			const bulletOffset = 20; // offset es separacion, se suma 20 para que no este pegado al jugador
			const bullet = new Bala(Manager.width - this.player.x + this.player.width + bulletOffset);
			this.addChild(bullet);
			this.balas.push(bullet);
			bullet.position.set(this.player.x + this.player.width + bulletOffset, this.player.y + this.player.height / 2);
		}
		this.lastShoot++;
		// ++ es lo mismo que
		// Algo = Algo + 1 (Algo tiene que tener un numero adentro)
		// Algo++

		// Chequear si el arreglo de balas no esta vacio
		if (this.balas.length > 0) {
			// recorrer todo el arreglo de balas
			for (const bala of this.balas) {
				// Chequear si el arreglo de enemigos no esta vacio
				if (this.enemies.length > 0) {
					// recorrer todo el arreglo de enemigos
					for (const enemy of this.enemies) {
						const hit = bala.body.getBounds().intersects(enemy.body.getBounds());
						if (hit) {
							console.log("hit");
							enemy.getHit();
						}
					}
				}

				if (!bala.destroyed && bala.x >= Manager.width - this.player.x) {
					const index = this.balas.indexOf(bala);
					this.balas.splice(index, 1);
				}
			}
		}
	}

	private playerMovement(): void {
		if (this.keybinds.isDown(Key.KEY_W) || this.keybinds.isDown("ArrowUp")) {
			this.player.y = this.player.y - this.playerSpeed;

			if (this.player.y < 0) {
				this.player.y = 0;
			}
		}
		if (this.keybinds.isDown(Key.KEY_S) || this.keybinds.isDown("ArrowDown")) {
			this.player.y = this.player.y + this.playerSpeed;
			if (this.player.y > Manager.height - this.player.height) {
				this.player.y = Manager.height - this.player.height;
			}
		}
	}

	public override onResize(_newW: number, _newH: number): void {
		this.fondogame.width = _newW;
		this.fondogame.height = _newH;
	}
}
