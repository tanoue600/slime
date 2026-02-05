const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');

// UI要素
const gameOverPanel = document.getElementById('game-over-panel');
const finalScoreElement = document.getElementById('final-score');
const finalTimeElement = document.getElementById('final-time');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- ゲーム状態管理 ---
let score = 0;
let slimes = [];
let enemies = [];
let particles = []; 
let bullets = [];      
let enemyBullets = []; 
let isAttracting = false;
let mouseX = 0;
let mouseY = 0;
let gameTick = 0;
let startTime = Date.now();
let isGameOver = false;
let lastRouletteMinute = 0;
let lastRouletteCount = 0; // ルーレット専用のカウンター（新設）

// --- 敵の基本ステータス ---
let enemyBaseSpeed = 1.2;
let enemyBaseHp = 40;
let enemyBulletPower = 5;
let enemyBulletSpeed = 8;
let spawnRate = 4000; 
let spawnInterval;    

// --- ルーレットの初期化 ---
const roulette = new Roulette([
    { label: "SPEED UP", action: () => { enemyBaseSpeed += 0.4; } },
    { label: "HP UP", action: () => { enemyBaseHp += 15; } },
    { label: "ATK UP", action: () => { enemyBulletPower += 2; } },
    { label: "SPAWN UP", action: () => { spawnRate *= 0.8; resetSpawnInterval(); } },
    { label: "BULLET SPD", action: () => { enemyBulletSpeed += 2; } }
]);

function createSplash(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function resetSpawnInterval() {
    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = setInterval(() => { 
        if (isGameOver) { clearInterval(spawnInterval); return; }
        if (enemies.length < 10) {
             enemies.push(new Enemy(canvas.width, canvas.height, enemyBaseHp, enemyBaseSpeed)); 
        }
    }, spawnRate);
}

function updateTimer() {
    if (isGameOver) return;

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // 1. ルーレットの判定 (30秒ごとに独立してカウント)
    const currentRouletteInterval = Math.floor(elapsedSeconds / 30);
    if (currentRouletteInterval > lastRouletteCount) {
        lastRouletteCount = currentRouletteInterval;
        roulette.start();
    }

    // 2. 画面表示用の計算 (ルーレットとは関係なく正しく分・秒を出す)
    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
    
    // 画面中央のタイマーを更新
    timerElement.innerText = `${mins}:${secs}`;
}


function endGame() {
    isGameOver = true;
    finalScoreElement.innerText = score;
    finalTimeElement.innerText = timerElement.innerText;
    if (gameOverPanel) gameOverPanel.style.display = 'block';
    if (spawnInterval) clearInterval(spawnInterval);
}

function animate() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameTick++;
    updateTimer();

    // 1. パーティクル
    if (particles.length > 100) particles.splice(0, particles.length - 100);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(ctx); });

    // 2. 敵
    enemies.forEach(enemy => {
        const shootAngle = enemy.update(slimes);
        enemy.draw(ctx);
        enemy.shootTimer++;
        if (enemy.shootTimer > 80 && shootAngle !== null) {
            const b = new Bullet(enemy.x, enemy.y, shootAngle, enemyBulletPower, '#ffffff');
            b.vx = Math.cos(shootAngle) * enemyBulletSpeed;
            b.vy = Math.sin(shootAngle) * enemyBulletSpeed;
            enemyBullets.push(b);
            enemy.shootTimer = 0;
        }
    });

    // 3. スライム
    if (slimes.length === 0) endGame();

    slimes.forEach((slime, sIndex) => {
        slime.update(isAttracting, mouseX, mouseY, canvas);
        slime.draw(ctx, gameTick);
        
        slime.shootTimer++;
        if (slime.shootTimer > 25) {
            let minShotDistSq = 360000;
            let target = null;
            enemies.forEach(e => {
                const dx = e.x - slime.x; const dy = e.y - slime.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < minShotDistSq) { minShotDistSq = dSq; target = e; }
            });
            if (target) {
                const angle = Math.atan2(target.y - slime.y, target.x - slime.x);
                bullets.push(new Bullet(slime.x, slime.y, angle, 2, '#f1c40f', slime)); 
                slime.shootTimer = 0;
            }
        }

        enemies.forEach((enemy, eIndex) => {
            const dx = slime.x - enemy.x; const dy = slime.y - enemy.y;
            const distSq = dx * dx + dy * dy;
            const rSum = 30 + enemy.radius;
            if (distSq < rSum * rSum) {
                slime.power -= 2; enemy.hp -= 2;
                const bounceAngle = Math.atan2(dy, dx);
                slime.vx = Math.cos(bounceAngle) * 15;
                slime.vy = Math.sin(bounceAngle) * 15;
                if (enemy.hp <= 0) {
                    enemies.splice(eIndex, 1);
                    slime.power += 4;
                    score += 50; scoreElement.innerText = score;
                    createSplash(enemy.x, enemy.y, '#e74c3c', 10);
                }
            }
        });

        if (slime.power <= 0) {
            createSplash(slime.x, slime.y, '#2ecc71', 15);
            slimes.splice(sIndex, 1);
        }
    });

    // 4. スライム弾
    bullets = bullets.filter(b => b.life > 0);
    bullets.forEach(b => {
        b.update(canvas); b.draw(ctx);
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = b.x - e.x; const dy = b.y - e.y;
            if ((dx*dx + dy*dy) < (b.radius + e.radius)**2) {
                e.hp -= b.power; b.life = 0;
                createSplash(b.x, b.y, '#f1c40f', 2);
                if (e.hp <= 0) {
                    if (b.owner) b.owner.power += 4;
                    score += 50; scoreElement.innerText = score;
                    createSplash(e.x, e.y, '#e74c3c', 12);
                    enemies.splice(i, 1); i--;
                }
                break;
            }
        }
    });

    // 5. 敵弾
    enemyBullets = enemyBullets.filter(eb => eb.life > 0);
    enemyBullets.forEach(eb => {
        eb.update(canvas); eb.draw(ctx);
        slimes.forEach(slime => {
            const dx = eb.x - slime.x; const dy = eb.y - slime.y;
            if ((dx*dx + dy*dy) < (eb.radius + 20)**2) {
                slime.power -= eb.power; eb.life = 0;
                createSplash(slime.x, slime.y, '#ffffff', 5);
                const angle = Math.atan2(dy, dx);
                slime.vx += Math.cos(angle) * 8; slime.vy += Math.sin(angle) * 8;
            }
        });
    });

    // 6. 合体
    if (isAttracting && slimes.length > 1) {
        const allNear = slimes.every(s => ((mouseX - s.x)**2 + (mouseY - s.y)**2) < 900);
        if (allNear) {
            let totalPower = slimes.reduce((acc, s) => acc + s.power, 0);
            createSplash(mouseX, mouseY, '#ffffff', 20);
            slimes = [new Slime(mouseX, mouseY, 40, 0, 0, totalPower)];
            isAttracting = false;
        }
    }

    requestAnimationFrame(animate);
}

// 初期実行
slimes.push(new Slime(canvas.width / 2, canvas.height / 2, 40, 0, 0, 16));
resetSpawnInterval();

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('mousedown', (e) => {
    if (isGameOver) return;
    if (e.button === 0) {
        const newSlimes = [];
        slimes.forEach(slime => {
            if (slime.power >= 2) {
                const angle = Math.atan2(e.clientY - slime.y, e.clientX - slime.x);
                const speed = 18; const newPower = slime.power / 2;
                newSlimes.push(new Slime(slime.x + Math.cos(angle)*30, slime.y + Math.sin(angle)*30, 30, Math.cos(angle)*speed, Math.sin(angle)*speed, newPower));
                newSlimes.push(new Slime(slime.x - Math.cos(angle)*30, slime.y - Math.sin(angle)*30, 30, -Math.cos(angle)*speed, -Math.sin(angle)*speed, newPower));
            } else { newSlimes.push(slime); }
        });
        if (newSlimes.length > 0) slimes = newSlimes;
    } else if (e.button === 2) { isAttracting = true; }
});
window.addEventListener('mouseup', (e) => { if (e.button === 2) isAttracting = false; });
window.addEventListener('contextmenu', (e) => e.preventDefault());

animate();