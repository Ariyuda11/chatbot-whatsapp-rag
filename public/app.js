const API_URL = '/api';

function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');

  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);

  setTimeout(() => {
    notification.classList.remove('show');

    setTimeout(() => notification.remove(), 300);
  }, duration);
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.remove('active')
  );

  event.target.classList.add('active');

  document.querySelectorAll('.tab-pane').forEach(c =>
    c.classList.remove('active')
  );

  document.getElementById(tab).classList.add('active');

  if (tab === 'knowledge') {
    loadKeywords();
  }
}

async function checkBotStatus() {
  try {
    const response = await fetch(`${API_URL}/bot/status`);
    const data = await response.json();

    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const qrSection = document.getElementById('qrSection');
    const readySection = document.getElementById('readySection');

    if (data.isReady) {
      statusDot.classList.add('active');
      statusText.textContent = 'Bot Connected';

      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';

      qrSection.style.display = 'none';
      readySection.style.display = 'block';

    } else if (data.hasQRCode) {
      statusDot.classList.remove('active');
      statusText.textContent = 'Waiting for QR Scan';

      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';

      qrSection.style.display = 'block';
      readySection.style.display = 'none';

      loadQRCode();

    } else if (data.isInitializing) {
      statusDot.classList.remove('active');
      statusText.textContent = 'Initializing...';

      startBtn.style.display = 'none';
      stopBtn.style.display = 'none';

      qrSection.style.display = 'none';
      readySection.style.display = 'none';

    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'Bot Offline';

      startBtn.style.display = 'inline-block';
      stopBtn.style.display = 'none';

      qrSection.style.display = 'none';
      readySection.style.display = 'none';
    }

  } catch (error) {
    console.error('Error checking status:', error);
  }
}

async function loadQRCode() {
  try {
    const response = await fetch(`${API_URL}/bot/qr`);
    const data = await response.json();

    if (data.qr) {
      const qrContainer = document.getElementById('qrcode');

      qrContainer.innerHTML = '';

      const qrImage = document.createElement('img');

      qrImage.src =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qr)}`;

      qrImage.style.width = '280px';
      qrImage.style.height = '280px';

      qrContainer.appendChild(qrImage);
    }

  } catch (error) {
    console.error('Error loading QR:', error);
  }
}

document.getElementById('startBtn').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_URL}/bot/start`, {
      method: 'POST'
    });

    const data = await response.json();

    showNotification(data.message, 'success');

    checkBotStatus();

    const interval = setInterval(checkBotStatus, 2000);

    setTimeout(() => clearInterval(interval), 120000);

  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  try {
    document.getElementById('stopBtn').disabled = true;

    const response = await fetch(`${API_URL}/bot/stop`, {
      method: 'POST'
    });

    const data = await response.json();

    showNotification(data.message, 'success');

    document.getElementById('statusDot').classList.remove('active');

    document.getElementById('statusText').textContent = 'Bot Offline';

    document.getElementById('qrSection').style.display = 'none';

    document.getElementById('readySection').style.display = 'none';

    document.getElementById('startBtn').style.display = 'inline-block';

    document.getElementById('stopBtn').style.display = 'none';

    document.getElementById('stopBtn').disabled = false;

  } catch (error) {
    showNotification('Error: ' + error.message, 'error');

    document.getElementById('stopBtn').disabled = false;
  }
});

async function loadKeywords() {
  try {
    const response = await fetch(`${API_URL}/knowledge/keywords`);
    const data = await response.json();

    const container = document.getElementById('keywordItems');

    container.innerHTML = '';

    if (Object.keys(data.responses).length === 0) {
      container.innerHTML =
        '<p style="color: #999; text-align: center; padding: 40px;">Belum ada keyword. Tambahkan keyword baru di atas!</p>';

      return;
    }

    Object.entries(data.responses).forEach(([keyword, response]) => {
      const item = document.createElement('div');

      item.className = 'keyword-item';

      item.innerHTML = `
        <div class="keyword-info">
          <strong>${keyword}</strong>
          <p>${response}</p>
        </div>

        <div class="keyword-actions">
          <button
            class="btn"
            onclick="editKeyword('${keyword}')"
          >
            Edit
          </button>

          <button
            class="btn btn-danger"
            onclick="deleteKeyword('${keyword}')"
          >
            Delete
          </button>
        </div>
      `;

      container.appendChild(item);
    });

  } catch (error) {
    console.error('Error loading keywords:', error);
  }
}

async function saveKeyword() {
  const keyword =
    document.getElementById('keyword').value.trim().toLowerCase();

  const response =
    document.getElementById('response').value.trim();

  if (!keyword || !response) {
    showNotification(
      'Keyword dan response harus diisi!',
      'warning'
    );

    return;
  }

  try {
    const res = await fetch(`${API_URL}/knowledge/keyword`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        keyword,
        response
      })
    });

    const data = await res.json();

    showNotification(
      data.message,
      data.success ? 'success' : 'error'
    );

    if (data.success) {
      clearForm();
      loadKeywords();
    }

  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
}

function editKeyword(keyword) {
  document.getElementById('keyword').value = keyword;

  loadKeywordsForEdit(keyword);

  document.getElementById('keyword').focus();
}

async function loadKeywordsForEdit(keyword) {
  try {
    const response = await fetch(`${API_URL}/knowledge/keywords`);

    const data = await response.json();

    if (data.responses[keyword]) {
      document.getElementById('response').value =
        data.responses[keyword];
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

async function deleteKeyword(keyword) {
  if (!confirm(`Hapus kata kunci "${keyword}"?`)) return;

  try {
    const response = await fetch(
      `${API_URL}/knowledge/keyword/${encodeURIComponent(keyword)}`,
      {
        method: 'DELETE'
      }
    );

    const data = await response.json();

    showNotification(
      data.message,
      data.success ? 'success' : 'error'
    );

    if (data.success) {
      loadKeywords();
    }

  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
  }
}

function clearForm() {
  document.getElementById('keyword').value = '';

  document.getElementById('response').value = '';

  document.getElementById('keyword').focus();
}

checkBotStatus();

setInterval(checkBotStatus, 5000);