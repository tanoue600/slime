class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 10; this.vy = (Math.random() - 0.5) * 10;
        this.color = color; this.life = 1.0;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.03; }
    draw() { ctx.save(); ctx.globalAlpha = this.life; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill(); ctx.restore(); }
}