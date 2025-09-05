const testBtn = document.getElementById('test-btn');

function sendTestData() {
    const message = "Связь с n8n установлена!";
    Telegram.WebApp.sendData(message);
    Telegram.WebApp.close();
}

Telegram.WebApp.ready();
testBtn.addEventListener('click', sendTestData);
