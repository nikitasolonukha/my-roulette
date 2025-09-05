// --- НАСТРОЙКА ПРИЗОВ ---
const prizes = [
    { text: ["Прямой", "перевод", "300₽"], color: '#48dbfb' }, // Голубой
    { text: ["«Дичь от", "логиста»"], color: '#1dd1a1' },     // Зеленый
    { text: ["«Сок", "благодарности»", "– 100 ₽"], color: '#ff6b6b' }, // Красный
    { text: ["«Быстрая", "полка»"], color: '#feca57' },     // Желтый
];
// ------------------------

const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');

const sectors = prizes.length;
const arc = (2 * Math.PI) / sectors;
let currentAngle = 0;
let isSpinning = false;
const spinDuration = 6000; // 6 секунд для более плавной остановки

// Функция для отрисовки статичной части колеса
function drawRoulette() {
    for (let i = 0; i < sectors; i++) {
        const angle = i * arc;
        // Рисуем сектор
        ctx.beginPath();
        ctx.fillStyle = prizes[i].color;
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 5, angle, angle + arc);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.fill();

        // --- НОВАЯ ЛОГИКА ОТРИСОВКИ ТЕКСТА ---
        ctx.save();
        // Перемещаем "карандаш" в центр колеса
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Поворачиваем холст к середине сектора
        ctx.rotate(angle + arc / 2);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center'; // Текст будет центрирован относительно точки отрисовки

        const textLines = prizes[i].text;
        for (let j = 0; j < textLines.length; j++) {
            // Рисуем каждую строку текста на определенном расстоянии от центра
            // и со смещением друг от друга для многострочности
            ctx.fillText(textLines[j], canvas.width / 4, (j - (textLines.length - 1) / 2) * 20);
        }
        ctx.restore(); // Возвращаем холст в исходное состояние для следующего сектора
    }
}

// Функция для отрисовки указателя (стрелки)
function drawPointer() {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#ff3838'; // Яркий красный цвет
    ctx.beginPath();
    ctx.moveTo(0, -canvas.height / 2 + 5);
    ctx.lineTo(15, -canvas.height / 2 - 15);
    ctx.lineTo(-15, -canvas.height / 2 - 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// Функция вращения
function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    const randomSpins = Math.random() * 5 + 8; // от 8 до 13 оборотов
    const stopAngle = Math.random() * 2 * Math.PI;
    const totalAngle = randomSpins * 2 * Math.PI + stopAngle;
    
    let start = null;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const easeOut = 1 - Math.pow(1 - progress / spinDuration, 4); // Плавная остановка
        const angle = easeOut * totalAngle;

        // Очищаем и перерисовываем
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Вращаем контекст, рисуем колесо, возвращаем контекст
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawRoulette();
        ctx.restore();
        
        // Поверх всего рисуем статичный указатель
        drawPointer();

        if (progress < spinDuration) {
            requestAnimationFrame(animate);
        } else {
            currentAngle = angle % (2 * Math.PI);
            const winningAngle = (2 * Math.PI - currentAngle) % (2 * Math.PI);
            const winningSectorIndex = Math.floor(winningAngle / arc);
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
