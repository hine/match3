enchant();

// ゲームのサイズ
var GAME_WIDTH = 320;
var GAME_HEIGHT = 400;

// タッチだと、どうしても意図してるところより下を叩いてしまうのでそのオフセット
var TOUCH_OFFSETY = 4;

var LIMIT_TIME = 180;
var WARNING_TIME = 60;
var ALERT_TIME = 30;

var BOARD_WIDTH = 8;
var BOARD_HEIGHT = 8;

var BOARD_OFFSETX = 0;
var BOARD_OFFSETY = 80;

var GRID_SIZE = 40;
var TILE_WIDTH = 40;
var TILE_HEIGHT = 40;

var MARKER_SIZE = 36;

var TILE_VARIATION = 5;

// ボード
var Board = new Array (BOARD_WIDTH * BOARD_HEIGHT);

// ボードに配置されるタイルの情報
var Tile = enchant.Class.create({
    initialize: function(boardx, boardy) {
		this.boardx = boardx;
		this.boardy = boardy;
		this.boardnumber = boardy * BOARD_WIDTH + boardy;
		// タイルの生成
		this.birth();
	},

    birth: function(boardx, boardy) {
		this.image = 'images/tiles.png';
		this.tileNumber = Math.floor(Math.random() * TILE_VARIATION);
		//ベースとなるフレームの計算
		this.frame = this.tileNumber;
		this.vanished = false;
		this.marked = false;
	},

	animation: function() {
		// 現コマはアニメーションなし。
		this.frame = this.tileNumber;
	},

	vanish: function() {
		
	}
});

// マーク
var Mark = new Array ();

var Marker = enchant.Class.create(enchant.Sprite, {
	initialize: function(boardx, boardy, recentboardx, recentboardy, marknumber) {
		this.boardx = boardx;
		this.boardy = boardy;
		this.boardnumber = boardy * BOARD_WIDTH + boardx;
		this.marknumber = marknumber;
		enchant.Sprite.call(this, MARKER_SIZE, MARKER_SIZE);
		this.image = game.assets['images/line.png'];
		if (marknumber === 0) {
			this.frame = 0;
			this.opacity = 0.5;
			this.x = boardx * GRID_SIZE + ((GRID_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETX;
			this.y = boardy * GRID_SIZE + ((GRID_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETY;
		} else {
			if (recentboardy == boardy) {
				this.frame = 1;
			}
			if (recentboardx == boardx) {
				this.frame = 2;
			}
			if (((boardx - recentboardx) * (boardy - recentboardy)) < 0) {
				this.frame = 3;
			}
			if (((boardx - recentboardx) * (boardy - recentboardy)) > 0) {
				this.frame = 4;
			}
			this.opacity = 0.5;
			this.x = (boardx + recentboardx) / 2 * GRID_SIZE + ((GRID_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETX;
			this.y = (boardy + recentboardy) / 2 * GRID_SIZE + ((GRID_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETY;
		}
		this.scale(1.25, 1.25);
		game.rootScene.addChild(this);
    },

	remove: function() {
		game.rootScene.removeChild(this);
		delete Mark[this.marknum]; delete this;
    }
});

// ボード上のタイルを並べるグリッドのスプライト
var Grid = enchant.Class.create(enchant.Sprite, {
	initialize: function(boardx, boardy) {
		this.boardnumber = boardy * BOARD_WIDTH + boardx;
		enchant.Sprite.call(this, TILE_WIDTH, TILE_HEIGHT);
		this.image = game.assets[Board[this.boardnumber].image];
		this.frame = Board[this.boardnumber].frame;
		this.x = boardx * GRID_SIZE + ((GRID_SIZE - TILE_WIDTH) / 2) + BOARD_OFFSETX;
		this.y = boardy * GRID_SIZE + ((GRID_SIZE - TILE_HEIGHT) / 2) + BOARD_OFFSETY;
		this.centerx = this.x + (GRID_SIZE / 2);
		this.centery = this.y + (GRID_SIZE / 2);
		game.rootScene.addChild(this);
		this.addEventListener(Event.ENTER_FRAME, this.animation);
    },
									
	// アニメーションは実際のタイル次第
	animation: function () {
		Board[this.boardnumber].animation();
		this.frame = Board[this.boardnumber].frame;
    }
});

var PopScore = enchant.Class.create({
    initialize: function(x, y, score) {
        var scoreupLabel = new Label();
        var count = 0;
        scoreupLabel.x = x;
        scoreupLabel.y = y;
        scoreupLabel.text = score;
        scoreupLabel.font = "12px Arial";
        if (score <= 0) {
            scoreupLabel.color="#ff0000";            
        } else {
            scoreupLabel.color="#ffffff";            
        }
    	scoreupLabel.addEventListener(enchant.Event.ENTER_FRAME, function() {
			count++;
			if (count < 5) {
                scoreupLabel.y -= 10;
            } else if (count < 15) {
                scoreupLabel.y += 5;
                scoreupLabel.opacity = 1 - ((count - 5) * 0.1);
            } else {
                game.rootScene.removeChild(scoreupLabel);
                delete scoreupLabel;
                delete this;
            }
		});
        game.rootScene.addChild(scoreupLabel);
    }
});


// 各種関数群
var distance = function(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

// メインルーチン
window.onload = function() {
    game = new Game(GAME_WIDTH, GAME_HEIGHT);

	// 得点
    var score = 0;

	var markedClass = null;
	var markedNumber = null;
	var markmode = false;

    game.preload('images/bg_image.jpg', 'images/tiles.png', 'images/marker.png', 'images/line.png');
    game.onload = function() {

		// 背景設定
		var bgImage = new Sprite(320, 400);
		bgImage.image = game.assets['images/bg_image.jpg'];
		game.rootScene.addChild(bgImage);

		// ボードの生成
		for (var i = 0; i < BOARD_HEIGHT; i++) {
			for (var j = 0; j < BOARD_WIDTH; j++) {
				var number = i * BOARD_WIDTH + j;
				Board[number] = new Tile(j, i);
				Board[number].grid = new Grid(j, i);
			}
		}

		// 得点表示
		var scoreLabel = new Label();
		scoreLabel.x = 10;
		scoreLabel.y = 32;
		scoreLabel.color="#ffffff";
		scoreLabel.font = "18px Arial";
		scoreLabel.addEventListener(enchant.Event.ENTER_FRAME, function() {
			if (score < 0) {
				scoreLabel.color="#ff0000";
			} else {
				scoreLabel.color="#ffffff";
			}
			this.text = "SCORE : " + score;
        });
        game.rootScene.addChild(scoreLabel);

		// 時間表示
		var timeLabel = new Label();
		timeLabel.x = 220;
		timeLabel.y = 32;
		timeLabel.color = "#ffffff";
        timeLabel.font = "18px Arial";
		timeLabel.addEventListener(enchant.Event.ENTER_FRAME, function() {
			time = Math.floor(LIMIT_TIME - (game.frame / game.fps));
			this.text = "TIME : " + time;
			if (time <= WARNING_TIME) {
				timeLabel.color="#ffff00";
			}
			if (time <= ALERT_TIME) {
				timeLabel.color="#ff0000";
			}
            if (time <= 0) {
				alert("Your score is " + score + ".");
				game.stop();
			}
        });
        game.rootScene.addChild(timeLabel);

		// 
		game.rootScene.addEventListener(Event.ENTER_FRAME, function () {
			if (markmode === false) {
				for (var i = BOARD_HEIGHT - 1; i >= 0; i--) {
					for (var j = 0; j < BOARD_WIDTH; j++) {
						var boardnumber = (i * BOARD_WIDTH) + j;
						// ボード上のタイルが論理消滅している場合に上から下におろす処理
						if (Board[boardnumber].vanished === true) {
							if (i === 0) {
								// 一番上の行の場合は新規生成
								Board[boardnumber].birth();
							} else {
								// 一つ上のタイルを下に下ろす
								Board[boardnumber].tileNumber = Board[boardnumber - BOARD_WIDTH].tileNumber;
								Board[boardnumber].vanished = Board[boardnumber - BOARD_WIDTH].vanished;
								Board[boardnumber - BOARD_WIDTH].vanished = true;
							}
						}
					}
				}
			}
		});

		game.rootScene.addEventListener(Event.TOUCH_START, function (e) {
			var touchX = e.localX;
        	var touchY = e.localY - TOUCH_OFFSETY;
			if ((touchX >= BOARD_OFFSETX) && (touchX < BOARD_OFFSETX + BOARD_WIDTH * GRID_SIZE) && (touchY >= BOARD_OFFSETY) && (touchY < BOARD_OFFSETY + BOARD_HEIGHT * GRID_SIZE))  {
				if (markmode === false) {
					var touchboardx = Math.floor((touchX - BOARD_OFFSETX) / GRID_SIZE);
					var touchboardy = Math.floor((touchY - BOARD_OFFSETY) / GRID_SIZE);
					var touchboardnumber = touchboardy * BOARD_WIDTH + touchboardx;
					markmode = true;
					markedNumber = Board[touchboardnumber].tileNumber;
					var markerNumber = Marker.length;
					Mark[markerNumber] = new Marker(touchboardx, touchboardy, 0, 0, markerNumber);
					Board[touchboardnumber].marked = markerNumber;
				}
			}
		});
	    
		game.rootScene.addEventListener(Event.TOUCH_MOVE, function (e) {
			var touchX = e.localX;
			var touchY = e.localY - TOUCH_OFFSETY;
			if (markmode === true) {
				var touchboardx = Math.floor((touchX - BOARD_OFFSETX) / GRID_SIZE);
				var touchboardy = Math.floor((touchY - BOARD_OFFSETY) / GRID_SIZE);
				var touchboardnumber = touchboardy * BOARD_WIDTH + touchboardx;
				if ((touchboardx >= 0) && (touchboardx < BOARD_WIDTH) && (touchboardy >= 0) && (touchboardy < BOARD_HEIGHT) && (distance(touchX, touchY, Board[touchboardnumber].grid.centerx, Board[touchboardnumber].grid.centery) < GRID_SIZE / 2)) {
					if (Board[touchboardnumber].marked === false) {
						var markerNumber = Mark.length;
						if ((Math.pow(Mark[markerNumber - 1].boardx - touchboardx, 2) <= 1) && (Math.pow(Mark[markerNumber - 1].boardy - touchboardy, 2) <= 1)) {
							if (Board[touchboardnumber].tileNumber == markedNumber) {
								// 近隣かつ同種だった場合にマークを伸ばす
								Mark[markerNumber] = new Marker(touchboardx, touchboardy, Mark[markerNumber - 1].boardx, Mark[markerNumber - 1].boardy, markerNumber);
								Board[touchboardnumber].marked = markerNumber;
							}
						}
					} else {
						var markerNumber = Board[touchboardnumber].marked;
						for (var i = Mark.length - 1; i > markerNumber; i--) {
							// 経路の途中に戻った場合、そこまでマークを戻す
							Board[Mark[i].boardnumber].marked = false;
							Mark[i].remove();
							Mark = Mark.slice(0, i);
						}
					}
				}
			}
		});
	    
		game.rootScene.addEventListener(Event.TOUCH_END, function (e) {
			if (markmode === true) {
	
				var deletemode = false;
				var markerNumber = Mark.length;
				if (markerNumber >=2) {
					deletemode = true;
					if (markerNumber == 2) {
						// 2つしかつながってない場合は減点
						scoreup = -50;
					} else {
						// 3つ以上つながっている場合の特典ルール
						scoreup = 100 + ((50 + 10 * (Mark.length - 4)) * (Mark.length - 3)); 
					}
					// 得点のポップアップは最後に選択されたタイルの近くに出る
					var popX = Mark[markerNumber - 1].boardx * GRID_SIZE + BOARD_OFFSETX + 16;
					var popY = Mark[markerNumber - 1].boardy * GRID_SIZE + BOARD_OFFSETY + 30;
					var popScores = new PopScore(popX, popY, scoreup);
					score += scoreup;
				}
				markmode = false;
				for(var i in Mark) {
					if (deletemode === true) {
						Board[Mark[i].boardnumber].vanished = true;
					}
					Board[Mark[i].boardnumber].marked = false;
					Mark[i].remove();
				}
				Mark = [];
			}
		});
    };
    game.fps = 15;
    game.start();
};