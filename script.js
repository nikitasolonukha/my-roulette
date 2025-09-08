// === ПРОД-вебхук n8n (ОБЯЗАТЕЛЬНО без "-test") ===
var WEBHOOK_URL = 'https://solonflowai.ru/webhook/roulette_prize';

// отлов ошибок
window.onerror = function (msg) {
  try { if (window.Telegram && Telegram.WebApp && Telegram.WebApp.showAlert) Telegram.WebApp.showAlert('JS: ' + msg); } catch(_) {}
};

// всё после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('roulette');
  var ctx = canvas.getContext('2d');
  var spinBtn = document.getElementById('spin-btn');

  // Telegram SDK
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  try { tg && tg.ready && tg.ready(); } catch(e){}

  var user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : null;
  var tg_id = user ? user.id : null;
  var username = user ? user.username : null;

  // призы
  var prizes = [
    { text: ["Прямой", "перевод", "300₽"], color: '#48dbfb' },
    { text: ["«Дичь от", "логиста»"],       color: '#1dd1a1' },
    { text: ["«Сок", "благодарности»", "– 100 ₽"], color: '#ff6b6b' },
    { text: ["«Быстрая", "полка»"],         color: '#feca57' }
  ];

  // адаптивный канвас под ретину
  function resizeCanvas() {
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var vw = Math.min(360, Math.floor(window.innerWidth * 0.9));
    var size = Math.max(260, Math.min(vw, 380));
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width  = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStatic();
  }
  window.addEventListener('resize', resizeCanvas);

  var sectors = prizes.length;
  var arc = (2*Math.PI)/sectors;
  var spinDuration = 6000;
  var isSpinning = false;
  var prizeSent = false; // анти-дубль на фронте

  function drawWheel(angle) {
    var tr = ctx.getTransform();
    var scaleX = tr.a  1, scaleY = tr.d  1;
    var cx = canvas.width  / (2 * scaleX);
    var cy = canvas.height / (2 * scaleY);
    var r  = Math.min(cx, cy) - 8;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle || 0);
    ctx.translate(-cx, -cy);

    for (var i=0;i<sectors;i++){
      var a0 = i*arc, a1 = a0 + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.fillStyle = prizes[i].color;
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + arc/2);
      ctx.fillStyle = '#fff';
      ctx.font = '600 15px -apple-system,Segoe UI,Roboto,Arial';
      ctx.textAlign = 'center';
      var lines = prizes[i].text;
      for (var j=0;j<lines.length;j++){
        ctx.fillText(lines[j], r*0.55, (j - (lines.length-1)/2)*18);
      }
      ctx.restore();
    }
    ctx.restore();

    // окантовка
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, r+2, 0, Math.PI*2);
    ctx.stroke();

    // «гайка» в центре
    var grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
    grd.addColorStop(0, '#fff'); grd.addColorStop(1, '#ccd3ff');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; ctx.stroke();

    drawPointer(cx, cy, r);
  }

  function drawPointer(cx, cy, r){
    ctx.save(); ctx.translate(cx, cy);
    var pointerSize = 24, offset = 8;
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.moveTo(r + offset, 0);
    ctx.lineTo(r + offset - pointerSize, 8);
    ctx.lineTo(r + offset - pointerSize, -8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r + offset - 2, 0, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawStatic(){ ctx.clearRect(0,0,canvas.width,canvas.height); drawWheel(0); }

  function postPrize(payload){
    return fetch(WEBHOOK_URL, {

method:'POST',
      headers:{'Content-Type':'application/json'},
      keepalive:true,
      body:JSON.stringify(payload)
    }).then(function(r){return r.text().then(function(t){return{ok:r.ok,status:r.status,text:t};});});
  }

  function spin(){
    if(isSpinning) return;
    isSpinning = true; spinBtn.disabled = true;

    var randomSpins = Math.random()*5 + 8;
    var stopAngle = Math.random() * 2*Math.PI;
    var totalAngle = randomSpins*2*Math.PI + stopAngle;

    var start=null;
    function frame(ts){
      if(!start) start = ts;
      var p = Math.min(1, (ts - start)/spinDuration);
      var ease = 1 - Math.pow(1-p, 4);
      var angle = ease * totalAngle;

      ctx.clearRect(0,0,canvas.width,canvas.height);
      drawWheel(angle);

      if(p < 1){ requestAnimationFrame(frame); }
      else {
        var currentAngle = angle % (2*Math.PI);
        var winningAngle = (2*Math.PI - currentAngle) % (2*Math.PI);
        var idx = Math.floor(winningAngle/arc) % sectors;
        var prize = prizes[idx].text.join(' ');

        if (prizeSent) return; // анти-дубль
        prizeSent = true;

        var payload = {
          tg_id: tg_id,
          username: username,
          prize: prize,
          ts: Date.now(),
          event_id: String(tg_id || '0') + '-' + String(Date.now()),
          initData: (tg && tg.initData) ? tg.initData : ''
        };

        postPrize(payload).finally(function(){
          try{ tg && tg.showAlert && tg.showAlert('Ваш приз: ' + prize); }catch(_){}
          setTimeout(function(){ try{ tg && tg.close && tg.close(); }catch(_){ } }, 1200);
        });
      }
    }
    requestAnimationFrame(frame);
  }

  resizeCanvas();
  spinBtn.addEventListener('click', spin);
});
