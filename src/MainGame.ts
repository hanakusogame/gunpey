//import tl = require("@akashic-extension/akashic-timeline");
import { MainScene } from "./MainScene";
declare function require(x: string): any;

// メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public finish: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		//const timeline = new tl.Timeline(scene);
		super({ scene: scene, x: 0, y: 0, width: 640, height: 360 });

		const bg = new g.FilledRect({
			scene: scene,
			width: g.game.width,
			height: g.game.height,
			cssColor: "white",
			opacity: 0.5,
		});
		this.append(bg);

		const base = new g.E({
			scene: scene,
			x: 20,
			y: 20,
			width: 640,
			height: 360,
		});
		this.append(base);

		const lineBase = new g.E({
			scene: scene,
			x: 20,
			y: 20,
			width: 640,
			height: 360,
		});
		this.append(lineBase);

		// マップ
		const wSize = 80;
		const hSize = 40;
		const w = 5;
		const h = 8;
		const dx = [1, 1, -1, -1]; //斜め４方向
		const dy = [-1, 1, 1, -1];
		let wallCnt = 0;

		const maps: Map[][] = [];
		for (let y = 0; y < h; y++) {
			maps[y] = [];
			for (let x = 0; x < w; x++) {
				const map = new Map({
					scene: scene,
					x: wSize * x,
					y: hSize * y,
					width: wSize - 2,
					height: hSize - 2,
					cssColor: "black",
					touchable: true,
				});
				base.append(map);

				map.pointDown.add(() => {
					if (map.panel) return;

					const xx = x * 2 + 1;
					const yy = y * 2 + 1;

					setPanel(xx, yy);

					clearLine(xx, yy);
				});

				maps[y][x] = map;
			}
		}

		//点を設置
		const points: Point[][] = [];
		for (let y = 0; y <= h * 2; y++) {
			points[y] = [];
			for (let x = 0; x <= w * 2; x++) {
				const point = new Point({
					scene: scene,
					x: (wSize / 2) * x,
					y: (hSize / 2) * y,
					width: 3,
					height: 3,
					cssColor: "yellow",
					opacity: 0,
				});
				base.append(point);
				points[y].push(point);

				//壁
				if (y === 0 || x === 0 || y === h * 2 || x === w * 2) {
					point.isWall = true;
				}
			}
		}

		//壁から壁に繋がっている部分を消す処理
		const clearLine = (x: number, y: number): void => {
			lines.length = 0;
			wallCnt = 0;
			test(null, points[y][x]);
			lines.forEach((line) => {
				line.cssColor = "red";
				line.modified();
				line.isCheck = false;
			});

			setTimeout(() => {
				lines.forEach((line) => {
					if (wallCnt >= 2) {
						line.destroy();
					} else {
						line.cssColor = "white";
						line.modified();
					}
				});
			}, 200);
		};

		//パネルを設置
		const setPanel = (x: number, y: number): void => {
			let bkNum = -1;
			for (let i = 0; i < 2; i++) {
				let num = 0;
				while (true) {
					num = scene.random.get(0, 3);
					if (bkNum !== num) {
						bkNum = num;
						break;
					}
				}

				joinPoint({ x: x, y: y }, { x: x + dx[num], y: y + dy[num] });
			}
		};

		//点と点をつなぐ
		const joinPoint = (point1: { x: number; y: number }, point2: { x: number; y: number }): void => {
			const p1 = points[point1.y][point1.x];
			const p2 = points[point2.y][point2.x];

			const line = drawLine(p1, p2); //線を引く
			line.points[0] = p1;
			line.points[1] = p2;

			p1.lines.push(line); //点に線を追加
			p2.lines.push(line);
		};

		//線を引く
		const drawLine = (p1: g.E, p2: g.E): Line => {
			//距離
			const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

			//角度
			const radian = Math.atan2(p2.y - p1.y, p2.x - p1.x);
			const degree = radian * (180 / Math.PI) - 90;

			//線
			const line = new Line({
				scene: scene,
				width: 10,
				height: distance,
				x: p1.x,
				y: p1.y,
				anchorX: 0.5,
				anchorY: 0,
				angle: degree,
				cssColor: "white",
			});
			lineBase.append(line);

			return line;
		};

		//探索
		const lines: Line[] = [];
		const test = (prevline: Line, point: Point): void => {
			if (point.isWall) wallCnt++;

			point.lines = point.lines.filter((line) => {
				if (line.destroyed()) return false;
				if ((prevline === null || prevline !== line) && !line.isCheck) {
					line.isCheck = true;
					lines.push(line);
					test(line, line.getNextPoint(point));
				}
				return true;
			});
		};

		// メインループ
		this.update.add(() => {
			return;
		});

		// 終了
		this.finish = () => {
			return;
		};

		// リセット
		this.reset = () => {
			return;
		};
	}
}

//マップクラス
class Map extends g.FilledRect {
	public panel: Panel;
}

//接続点
class Point extends g.FilledRect {
	public isWall = false;
	public lines: Line[] = [];
}

class Line extends g.FilledRect {
	public points: Point[] = [];
	public isCheck: boolean; //探索用の無限ループ防止用

	//次の点の取得
	public getNextPoint = (nowPoint: Point): Point => {
		for (let i = 0; i < this.points.length; i++) {
			if (nowPoint !== this.points[i]) {
				return this.points[i];
			}
		}
	};
}

//パネルクラス
class Panel extends g.E {
	public px = 0;
	public py = 0;
	public lines: g.FrameSprite[] = [];
	constructor(scene: MainScene) {
		super({
			scene: scene,
			x: 0,
			y: 0,
			width: 80,
			height: 40,
		});

		const array = [0, 1, 2, 3];
		let newArray = [0, 1, 2, 3];
		for (let i = 0; i < 2; i++) {
			const num = newArray[scene.random.get(0, newArray.length - 1)];
			newArray = newArray.filter((n) => n !== num);
			const line = new g.FrameSprite({
				scene: scene,
				src: scene.assets.line as g.ImageAsset,
				width: this.width,
				height: this.height,
				frames: array,
				frameNumber: num,
			});
			this.lines.push(line);
			this.append(line);
		}
	}
}
