// === URL твоего n8n-вебхука ===
var WEBHOOK_URL = 'https://solonflowai.ru/webhook-test/roulette_prize';

// Поймаем ошибки, чтобы сразу видеть причину
window.onerror = function (msg) {
  try {
    var tgw = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
    if (tgw && tgw.showAlert) tgw.showAlert('JS error: ' + msg);
  } catch (_) {}
  alert('JS error: ' + msg);
};

document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('roulette');
  var ctx = canvas.getContext('2d');
  var spinBtn = document.getElementById('spin-btn');

  // Telegram SDK
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  try { if (tg && tg.ready) tg.ready(); } catch (e) {}

  var user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : null;
  var tg_id = user ? user.id : null;
  var username = user ? user.username : null;

  // Призы
  var prizes = [
    { text: ["Прямой", "перевод", "300₽"], color: '#48dbfb' },
    { text: ["«Дичь от", "логиста»"], color: '#1dd1a1' },
    { text: ["«Сок", "благодарности»", "– 100 ₽"], color: '#ff6b6b' },
    { text: ["«Быстрая", "полка»"], color: '#feca57' }
  ];

  var sectors = prizes.length;
  var arc = (2 * Math.PI) / sectors;
  var spinDuration = 6000;
  var isSpinning = false;

  function drawRoulette() {
    // Очистили и нарисовали сегменты
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < sectors; i++) {
      var angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = prizes[i].color;
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 5, angle, angle + arc);
      ctx.lineTo(canvas.width / 2, canvas.height / 2);
      ctx.fill();

      // Текст
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      var lines = prizes[i].text;
      for (var j = 0; j < lines.length; j++) {
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
    var pointerSize = 25;
    var offset = 10;
    ctx.moveTo(canvas.width / 2 - offset, 0);
    ctx.lineTo(canvas.width / 2 - offset - pointerSize, pointerSize / 2);
    ctx.lineTo(canvas.width / 2 - offset - pointerSize, -pointerSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function postPrize(payload) {
    return fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      mode: 'cors',
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.text().then(function (t) { return { ok: res.ok, status: res.status, text: t }; });
    }).catch(function (e) {
      return { ok: false, status: 0, text: String(e) };
    });
  }

  function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    var randomSpins = Math.random() * 5 + 8;
    var stopAngle = Math.random() * 2 * Math.PI;
    var totalAngle = randomSpins * 2 * Math.PI + stopAngle;
    var start = null;

    function animate(ts) {
      if (!start) start = ts;
      var progress = ts - start;
      var easeOut = Math.min(1, 1 - Math.pow(1 - progress / spinDuration, 4));
      var angle = easeOut * totalAngle;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      drawRoulette();
      ctx.restore();
      drawPointer();

      if (progress < spinDuration) {
        requestAnimationFrame(animate);
      } else {
        var currentAngle = angle % (2 * Math.PI);

var winningAngle = (2 * Math.PI - currentAngle) % (2 * Math.PI);
        var winningSectorIndex = Math.floor(winningAngle / arc) % sectors;
        var prize = prizes[winningSectorIndex].text.join(' ');

        var payload = {
          tg_id: tg_id,
          username: username,
          prize: prize,
          ts: Date.now(),
          initData: (tg && tg.initData) ? tg.initData : ''
        };

        postPrize(payload).then(function (res) {
          try {
            if (tg && tg.showAlert) {
              tg.showAlert(res.ok ? ('Отправил приз: ' + prize) : ('Не отправил (' + res.status + ')'));
            }
          } catch (_e) {}
        }).finally(function () {
          setTimeout(function () {
            try { if (tg && tg.close) tg.close(); } catch (_e) {}
          }, 1200);
        });
      }
    }
    requestAnimationFrame(animate);
  }

  // Первая отрисовка + кнопка
  drawRoulette();
  drawPointer();
  spinBtn.addEventListener('click', spin);
});
