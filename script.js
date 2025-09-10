/* =========== НАСТРОЙКА =========== */
// прод-вебхук n8n (без "-test")
var WEBHOOK_URL = 'https://solonflowai.ru/webhook/roulette_prize';

// список мемов для «дичь от логиста»
var LOGIST_MEMES = [
  // вставь сюда 1–5 URL картинок (jpg/png/gif). Примеры:
  // 'https://example.com/memes/meme1.jpg',
  // 'https://example.com/memes/meme2.png',
];

/* =========== БАЗА =========== */
var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
try{ tg && tg.ready && tg.ready(); }catch(_){}

var user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : null;
var TG_ID = user ? user.id : null;
var USERNAME = user ? user.username : null;

var canvas, ctx, spinBtn, hint, modal, resultText, memeImg, closeModal;

var prizes = [
  {label:'сок благодарности', color:'#ff6b6b'},
  {label:'быстрая полка',     color:'#feca57'},
  {label:'прямой перевод',    color:'#48dbfb'},
  {label:'дичь от логиста',   color:'#1dd1a1'}
];
var sectors = prizes.length;
var arc = (2*Math.PI)/sectors;
var spinning = false;
var alreadyPlayed = false;

/* =========== ПОМОЩНИКИ =========== */
function showAlert(text){ try{ tg && tg.showAlert && tg.showAlert(text); }catch(_){ alert(text); } }

function sendPrize(prizeText){
  var payload = {
    tg_id: TG_ID,
    username: USERNAME,
    prize: prizeText,
    ts: Date.now(),
    event_id: String(TG_ID || '0') + '-' + String(Date.now())
  };
  fetch(WEBHOOK_URL, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    keepalive:true,
    body: JSON.stringify(payload)
  }).catch(function(e){ console.log('webhook error', e); });
}

function drawWheel(angle){
  var W = canvas.width, H = canvas.height;
  var cx = W/2, cy = H/2, r = Math.min(cx, cy) - 8;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle||0);
  ctx.translate(-cx, -cy);

  for (var i=0;i<sectors;i++){
    var a0 = i*arc, a1 = a0 + arc;
    // сектор
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.fillStyle = prizes[i].color;
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fill();
    // граница
    ctx.strokeStyle = 'rgba(0,0,0,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
    // текст
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a0 + arc/2);
    ctx.fillStyle = '#fff';
    ctx.font = '600 16px -apple-system,Segoe UI,Roboto,Arial';
    ctx.textAlign = 'center';
    ctx.fillText(prizes[i].label, r*0.58, 6);
    ctx.restore();
  }
  ctx.restore();

  // окантовка
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.arc(cx, cy, r+2, 0, Math.PI*2); ctx.stroke();

  // центр
  ctx.fillStyle = '#e5ecff';
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.15)';
  ctx.lineWidth = 1; ctx.stroke();
}

function drawStatic(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawWheel(0);
}

function openResult(prizeLabel){
  var textMap = {
    'сок благодарности':
      'Сок благодарности — 100 руб. на карту.\nПришлите скрин вашему логисту — он всё организует.',
    'быстрая полка':
      'Быстрая полка — приоритет на следующую доставку.\nПришлите скрин вашему логисту — он всё организует.',
    'прямой перевод':
      'Прямой перевод — 300 руб. на карту.\nПришлите скрин вашему логисту — он всё организует.',
    'дичь от логиста':
      'Дичь от логиста — лови мем 😄\n(Пришлите скрин вашему логисту.)'
  };

  resultText.textContent = textMap[prizeLabel] || prizeLabel;

  // мем для «дичь от логиста»
  if (prizeLabel === 'дичь от логиста' && LOGIST_MEMES.length){
    var idx = Math.floor(Math.random()*LOGIST_MEMES.length);
    memeImg.src = LOGIST_MEMES[idx];
    memeImg.classList.remove('hidden');
  } else {
    memeImg.classList.add('hidden');
    memeImg.removeAttribute('src');
  }

  modal.classList.remove('hidden');
}

function spin(){
  if (spinning || alreadyPlayed) return;
  spinning = true;
  spinBtn.disabled = true;

  var total = (Math.random()*5 + 8) * 2*Math.PI + Math.random()*2*Math.PI;

var start = null;
  var duration = 6000;

  function tick(t){
    if (!start) start = t;
    var p = Math.min(1, (t - start)/duration);
    var ease = 1 - Math.pow(1-p, 4);
    var angle = ease * total;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawWheel(angle);

    if (p < 1) requestAnimationFrame(tick);
    else {
      var current = angle % (2*Math.PI);
      var winningAngle = (2*Math.PI - current) % (2*Math.PI);
      var idx = Math.floor(winningAngle/arc) % sectors;
      var prizeLabel = prizes[idx].label;

      // локальная защита "крутить 1 раз"
      try{ localStorage.setItem('roulette_played','1'); }catch(_){}
      alreadyPlayed = true;

      // отправка в n8n
      sendPrize(prizeLabel);

      // показать окно результата
      openResult(prizeLabel);
    }
  }
  requestAnimationFrame(tick);
}

/* =========== ИНИТ =========== */
window.onerror = function(m){ try{ tg && tg.showAlert && tg.showAlert('JS: '+m); }catch(_){ console.log(m); } };

document.addEventListener('DOMContentLoaded', function(){
  canvas = document.getElementById('roulette');
  ctx    = canvas.getContext('2d');
  spinBtn= document.getElementById('spin-btn');
  hint   = document.getElementById('hint');
  modal  = document.getElementById('result-modal');
  resultText = document.getElementById('result-text');
  memeImg    = document.getElementById('meme');
  closeModal = document.getElementById('close-modal');

  // запрет второй попытки в рамках устройства
  try{
    if (localStorage.getItem('roulette_played') === '1'){
      alreadyPlayed = true;
      spinBtn.disabled = true;
      hint.textContent = 'Вы уже крутили колесо на этом устройстве.';
    }
  }catch(_){}

  drawStatic();
  spinBtn.addEventListener('click', spin);
  closeModal.addEventListener('click', function(){
    modal.classList.add('hidden');
    // закрыть мини-апп
    try{ tg && tg.close && tg.close(); }catch(_){}
  });
});
