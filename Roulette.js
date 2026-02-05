class Roulette {
    constructor(upgrades) {
        this.container = document.getElementById('roulette-container');
        this.strip = document.getElementById('roulette-strip');
        this.upgrades = upgrades;
        this.isSpinning = false;
        this.itemWidth = 100; // CSSの.roulette-itemの幅と合わせる
    }

    start() {
        if (this.isSpinning) return;
        this.isSpinning = true;

        // 1. UIを表示し、中身をリセット
        this.container.classList.add('show');
        this.strip.style.transition = "none";
        this.strip.style.left = "0px";
        this.strip.innerHTML = "";

        // 2. 演出用にランダムなアイテムを大量に並べる
        const displayItems = [];
        const totalItems = 40;
        for (let i = 0; i < totalItems; i++) {
            displayItems.push(this.upgrades[Math.floor(Math.random() * this.upgrades.length)]);
        }

        displayItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'roulette-item';
            div.innerText = item.label;
            this.strip.appendChild(div);
        });

        // 3. 停止位置を計算（25番目のアイテムを中央にする）
        const resultIndex = 25;
        const containerWidth = 300; // CSSのwidth
        const stopPos = -(resultIndex * this.itemWidth) + (containerWidth / 2 - this.itemWidth / 2);

        // 4. 回転開始
        setTimeout(() => {
            this.strip.style.transition = "left 3s cubic-bezier(0.1, 0, 0.1, 1)";
            this.strip.style.left = stopPos + "px";
        }, 50);

        // 5. 停止後の処理
        setTimeout(() => {
            const result = displayItems[resultIndex];
            result.action(); // 強化実行

            // 3秒後に隠す
            setTimeout(() => {
                this.container.classList.remove('show');
                this.isSpinning = false;
            }, 3000);
        }, 3500);
    }
}