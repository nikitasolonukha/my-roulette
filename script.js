// --- НАСТРОЙКА ПРИЗОВ ---
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
let isSpinning = false;
const spinDuration = 6000;

function drawRoulette() {
  for (let i = 0; i < sectors; i++) {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = prizes[i].color;
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 5, angle, angle + arc);
    ctx.lineTo(canvas.width / 2, canvas.height / 2);
    ctx.fill();

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle + arc / 2);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    const lines = prizes[i].text;
    for (let j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], canvas.width / 4, (j - (lines.length - 1) / 2) * 20);
    }
    ctx.restore();
  }
}

function drawPointer() {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#ff3838';
  ctx.beginPath();
  const pointerSize = 25;
  const offset = 10;
  ctx.moveTo(canvas.width / 2 - offset, 0);
  ctx.lineTo(canvas.width / 2 - offset - pointerSize, pointerSize / 2);
  ctx.lineTo(canvas.width / 2 - offset - pointerSize, -pointerSize / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;

  const randomSpins = Math.random() * 5 + 8;
  const stopAngle = Math.random() * 2 * Math.PI;
  const totalAngle = randomSpins * 2 * Math.PI + stopAngle;
  let start = null;

  function animate(ts) {
    if (!start) start = ts;
    const progress = ts - start;
    const easeOut = Math.min(1, 1 - Math.pow(1 - progress / spinDuration, 4));
    const angle = easeOut * totalAngle;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    drawRoulette();
    ctx.restore();
    drawPointer();

    if (progress < spinDuration) {
      requestAnimationFrame(animate);
    } else {
      const currentAngle = angle % (2 * Math.PI);
      const winningAngle = (2 * Math.PI - currentAngle) % (2 * Math.PI);
      const winningSectorIndex = Math.floor(winningAngle / arc) % sectors;
      const prize = prizes[winningSectorIndex].text.join(' ');

      try { Telegram?.WebApp?.sendData?.(prize); }
      catch (e) {
        console.error('sendData error', e);
        alert(`Ваш приз: ${prize}\n(Внимание: запустите мини-аппу именно через кнопку web_app в боте)`);
      }

      setTimeout(() => {
        try { Telegram.WebApp.close(); } catch {}
      }, 400);
    }
  }

  requestAnimationFrame(animate);
}

try { Telegram.WebApp.ready(); } catch {}

drawRoulette();
drawPointer();
spinBtn.addEventListener('click', spin);
