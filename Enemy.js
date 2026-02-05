class Enemy {
    constructor(canvasWidth, canvasHeight) {
        this.radius = 35; 
        this.x = Math.random() < 0.5 ? -50 : canvasWidth + 50; 
        this.y = Math.random() * canvasHeight;
        this.hp = Math.floor(Math.random() * 21) + 40; 
        this.color = '#c0392b';
        this.shootTimer = Math.random() * 60;
    }
    update(slimes) {
        let nearestSlime = null;
        let minDist = Infinity;
        slimes.forEach(s => {
            const d = Math.hypot(s.x - this.x, s.y - this.y);
            if (d < minDist) { minDist = d; nearestSlime = s; }
        });
        if (nearestSlime) {
            const angle = Math.atan2(nearestSlime.y - this.y, nearestSlime.x - this.x);
            this.x += Math.cos(angle) * 1.2;
            this.y += Math.sin(angle) * 1.2;
            return angle; // 弾を撃つ方向を返す
        }
        return null;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HP:${Math.ceil(this.hp)}`, this.x, this.y + 5);
    }
}