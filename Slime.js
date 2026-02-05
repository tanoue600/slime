class Slime {
    constructor(x, y, radius, vx, vy, power) {
        this.x = x; this.y = y;
        this.baseRadius = radius;
        this.vx = vx; this.vy = vy;
        this.power = power;
        this.color = '#2ecc71';
        this.shootTimer = 0; 
    }
    draw(ctx, gameTick) {
        const speed = Math.hypot(this.vx, this.vy);
        const angle = Math.atan2(this.vy, this.vx);
        const stretch = Math.min(1 + speed / 30, 1.5);
        const shrink = 1 / stretch;
        ctx.save();
        ctx.translate(this.x, this.y);
        if (speed > 0.1) ctx.rotate(angle);
        const currentRadius = Math.max(this.baseRadius * (0.5 + Math.min(this.power, 100) / 50), 10);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
        gradient.addColorStop(0, '#a2f3c1');
        gradient.addColorStop(1, this.color);
        ctx.beginPath();
        ctx.ellipse(0, 0, currentRadius * stretch, currentRadius * shrink, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(currentRadius * 0.5, 12)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(this.power), this.x, this.y);
    }
    update(isAttracting, mouseX, mouseY, canvas) {
        if (isAttracting) {
            const angle = Math.atan2(mouseY - this.y, mouseX - this.x);
            const dist = Math.hypot(mouseX - this.x, mouseY - this.y);
            if (dist > 5) {
                this.vx += Math.cos(angle) * 2.0;
                this.vy += Math.sin(angle) * 2.0;
            } else {
                this.vx *= 0.5; this.vy *= 0.5;
            }
        }
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.95; this.vy *= 0.95;
        if (this.x < 20 || this.x > canvas.width - 20) this.vx *= -1.2;
        if (this.y < 20 || this.y > canvas.height - 20) this.vy *= -1.2;
    }
}