const btn = document.getElementById('scanBtn');
const statusDiv = document.getElementById('status');

if (!btn || !statusDiv) {
  console.error('Erro: Elementos do popup não encontrados!');
  if (statusDiv) statusDiv.textContent = 'Erro no carregamento.';
  throw new Error('Elementos ausentes');
}

async function getYoutubeInfo(url) {
  const res = await fetch('http://localhost:5000/api/get_qualities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return await res.json();
}

btn.addEventListener('click', async () => {
  statusDiv.textContent = 'Analisando vídeo...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;

  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    statusDiv.textContent = 'Apenas YouTube é suportado.';
    return;
  }

  try {
    const info = await getYoutubeInfo(url);
    if (info.error) throw new Error(info.error);

    let html = `<strong>${info.title}</strong><br><br>`;
    info.qualities.forEach(q => {
      html += `
        <button id="yt-btn-${q}" class="quality-btn">
          Baixar ${q}
        </button>`;
    });
    statusDiv.innerHTML = html;

    info.qualities.forEach(q => {
      const downloadBtn = document.getElementById(`yt-btn-${q}`);
      downloadBtn.addEventListener('click', async () => {
        downloadBtn.textContent = '0%';
        downloadBtn.disabled = true;

        try {
          const response = await fetch('http://localhost:5000/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, quality: q.replace('p', ''), title: info.title })
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro no servidor');
          }

          const contentLength = +response.headers.get('Content-Length') || 0;
          const reader = response.body.getReader();
          let received = 0;
          const chunks = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            received += value.length;

            if (contentLength > 0) {
              const percent = Math.round((received / contentLength) * 100);
              downloadBtn.textContent = `${percent}%`;
            }
          }

          const blob = new Blob(chunks, { type: 'video/mp4' });
          const blobUrl = URL.createObjectURL(blob);
          const filename = `${info.title}_${q}.mp4`;

          chrome.downloads.download({
            url: blobUrl,
            filename: filename,
            saveAs: false
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              downloadBtn.textContent = 'Erro';
              downloadBtn.style.background = '#d32f2f';
              console.error('Download error:', chrome.runtime.lastError);
            } else {
              const check = setInterval(() => {
                chrome.downloads.search({ id: downloadId }, (results) => {
                  if (results[0]?.state === 'complete') {
                    clearInterval(check);
                    downloadBtn.textContent = 'Baixado!';
                    downloadBtn.style.background = '#4caf50';
                    downloadBtn.disabled = false;
                    URL.revokeObjectURL(blobUrl);
                  }
                });
              }, 500);
            }
          });

        } catch (err) {
          downloadBtn.textContent = 'Erro';
          downloadBtn.style.background = '#d32f2f';
          downloadBtn.disabled = false;
          console.error('Erro no download:', err);
        }
      });
    });

  } catch (e) {
    statusDiv.textContent = 'Erro: ' + e.message;
    console.error(e);
  }
});