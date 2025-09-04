// --- НАСТРОЙКА ПРИЗОВ ---
const prizes = [
    { text: '🧃 «Сок благодарности» – 100 ₽', color: '#ff6b6b' },
    { text: '🚛 «Быстрая полка»', color: '#feca57' },
    { text: '🪄 Прямой перевод 300₽', color: '#48dbfb' },
    { text: '🤡 «Дичь от логиста»', color: '#1dd1a1' }
];
// ------------------------

const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const sectors = prizes.length;
const arc = (2 * Math.PI) / sectors;
let currentAngle = 0;
let isSpinning = false;

function drawRoulette() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    for (let i = 0; i < sectors; i++) {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = prizes[i].color;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, canvas.width / 2, angle, angle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate((canvas.width / 2.5) * Math.cos(angle + arc / 2), (canvas.width / 2.5) * Math.sin(angle + arc / 2));
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.fillText(prizes[i].text, 0, 0);
        ctx.restore();
    }
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(-10, -canvas.height / 2 - 10);
    ctx.lineTo(10, -canvas.height / 2 - 10);
    ctx.lineTo(0, -canvas.height / 2 + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    const randomAngle = Math.random() * 2 * Math.PI + 10 * Math.PI;
    const startTime = performance.now();
    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / 5000, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const angle = currentAngle + easeOut * randomAngle;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawRoulette();
        ctx.restore();
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            currentAngle = angle % (2 * Math.PI);
            const winningSector = Math.floor(sectors - (currentAngle / arc)) % sectors;
            const prize = prizes[winningSector].text;
            Telegram.WebApp.sendData(prize);
            setTimeout(() => Telegram.WebApp.close(), 2000);
        }
    }
    requestAnimationFrame(animate);
}

Telegram.WebApp.ready();
drawRoulette();
spinBtn.addEventListener('click', spin);