const btn   = document.getElementById('scanBtn');
const status = document.getElementById('status');

btn.addEventListener('click', async () => {
  statusDiv.textContent = 'Procurando vídeos...';

  try {
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    const resposta = await chrome.tabs.sendMessage(tab.id, { action: 'SCAN' });

    if (resposta && resposta.videos && resposta.videos.length) {
      let html = `<strong>Encontrados:</strong> ${resposta.videos.length} vídeo(s)<br>`;
      resposta.videos.forEach(v => {
        html += `• ${v.quality}<br>`;
      });
      statusDiv.innerHTML = html;
    } else {
      statusDiv.textContent = 'Nenhum vídeo encontrado.';
    }
  } catch (e) {
    statusDiv.textContent = 'Erro: ' + e.message;
  }
});