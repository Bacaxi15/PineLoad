if (!window.pineLoadScanned) {
  window.pineLoadScanned = true;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action !== 'SCAN') return;

    const videos = [];

    document.querySelectorAll('video').forEach(vid => {
      if (vid.src) {
        videos.push({
          url: vid.src,
          quality: vid.videoHeight ? `${vid.videoHeight}p` : 'desconhecida'
        });
      }

      vid.querySelectorAll('source').forEach(src => {
        if (src.src) {
          videos.push({
            url: src.src,
            quality: src.getAttribute('label') || 'desconhecida'
          });
        }
      });
    });

    const uniqueVideos = videos.filter((v, i, arr) =>
      arr.findIndex(t => t.url === v.url) === i
    );

    sendResponse({ videos: uniqueVideos });

    return true;
  });
}