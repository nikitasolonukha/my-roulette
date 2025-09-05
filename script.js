// --- НАСТРОЙКА ПРИЗОВ ---
// Текст разбит на строки для красивого отображения
const prizes = [
    { text: ["Прямой", "перевод", "300₽"], color: '#48dbfb' },
    { text: ["«Дичь от", "логиста»"], color: '#1dd1a1' },
    { text: ["«Сок", "благодарности»", "– 100 ₽"], color: '#ff6b6b' },
    { text: ["«Быстрая", "полка»"], color: '#feca57' },
];
// ------------------------

const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');

const sectors = prizes.length;
const arc = (2 * Math.PI) / sectors;
let currentAngle = 0;
let isSpinning = false;
const spinDuration = 5000; // 5 секунд

// Функция для отрисовки колеса
function drawRoulette() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    for (let i = 0; i < sectors; i++) {
        const angle = i * arc;
        // Рисуем сектор
        ctx.beginPath();
        ctx.fillStyle = prizes[i].color;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, canvas.width / 2 - 5, angle, angle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Рисуем текст в несколько строк
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textAngle = angle + arc / 2;
        ctx.rotate(textAngle);
        
        const textLines = prizes[i].text;
        for (let j = 0; j < textLines.length; j++) {
            // Смещаем каждую строку текста от центра
            ctx.fillText(textLines[j], canvas.width / 4, (j - (textLines.length - 1) / 2) * 20);
        }
        ctx.restore();
    }
    ctx.restore();
}

// Функция для отрисовки указателя (стрелки)
function drawPointer() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#ff3838'; // Яркий красный цвет для указателя
    ctx.beginPath();
    // Рисуем треугольник вверху
    ctx.moveTo(0, -canvas.height / 2 - 15);
    ctx.lineTo(15, -canvas.height / 2 + 5);
    ctx.lineTo(-15, -canvas.height / 2 + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// Функция вращения
function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    // Добавляем случайные обороты для интриги
    const randomSpins = Math.random() * 5 + 5; // от 5 до 10 полных оборотов
    const stopAngle = Math.random() * 2 * Math.PI;
    const totalAngle = randomSpins * 2 * Math.PI + stopAngle;
    
    let start = null;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const easeOut = 1 - Math.pow(1 - progress / spinDuration, 4);
        const angle = currentAngle + easeOut * totalAngle;

        // Отрисовка вращающегося колеса
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawRoulette();
        ctx.restore();
        
        // Поверх колеса рисуем статичный указатель
        drawPointer();

        if (progress < spinDuration) {
            requestAnimationFrame(animate);
        } else {
            currentAngle = angle % (2 * Math.PI);
            const winningSectorIndex = Math.floor(sectors - (currentAngle / arc)) % sectors;
            const prize = prizes[winningSectorIndex].text.join(' ');
            
            // Отправляем данные о выигрыше обратно в n8n
            Telegram.WebApp.sendData(prize);
            // Закрываем приложение через 2 секунды
            setTimeout(() => Telegram.WebApp.close(), 2000);
        }
    }
    requestAnimationFrame(animate);
}

// Инициализация
Telegram.WebApp.ready();
// Сначала рисуем статичное колесо и указатель
drawRoulette();
drawPointer();
spinBtn.addEventListener('click', spin);
