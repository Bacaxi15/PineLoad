from flask import Flask, request, jsonify, send_file
import yt_dlp
import os
import time

app = Flask(__name__)
DOWNLOAD_DIR = "downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

@app.route('/api/get_qualities', methods=['POST'])
def get_qualities():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    try:
        ydl_opts = {'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            heights = {f.get('height') for f in formats if f.get('height') and f.get('vcodec') != 'none'}
            qualities = sorted([h for h in heights if h <= 1080], reverse=True)
            title = info.get('title', 'video')
            return jsonify({
                'title': title,
                'qualities': [f"{q}p" for q in qualities]
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    quality = data.get('quality', '720')
    title = data.get('title', 'video')

    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    safe_title = "".join(c for c in title if c.isalnum() or c in " -_")[:100]
    filename = f"{safe_title}_{quality}p.mp4"
    filepath = os.path.join(DOWNLOAD_DIR, filename)

    ydl_opts = {
        'format': f'best[height<={quality}][ext=mp4]/best[ext=mp4]/best',
        'outtmpl': filepath,
        'quiet': True,
        'merge_output_format': 'mp4',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        timeout = 60
        while not os.path.exists(filepath) and timeout > 0:
            time.sleep(1)
            timeout -= 1

        if not os.path.exists(filepath):
            return jsonify({'error': 'Download falhou'}), 500

        file_size = os.path.getsize(filepath)
        response = send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='video/mp4'
        )
        response.headers['Content-Length'] = file_size
        return response

    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("PineLoad Server v0.3.3 - RODANDO!")
    app.run(host='127.0.0.1', port=5000, debug=False)