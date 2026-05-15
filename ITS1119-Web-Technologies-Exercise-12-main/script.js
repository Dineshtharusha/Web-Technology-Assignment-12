$(document).ready(function() {
    const $gameArea = $('#game-area');
    const $scoreVal = $('#score-val');
    const $startScreen = $('#start-screen');
    const $gameOverScreen = $('#game-over-screen');
    const $playBtn = $('#play-btn');
    const $restartBtn = $('#restart-btn');
    const $finalScore = $('#final-score');
    const $highScore = $('#high-score');

    let gameLoop;
    let isPlaying = false;
    let score = 0;
    let highScore = localStorage.getItem('trafficRacerHighScore') || 0;
    let level = 1;
    let keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
    
    function GameObject(width, height, x, y, className) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.$element = $('<div>').addClass(className).css({
            width: this.width + 'px',
            height: this.height + 'px',
            left: this.x + 'px',
            top: this.y + 'px'
        });
        $gameArea.append(this.$element);
    }
    
    GameObject.prototype.updatePosition = function() {
        this.$element.css({
            left: this.x + 'px',
            top: this.y + 'px'
        });
    };
    
    GameObject.prototype.destroy = function() {
        this.$element.remove();
    };

    function Car(width, height, x, y, className, speed) {
        GameObject.call(this, width, height, x, y, className);
        this.speed = speed;
    }
    Car.prototype = Object.create(GameObject.prototype);
    Car.prototype.constructor = Car;

    function Player(x, y) {
        Car.call(this, 50, 100, x, y, 'car player-car', 6);
    }
    Player.prototype = Object.create(Car.prototype);
    Player.prototype.constructor = Player;
    
    Player.prototype.move = function() {
        if (keys.ArrowLeft && this.x > 15) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight && this.x < ($gameArea.width() - this.width - 15)) {
            this.x += this.speed;
        }
        if (keys.ArrowUp && this.y > 0) {
            this.y -= this.speed;
        }
        if (keys.ArrowDown && this.y < ($gameArea.height() - this.height - 10)) {
            this.y += this.speed;
        }
        this.updatePosition();
    };

    function Enemy(speed) {
        let randomX = Math.floor(Math.random() * ($gameArea.width() - 50 - 30)) + 15;
        Car.call(this, 50, 100, randomX, -150, 'car enemy-car', speed);
    }
    Enemy.prototype = Object.create(Car.prototype);
    Enemy.prototype.constructor = Enemy;
    
    Enemy.prototype.moveDown = function() {
        this.y += this.speed;
        this.updatePosition();
    };

    let player;
    let enemies = [];
    let baseEnemySpeed = 4;
    let roadSpeed = 1.0;
    let frames = 0;

    function initGame() {
        $gameArea.find('.car').remove();
        score = 0;
        level = 1;
        baseEnemySpeed = 4;
        roadSpeed = 1.0;
        frames = 0;
        $scoreVal.text(score);
        enemies = [];
        
        player = new Player(175, $gameArea.height() - 130);
        
        $startScreen.addClass('hidden');
        $gameOverScreen.addClass('hidden');
        $gameArea.addClass('moving-road');
        updateRoadAnimationSpeed();
        
        isPlaying = true;
        gameLoop = requestAnimationFrame(updateGame);
    }

    function updateRoadAnimationSpeed() {
        $('.moving-road .road-border, .moving-road .road-line-center').css('animation-duration', roadSpeed + 's');
    }

    function updateGame() {
        if (!isPlaying) return;

        player.move();

        if (score > 1500 && level === 1) { levelUp(2); }
        else if (score > 3500 && level === 2) { levelUp(3); }
        else if (score > 6000 && level === 3) { levelUp(4); }
        else if (score > 10000 && level === 4) { levelUp(5); }

        frames++;
        let spawnRate = Math.max(25, 70 - (level * 10));
        
        if (frames % spawnRate === 0) {
            let speedVariance = Math.random() * 2;
            enemies.push(new Enemy(baseEnemySpeed + speedVariance));
        }

        for (let i = 0; i < enemies.length; i++) {
            enemies[i].moveDown();
            
            if (isCollide(player.$element[0], enemies[i].$element[0])) {
                gameOver();
                return;
            }

            if (enemies[i].y > $gameArea.height()) {
                enemies[i].destroy();
                enemies.splice(i, 1);
                i--;
                score += 100;
            }
        }

        score++;
        $scoreVal.text(score);
        
        gameLoop = requestAnimationFrame(updateGame);
    }

    function levelUp(newLevel) {
        level = newLevel;
        baseEnemySpeed += 1.5;
        roadSpeed = Math.max(0.3, roadSpeed - 0.2);
        updateRoadAnimationSpeed();
    }
    function isCollide(a, b) {
        let aRect = a.getBoundingClientRect();
        let bRect = b.getBoundingClientRect();

        return !(
            (aRect.top + 15 > bRect.bottom - 5) ||
            (aRect.bottom - 15 < bRect.top + 5) ||
            (aRect.right - 10 < bRect.left + 10) ||
            (aRect.left + 10 > bRect.right - 10)
        );
    }

    function gameOver() {
        isPlaying = false;
        cancelAnimationFrame(gameLoop);
        $gameArea.removeClass('moving-road');
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('trafficRacerHighScore', highScore);
        }
        
        $finalScore.text(score);
        $highScore.text(highScore);
        $gameOverScreen.removeClass('hidden');
    }

    $(document).keydown(function(e) {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
            e.preventDefault();
        }
    });

    $(document).keyup(function(e) {
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
            e.preventDefault();
        }
    });

    $playBtn.click(initGame);
    $restartBtn.click(initGame);
});