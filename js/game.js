enchant();

// タッチだと、どうしても意図してるところより下を叩いてしまうのでそのオフセット
var TOUCH_OFFSETY = 4;

var LIMIT_TIME = 180;
var WARNING_TIME = 60;
var ALERT_TIME = 30;

var BOARD_WIDTH = 8;
var BOARD_HEIGHT = 8;

//var BOARD_OFFSETX = 32;
//var BOARD_OFFSETY = 52;
var BOARD_OFFSETX = 0;
var BOARD_OFFSETY = 80;

var CHIP_SIZE = 40;
var CHIP_WIDTH = 24;
var CHIP_HEIGHT = 32;

var CHIP_DIR = [2, 3, 0, 1];
var CHIP_WALK = [0, 1, 2, 1];

var POINTER_SIZE = 32;
var MARKER_SIZE = 36;

var MONSTER_VARIATION = 5;

// ボード
var Board = new Array (BOARD_WIDTH * BOARD_HEIGHT);

// ボードに配置されるモンスターの情報
var Monster = function () {
    this.birth = function () {
		this.chipnum = Math.floor(Math.random() * MONSTER_VARIATION);
		this.direction = Math.floor(Math.random() * 3);
		this.step = 0;
		this.walkspeed = Math.floor(Math.random() * 4) + 2;
		this.disapear = false;
		this.marked = false;
    };
    
    this.walk = function () {
		if ((game.frame % this.walkspeed) === 0) {
			this.step++;
			if (this.step == 4) {this.step = 0;}
		}
    };
    
    this.randomturn = function () {
		if (Math.floor(Math.random() * 60) === 0) {
			this.direction = Math.floor(Math.random() * 4);
		}
    };
};

// マーク
var Mark = new Array ();
var marked = null;
var markmode = false;

var Marker = enchant.Class.create(enchant.Sprite, {
	initialize: function(boardx, boardy, recentboardx, recentboardy, marknum) {
		this.boardx = boardx;
		this.boardy = boardy;
		this.boardnum = boardy * BOARD_WIDTH + boardx;
		this.marknum = marknum;
		enchant.Sprite.call(this, MARKER_SIZE, MARKER_SIZE);
		this.image = game.assets['images/line.png'];
		if (marknum === 0) {
			this.frame = 0;
			this.opacity = 0.5;
			this.x = boardx * CHIP_SIZE + ((CHIP_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETX;
			this.y = boardy * CHIP_SIZE + ((CHIP_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETY;
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
			this.x = (boardx + recentboardx) / 2 * CHIP_SIZE + ((CHIP_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETX;
			this.y = (boardy + recentboardy) / 2 * CHIP_SIZE + ((CHIP_SIZE - MARKER_SIZE) / 2) + BOARD_OFFSETY;
		}
		this.scale(1.25, 1.25);
		game.rootScene.addChild(this);
    },

	remove: function() {
		game.rootScene.removeChild(this);
		delete Mark[this.marknum]; delete this;
    }
});

// ボードの各チップのためのクラス
var Chip = enchant.Class.create(enchant.Sprite, {
	initialize: function(boardx, boardy) {
		this.boardx = boardx;
		this.boardy = boardy;
		this.num = (boardy * BOARD_HEIGHT) + boardx;
		enchant.Sprite.call(this, CHIP_WIDTH, CHIP_HEIGHT);
		this.image = game.assets['images/chara.png'];
		// this.scale(CHIP_SIZE / CHIP_WIDTH, CHIP_SIZE / CHIP_HEIGHT);
		this.x = boardx * CHIP_SIZE + ((CHIP_SIZE - CHIP_WIDTH) / 2) + BOARD_OFFSETX;
		this.y = boardy * CHIP_SIZE + ((CHIP_SIZE - CHIP_HEIGHT) / 2) + BOARD_OFFSETY;
		this.centerx = this.x + (CHIP_SIZE / 2);
		this.centery = this.y + (CHIP_SIZE / 2);
		Board[this.num] = new Monster();
		Board[this.num].birth();
		game.rootScene.addChild(this);
		this.addEventListener(Event.ENTER_FRAME, this.animation);
    },
    
    animation: function () {
		this.monster = Board[this.num];
		Board[this.num].walk();
		Board[this.num].randomturn();
		this.frame = Math.floor(Board[this.num].chipnum / 4) * (4 * 3 * 4) + CHIP_DIR[Board[this.num].direction] * (4 * 3) + (Board[this.num].chipnum % 4) * 3 + CHIP_WALK[Board[this.num].step];
    },
    
    mark: function () {
		Board[this.num].disapear = true;
    },

    remove: function () {
		Board[this.num].disapear = true;
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
                console.log(scoreupLabel.opacity);
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
    game = new Game(320, 400);

    var chips = [];
    
    var score = 0;

    game.preload('images/bg_image.jpg', 'images/chara.png', 'images/marker.png', 'images/line.png');
    game.onload = function() {
		var bgImage = new Sprite(320, 400);
		bgImage.image = game.assets['images/bg_image.jpg'];
		//bgImage.y = BOARD_OFFSETY;
		game.rootScene.addChild(bgImage);
		for (var i = 0; i < BOARD_HEIGHT; i++) {
			for (var j = 0; j < BOARD_WIDTH; j++) {
				var num = i * BOARD_HEIGHT + j;
				chips[num] = new Chip(j, i);
			}
		}

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
	
		game.rootScene.addEventListener(Event.ENTER_FRAME, function () {
			if (markmode === false) {
				for (var i = BOARD_HEIGHT - 1; i >= 0; i--) {
					for (var j = 0; j < BOARD_WIDTH; j++) {
						var num = (i * BOARD_WIDTH) + j;
						if (Board[num].disapear === true) {
							if (i === 0) {
								Board[num].birth();
							} else {
								Board[num].chipnum = Board[num - BOARD_WIDTH].chipnum;
								Board[num].direction = Board[num - BOARD_WIDTH].direction;
								Board[num].step = Board[num - BOARD_WIDTH].step;
								Board[num].walkspeed = Board[num - BOARD_WIDTH].walkspeed;
								Board[num].disapear = Board[num - BOARD_WIDTH].disapear;
								Board[num - BOARD_WIDTH].disapear = true;
							}
						}
					}
				}
			}
			game.rootScene.addEventListener(Event.TOUCH_START, function (e) {
				if ((e.localX >= BOARD_OFFSETX) && (e.localX < BOARD_OFFSETX + BOARD_WIDTH * CHIP_SIZE) && (e.localY >= BOARD_OFFSETY) && (e.localY < BOARD_OFFSETY + BOARD_HEIGHT * CHIP_SIZE))  {
					var touchX = e.localX;
        			var touchY = e.localY - TOUCH_OFFSETY;
					if (markmode === false) {
						var touchboardx = Math.floor((e.localX - BOARD_OFFSETX) / CHIP_SIZE);
						var touchboardy = Math.floor((e.localY - BOARD_OFFSETY) / CHIP_SIZE);
						var touchboardnum = touchboardy * BOARD_WIDTH + touchboardx;
						markmode = true;
						marked = Board[touchboardnum].chipnum;
						var markernum = Marker.length;
						Mark[markernum] = new Marker(touchboardx, touchboardy, 0, 0, markernum);
						Board[touchboardnum].marked = markernum;
					}
				}
			});
	    
			game.rootScene.addEventListener(Event.TOUCH_MOVE, function (e) {
				var touchX = e.localX;
				var touchY = e.localY - TOUCH_OFFSETY;
				if (markmode === true) {
					var touchboardx = Math.floor((touchX - BOARD_OFFSETX) / CHIP_SIZE);
					var touchboardy = Math.floor((touchY - BOARD_OFFSETY) / CHIP_SIZE);
					var touchboardnum = touchboardy * BOARD_WIDTH + touchboardx;
					if ((touchboardx >= 0) && (touchboardx < BOARD_WIDTH) && (touchboardy >= 0) && (touchboardy < BOARD_HEIGHT) && (distance(touchX, touchY, chips[touchboardnum].centerx, chips[touchboardnum].centery) < CHIP_SIZE / 2)) {
						if (Board[touchboardnum].marked === false) {
							var markernum = Mark.length;
							if ((Math.pow(Mark[markernum - 1].boardx - touchboardx, 2) <= 1) && (Math.pow(Mark[markernum - 1].boardy - touchboardy, 2) <= 1)) {
								if (Board[touchboardnum].chipnum == marked) {
									// 近隣かつ同種だった場合にマークを伸ばす
									Mark[markernum] = new Marker(touchboardx, touchboardy, Mark[markernum - 1].boardx, Mark[markernum - 1].boardy, markernum);
									Board[touchboardnum].marked = markernum;
								}
							}
						} else {
							markernum = Board[touchboardnum].marked;
							for (var i = Mark.length - 1; i > markernum; i--) {
								// 経路の途中に戻った場合、そこまでマークを戻す
								Board[Mark[i].boardnum].marked = false;
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
					if (Mark.length >=2) {
						deletemode = true;
						if (Mark.length == 2) {
							scoreup = -50;
						} else {
							scoreup = 100 + ((50 + 10 * (Mark.length - 4)) * (Mark.length - 3)); 
						}
						var popX = Mark[Mark.length - 1].boardx * CHIP_SIZE + BOARD_OFFSETX + 16;
						var popY = Mark[Mark.length - 1].boardy * CHIP_SIZE + BOARD_OFFSETY + 30;
						var popScores = new PopScore(popX, popY, scoreup);
						score += scoreup;
					}
					markmode = false;
					for(var i in Mark) {
						if (deletemode === true) {
							chips[Mark[i].boardnum].remove();
						}
						Board[Mark[i].boardnum].marked = false;
						Mark[i].remove();
					}
					Mark = [];
				}
			});
		});
    };
    game.fps = 15;
    game.start();
};