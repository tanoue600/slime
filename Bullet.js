// Bullet.js
class Bullet {
    constructor(x, y, angle, power, color, owner = null) {
        this.x = x; this.y = y;
        this.vx = Math.cos(angle) * 10;
        this.vy = Math.sin(angle) * 10;
        this.radius = 6;
        this.power = power; 
        this.color = color;
        this.owner = owner; 
        this.life = 120;    
    }
    update(canvas) { 
        this.x += this.vx; 
        this.y += this.vy; 
        this.life--; 
        // 画面外に出たら即消去してメモリ節約
        if (this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) {
            this.life = 0;
        }
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        // 影(shadowBlur)は削除。代わりに色を明るくして視認性を確保
    }
}