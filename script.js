// --- НАСТРОЙКА ПРИЗОВ ---
// Теперь текст можно разбивать на строки для красивого отображения
// И настроить его положение (x, y) относительно центра сектора
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
const rouletteContainer = document.querySelector('.roulette-container'); // Для вращения всего контейнера

const sectors = prizes.length;
const arc = (2 * Math.PI) / sectors;
let currentRotation = 0; // Для отслеживания текущего поворота контейнера
let isSpinning = false;
const spinDuration = 5000; // 5 секунд

// Функция для отрисовки колеса
function drawRoulette() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < sectors; i++) {
        const angle = i * arc;
        // Рисуем сектор
        ctx.beginPath();
        ctx.fillStyle = prizes[i].color;
        ctx.moveTo(canvas.width / 2, canvas.height / 2); // Центр
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 5, angle, angle + arc);
        ctx.lineTo(canvas.width / 2, canvas.height / 2); // Обратно к центру
        ctx.fill();

        // Рисуем текст всегда горизонтально
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Вычисляем середину сектора для размещения текста
        const textRadius = canvas.width / 2 * 0.65; // Подальше от центра, поближе к краю
        const textX = canvas.width / 2 + textRadius * Math.cos(angle + arc / 2);
        const textY = canvas.height / 2 + textRadius * Math.sin(angle + arc / 2);

        const textLines = prizes[i].text;
        for (let j = 0; j < textLines.length; j++) {
            // Размещаем строки текста вертикально
            ctx.fillText(textLines[j], textX, textY + (j - (textLines.length - 1) / 2) * 20);
        }
        ctx.restore();
    }
}


// Функция вращения
function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    // Добавляем случайные обороты для интриги
    const randomSpins = Math.random() * 5 + 5; // от 5 до 10 полных оборотов
    const stopAngleRad = Math.random() * 2 * Math.PI; // Угол остановки в радианах
    const totalSpinRad = randomSpins * 2 * Math.PI + stopAngleRad;
    
    // Преобразуем углы в градусы для CSS transform
    const currentAngleDeg = (currentRotation * 180 / Math.PI) % 360;
    const totalSpinDeg = (totalSpinRad * 180 / Math.PI);
    const finalAngleDeg = currentAngleDeg + totalSpinDeg;

    rouletteContainer.style.transition = `transform ${spinDuration / 1000}s ease-out`;
    rouletteContainer.style.transform = `rotate(${finalAngleDeg}deg)`;

    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        currentRotation = (finalAngleDeg * Math.PI / 180) % (2 * Math.PI); // Обновляем текущий угол для следующего спина

        // Определяем выигрышный сектор
        // Указатель находится сверху, т.е. 90 градусов или Math.PI/2 от центра в верх
        // Колесо вращается по часовой стрелке, сектора отсчитываются против часовой
        // Нужно найти, какой сектор находится под указателем (сверху) после остановки
        
        // Нормализуем текущий угол, чтобы он был положительным и до 2*PI
        let normalizedCurrentAngle = currentRotation;
        if (normalizedCurrentAngle < 0) {
            normalizedCurrentAngle += (2 * Math.PI);
        }

        // Вычисляем угол, на который указывает стрелка
        // Стрелка смотрит на 0 градусов (вверх). Сектора нумеруются от 0 по часовой.
        // Поэтому нужно от 2*PI вычесть текущий угол и поделить на arc, чтобы получить индекс.
        // Добавляем Math.PI / 2, чтобы учесть поворот колеса относительно указателя (указатель сверху)
        const winningSectorAngleFromTop = (2 * Math.PI - normalizedCurrentAngle + (Math.PI / 2) + arc / 2) % (2 * Math.PI);
        const winningSectorIndex = Math.floor(winningSectorAngleFromTop / arc) % sectors;


        const prize = prizes[winningSectorIndex].text.join(' ');
        
        // Отправляем данные о выигрыше обратно в n8n
        Telegram.WebApp.sendData(prize);
        // Закрываем приложение через 2 секунды
        setTimeout(() => Telegram.WebApp.close(), 2000);

    }, spinDuration);
}

// Инициализация
Telegram.WebApp.ready();
drawRoulette(); // Рисуем колесо статично
spinBtn.addEventListener('click', spin);
