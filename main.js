const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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

// パーティクル生成（負荷軽減のため生成数を少し抑える調整が可能）
function createSplash(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameTick++;

    // 1. パーティクル管理（最大数を制限してメモリと描画負荷を抑える）
    if (particles.length > 100) particles.splice(0, particles.length - 100);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(ctx); });

    // 2. 敵の更新と描画
    enemies.forEach(enemy => {
        const shootAngle = enemy.update(slimes);
        enemy.draw(ctx);
        enemy.shootTimer++;
        // 敵の射撃ロジック
        if (enemy.shootTimer > 80 && shootAngle !== null) {
            enemyBullets.push(new Bullet(enemy.x, enemy.y, shootAngle, 5, '#ffffff'));
            enemy.shootTimer = 0;
        }
    });

    // 3. スライムの更新と描画
    slimes.forEach((slime, sIndex) => {
        slime.update(isAttracting, mouseX, mouseY, canvas);
        slime.draw(ctx, gameTick);
        
        // スライムの自動射撃（最も近い敵を探索）
        slime.shootTimer++;
        if (slime.shootTimer > 25) {
            let minShotDistSq = 360000; // 600pxの二乗
            let target = null;
            enemies.forEach(e => {
                const dx = e.x - slime.x;
                const dy = e.y - slime.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < minShotDistSq) {
                    minShotDistSq = dSq;
                    target = e;
                }
            });
            if (target) {
                const angle = Math.atan2(target.y - slime.y, target.x - slime.x);
                bullets.push(new Bullet(slime.x, slime.y, angle, 2, '#f1c40f', slime)); 
                slime.shootTimer = 0;
            }
        }

        // スライムと敵の体当たり判定（二乗計算）
        enemies.forEach((enemy, eIndex) => {
            const dx = slime.x - enemy.x;
            const dy = slime.y - enemy.y;
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

    // 4. スライムの弾の衝突判定（最適化版）
    bullets = bullets.filter(b => b.life > 0);
    bullets.forEach(b => {
        b.update(canvas);
        b.draw(ctx);
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            const distSq = dx * dx + dy * dy;
            const rSum = b.radius + e.radius;
            if (distSq < rSum * rSum) {
                e.hp -= b.power;
                b.life = 0;
                createSplash(b.x, b.y, '#f1c40f', 2);
                if (e.hp <= 0) {
                    if (b.owner) b.owner.power += 4;
                    score += 50; scoreElement.innerText = score;
                    createSplash(e.x, e.y, '#e74c3c', 12);
                    enemies.splice(i, 1);
                    i--;
                }
                break; // 1つの弾は1体にのみ当たる
            }
        }
    });

    // 5. 敵の弾の衝突判定（二乗計算）
    enemyBullets = enemyBullets.filter(eb => eb.life > 0);
    enemyBullets.forEach(eb => {
        eb.update(canvas);
        eb.draw(ctx);
        slimes.forEach(slime => {
            const dx = eb.x - slime.x;
            const dy = eb.y - slime.y;
            const distSq = dx * dx + dy * dy;
            const rSum = eb.radius + 20;
            if (distSq < rSum * rSum) {
                slime.power -= eb.power;
                eb.life = 0;
                createSplash(slime.x, slime.y, '#ffffff', 5);
                const angle = Math.atan2(dy, dx);
                slime.vx += Math.cos(angle) * 8;
                slime.vy += Math.sin(angle) * 8;
            }
        });
    });

    // 6. 右クリック合体処理（二乗計算で判定）
    if (isAttracting && slimes.length > 1) {
        const allNear = slimes.every(s => {
            const dx = mouseX - s.x;
            const dy = mouseY - s.y;
            return (dx * dx + dy * dy) < 900; // 30pxの二乗
        });
        if (allNear) {
            let totalPower = slimes.reduce((acc, s) => acc + s.power, 0);
            createSplash(mouseX, mouseY, '#ffffff', 20);
            slimes = [new Slime(mouseX, mouseY, 40, 0, 0, totalPower)];
            isAttracting = false;
        }
    }

    requestAnimationFrame(animate);
}

// 初期化
slimes.push(new Slime(canvas.width / 2, canvas.height / 2, 40, 0, 0, 16));
setInterval(() => { 
    if (enemies.length < 5) enemies.push(new Enemy(canvas.width, canvas.height)); 
}, 4000);

// イベントリスナー
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 左クリックで分裂
        const newSlimes = [];
        slimes.forEach(slime => {
            if (slime.power >= 2) {
                const angle = Math.atan2(e.clientY - slime.y, e.clientX - slime.x);
                const speed = 18;
                const newPower = slime.power / 2;
                newSlimes.push(new Slime(slime.x + Math.cos(angle) * 30, slime.y + Math.sin(angle) * 30, 30, Math.cos(angle) * speed, Math.sin(angle) * speed, newPower));
                newSlimes.push(new Slime(slime.x - Math.cos(angle) * 30, slime.y - Math.sin(angle) * 30, 30, -Math.cos(angle) * speed, -Math.sin(angle) * speed, newPower));
            } else {
                newSlimes.push(slime);
            }
        });
        if (newSlimes.length > 0) slimes = newSlimes;
    } else if (e.button === 2) { 
        isAttracting = true; 
    }
});
window.addEventListener('mouseup', (e) => { if (e.button === 2) isAttracting = false; });
window.addEventListener('contextmenu', (e) => e.preventDefault());

animate();