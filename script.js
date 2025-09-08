solonflowai, [08.09.2025 13:54]
// === КУДА ШЛЁМ ВЕБХУК ===
const WEBHOOK_URL = 'https://solonflowai.ru/webhook-test/roulette_prize';

// --- ПРИЗЫ (можно менять тексты/цвета) ---
const prizes = [
  { text: ["Прямой", "перевод", "300₽"], color: '#48dbfb' },
  { text: ["«Дичь от", "логиста»"], color: '#1dd1a1' },
  { text: ["«Сок", "благодарности»", "– 100 ₽"], color: '#ff6b6b' },
  { text: ["«Быстрая", "полка»"], color: '#feca57' },
];

// --- БАЗА ---
const canvas = document.getElementById('roulette');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');

const sectors = prizes.length;
const arc = (2 * Math.PI) / sectors;
const spinDuration = 6000;
let isSpinning = false;

// Telegram WebApp SDK
const tg = window.Telegram?.WebApp;
try { tg?.ready(); } catch {}

const user = tg?.initDataUnsafe?.user || null;
const tg_id = user?.id ?? null;           // id пользователя/чата
const username = user?.username ?? null;

// --- УТИЛИТА: отправка на сервер ---
async function postPrizeToServer(payload) {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // keepalive — чтобы запрос не обрывался при закрытии WebApp
      keepalive: true,
      mode: 'cors',
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, text: await res.text().catch(()=>'') };
  } catch (e) {
    console.error('Webhook error', e);
    return { ok: false, status: 0, text: String(e) };
  }
}

// --- ОТРИСОВКА ---
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

// --- КРУТКА ---
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
      const winningSectorIndex = Math.floor(winningAngle / arc) % sectors; // фикс граничного случая
      const prize = prizes[winningSectorIndex].text.join(' ');

      // Собираем данные и шлём на n8n
      const payload = {
        tg_id,                  // Telegram user/chat id
        username,
        prize,                  // текст приза
        ts: Date.now(),
        initData: tg?.

solonflowai, [08.09.2025 13:54]
initData || '' // строка для серверной валидации (опционально)
      };

      postPrizeToServer(payload)
        .then((res) => {
          try {
            tg?.showAlert?.(res.ok ? Отправил приз: ${prize} : `Не отправил (${res.status})`);
          } catch {}
        })
        .finally(() => {
          // (опц.) можно продублировать в бота через sendData
          try { tg?.sendData?.(prize); } catch {}
          setTimeout(() => { try { tg?.close(); } catch {} }, 1200);
        });
    }
  }

  requestAnimationFrame(animate);
}

drawRoulette();
drawPointer();
spinBtn.addEventListener('click', spin);
