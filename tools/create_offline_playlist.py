#!/usr/bin/env python3
r"""
YouTube再生リストをオフライン再生用にダウンロードし、HTMLプレイリストを生成

Usage:
    python create_offline_playlist.py <playlist_url> [output_dir]

Example:
    python create_offline_playlist.py "https://www.youtube.com/playlist?list=PLxxx" E:\YouTube\offline-playlists
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# YouTube Data API v3 設定
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'

def get_youtube_service():
    """YouTube Data APIサービスを取得（get_playlist.pyと同じ認証）"""
    creds = None
    token_path = Path(__file__).parent / 'token.json'
    
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            client_secrets_file = Path(__file__).parent / 'youtube_client_secret.json'
            if not client_secrets_file.exists():
                print("ERROR: youtube_client_secret.json が見つかりません")
                print(f"配置場所: {client_secrets_file}")
                print("\nGoogle Cloud Console からダウンロードして tools/ に配置してください。")
                sys.exit(1)
            
            flow = InstalledAppFlow.from_client_secrets_file(
                str(client_secrets_file), SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
    
    return build(API_SERVICE_NAME, API_VERSION, credentials=creds)

def extract_playlist_id(url):
    """URLから再生リストIDを抽出"""
    if 'list=' in url:
        return url.split('list=')[1].split('&')[0]
    return url

def get_playlist_info(youtube, playlist_id):
    """再生リスト情報を取得"""
    request = youtube.playlists().list(
        part='snippet',
        id=playlist_id
    )
    response = request.execute()
    
    if not response.get('items'):
        print(f"ERROR: 再生リスト {playlist_id} が見つかりません")
        sys.exit(1)
    
    return response['items'][0]['snippet']

def get_playlist_videos(youtube, playlist_id):
    """再生リスト内の動画情報を取得"""
    videos = []
    next_page_token = None
    
    while True:
        request = youtube.playlistItems().list(
            part='snippet',
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        response = request.execute()
        
        for item in response['items']:
            snippet = item['snippet']
            videos.append({
                'title': snippet['title'],
                'videoId': snippet['resourceId']['videoId'],
                'position': snippet['position']
            })
        
        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break
    
    return sorted(videos, key=lambda x: x['position'])

def download_playlist(playlist_url, output_dir):
    """yt-dlpで再生リストをダウンロード"""
    print(f"\n動画をダウンロード中: {output_dir}")
    
    # yt-dlp コマンド（グローバルPython 3.14環境を使用）
    cmd = [
        'py', '-3.14', '-m', 'yt_dlp',
        '-o', str(output_dir / '%(playlist_index)s-%(title)s.%(ext)s'),
        '--format', 'best[ext=mp4]/best',  # mp4優先
        '--restrict-filenames',  # ファイル名を安全に
        playlist_url
    ]
    
    # yt-dlpの出力を直接表示（エンコーディングエラー回避）
    result = subprocess.run(cmd)
    
    if result.returncode != 0:
        print("ERROR: ダウンロード失敗")
        sys.exit(1)
    
    print("\nダウンロード完了")

def create_html_playlist(output_dir, playlist_title, videos):
    """HTMLプレイリストファイルを生成"""
    # ダウンロードされた動画ファイルを検出
    video_files = sorted(output_dir.glob('*.mp4'))
    
    if not video_files:
        print("WARNING: mp4ファイルが見つかりません")
        return
    
    # ファイル名とタイトルのマッピング（位置ベース）
    video_list = []
    for idx, f in enumerate(video_files):
        video_info = {
            'filename': f.name,
            'title': videos[idx]['title'] if idx < len(videos) else f.stem
        }
        video_list.append(video_info)
    
    # 初期音量設定ファイルを作成（全て100%）
    volumes_data = {video['filename']: 1.0 for video in video_list}
    volumes_path = output_dir / 'volumes.json'
    with open(volumes_path, 'w', encoding='utf-8') as f:
        json.dump(volumes_data, f, ensure_ascii=False, indent=2)
    
    html_content = f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>{playlist_title} - オフライン再生</title>
<style>
body {{
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
    background: #f5f5f5;
}}
h1 {{
    color: #333;
    border-bottom: 2px solid #ff0000;
    padding-bottom: 10px;
}}
#player {{
    width: 100%;
    max-width: 800px;
    background: #000;
    margin: 20px 0;
}}
#playlist {{
    background: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}}
#playlist h2 {{
    margin-top: 0;
    color: #555;
    font-size: 1.2em;
}}
.video-item {{
    padding: 10px;
    margin: 5px 0;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
}}
.video-item:hover {{
    background: #f0f0f0;
}}
.video-item.active {{
    background: #e3f2fd;
    font-weight: bold;
}}
.controls {{
    margin: 15px 0;
    padding: 10px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}}
button {{
    padding: 10px 20px;
    margin: 5px;
    border: none;
    border-radius: 4px;
    background: #ff0000;
    color: white;
    cursor: pointer;
    font-size: 14px;
}}
button:hover {{
    background: #cc0000;
}}
button:disabled {{
    background: #ccc;
    cursor: not-allowed;
}}
.info {{
    color: #666;
    font-size: 0.9em;
    margin-top: 10px;
}}
.volume-control {{
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}}
.volume-slider {{
    flex: 1;
    max-width: 200px;
}}
.video-item-volume {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}}
.video-item-volume .volume-slider {{
    width: 80px;
    opacity: 0.6;
}}
.video-item-volume .volume-slider:hover {{
    opacity: 1;
}}
</style>
</head>
<body>
<h1>{playlist_title}</h1>

<video id="player" controls autoplay>
  <source src="" type="video/mp4">
  お使いのブラウザは動画再生に対応していません。
</video>

<div class="controls">
  <button onclick="playPrevious()">◀ 前へ</button>
  <button onclick="playNext()">次へ ▶</button>
  <button onclick="toggleRepeat()" id="repeatBtn">🔁 繰り返し: ON</button>
  <button onclick="saveVolumes()" id="saveBtn">💾 音量設定を保存</button>
  <div class="volume-control">
    <span>🔊 音量:</span>
    <input type="range" id="volumeSlider" class="volume-slider" min="0" max="100" value="100">
    <span id="volumeValue">100%</span>
  </div>
  <div class="info" id="info">1 / {len(video_list)}</div>
</div>

<div id="playlist">
  <h2>📋 プレイリスト ({len(video_list)}曲)</h2>
  <div id="videoList"></div>
</div>

<script>
const playlist = {json.dumps(video_list, ensure_ascii=False, indent=2)};

let currentIndex = 0;
let repeatMode = true;
let volumes = {{}};  // 音量設定（ファイルから読み込み or メモリ内保持）
const player = document.getElementById('player');
const videoListDiv = document.getElementById('videoList');
const repeatBtn = document.getElementById('repeatBtn');
const saveBtn = document.getElementById('saveBtn');
const info = document.getElementById('info');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

// volumes.json を読み込み（初回のみ）
async function loadVolumes() {{
  try {{
    const response = await fetch('volumes.json');
    if (response.ok) {{
      volumes = await response.json();
      console.log('volumes.json を読み込みました');
    }} else {{
      // ファイルが無い場合はデフォルト（全て1.0）
      playlist.forEach(v => volumes[v.filename] = 1.0);
    }}
  }} catch (error) {{
    console.warn('volumes.json の読み込みに失敗。デフォルト値を使用します。');
    playlist.forEach(v => volumes[v.filename] = 1.0);
  }}
  renderPlaylist();
  playVideo(0);
}}

// volumes.json をダウンロード保存
function saveVolumes() {{
  const json = JSON.stringify(volumes, null, 2);
  const blob = new Blob([json], {{ type: 'application/json' }});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'volumes.json';
  a.click();
  URL.revokeObjectURL(url);
  alert('volumes.json をダウンロードしました。\\nこのファイルで元の volumes.json を置き換えてください。');
}}

// 音量スライダーの変更
volumeSlider.addEventListener('input', (e) => {{
  const volume = e.target.value / 100;
  player.volume = volume;
  volumeValue.textContent = e.target.value + '%';
  volumes[playlist[currentIndex].filename] = volume;
  renderPlaylist();  // 一覧の音量スライダーも更新
}});

// プレイリストUI生成
function renderPlaylist() {{
  videoListDiv.innerHTML = '';
  playlist.forEach((video, index) => {{
    const div = document.createElement('div');
    div.className = 'video-item' + (index === currentIndex ? ' active' : '');
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'video-item-volume';
    
    const title = document.createElement('span');
    title.textContent = `${{index + 1}}. ${{video.title}}`;
    title.style.flex = '1';
    title.style.cursor = 'pointer';
    title.onclick = () => playVideo(index);
    
    const volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.className = 'volume-slider';
    volSlider.min = '0';
    volSlider.max = '100';
    const savedVolume = volumes[video.filename];
    volSlider.value = savedVolume !== undefined ? Math.round(savedVolume * 100) : 100;
    volSlider.onclick = (e) => e.stopPropagation();
    volSlider.oninput = (e) => {{
      e.stopPropagation();
      const vol = e.target.value / 100;
      volumes[video.filename] = vol;
      if (index === currentIndex) {{
        player.volume = vol;
        volumeSlider.value = e.target.value;
        volumeValue.textContent = e.target.value + '%';
      }}
    }};
    
    itemDiv.appendChild(title);
    itemDiv.appendChild(volSlider);
    div.appendChild(itemDiv);
    videoListDiv.appendChild(div);
  }});
}}

// 動画再生
function playVideo(index) {{
  currentIndex = index;
  player.src = playlist[currentIndex].filename;
  
  // 保存された音量を復元
  const savedVolume = volumes[playlist[currentIndex].filename];
  const volume = savedVolume !== undefined ? savedVolume : 1.0;
  player.volume = volume;
  volumeSlider.value = Math.round(volume * 100);
  volumeValue.textContent = Math.round(volume * 100) + '%';
  
  player.play();
  renderPlaylist();
  updateInfo();
}}

// 次の動画
function playNext() {{
  if (currentIndex < playlist.length - 1) {{
    playVideo(currentIndex + 1);
  }} else if (repeatMode) {{
    playVideo(0);
  }}
}}

// 前の動画
function playPrevious() {{
  if (currentIndex > 0) {{
    playVideo(currentIndex - 1);
  }} else if (repeatMode) {{
    playVideo(playlist.length - 1);
  }}
}}

// 繰り返しモード切り替え
function toggleRepeat() {{
  repeatMode = !repeatMode;
  repeatBtn.textContent = repeatMode ? '🔁 繰り返し: ON' : '🔁 繰り返し: OFF';
}}

// 情報表示更新
function updateInfo() {{
  info.textContent = `${{currentIndex + 1}} / ${{playlist.length}}`;
}}

// 動画終了時
player.addEventListener('ended', playNext);

// キーボードショートカット
document.addEventListener('keydown', (e) => {{
  if (e.key === 'ArrowRight') playNext();
  if (e.key === 'ArrowLeft') playPrevious();
  if (e.key === 'r' || e.key === 'R') toggleRepeat();
}});

// 初期化（volumes.json を読み込んでから開始）
loadVolumes();
</script>

<p style="color: #999; font-size: 0.85em; margin-top: 30px;">
このプレイリストはオフライン再生用です。フォルダごとコピーして別のマシンでも使用できます。<br>
キーボード操作: ← 前へ | → 次へ | R 繰り返し切替<br>
<strong>音量調整後は「💾 音量設定を保存」ボタンをクリックしてください。</strong>
</p>
</body>
</html>'''
    
    html_path = output_dir / 'playlist.html'
    html_path.write_text(html_content, encoding='utf-8')
    print(f"\nHTMLプレイリスト作成: {html_path}")
    print(f"音量設定ファイル作成: {volumes_path}")
    print("\n💡 音量調整の使い方:")
    print("  1. playlist.html をブラウザで開く")
    print("  2. 各動画の音量を調整")
    print("  3. 「💾 音量設定を保存」ボタンをクリック")
    print("  4. ダウンロードされた volumes.json で元のファイルを置き換える")
    print("  → フォルダごとコピーすれば、音量設定も移行されます")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    playlist_url = sys.argv[1]
    base_output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(r'E:\YouTube\offline-playlists')
    
    print(f"再生リスト URL: {playlist_url}")
    
    # 再生リストID抽出
    playlist_id = extract_playlist_id(playlist_url)
    print(f"再生リスト ID: {playlist_id}")
    
    # YouTube API 認証
    print("\nYouTube Data API 認証中...")
    youtube = get_youtube_service()
    
    # 再生リスト情報取得
    print("再生リスト情報を取得中...")
    playlist_info = get_playlist_info(youtube, playlist_id)
    playlist_title = playlist_info['title']
    print(f"タイトル: {playlist_title}")
    
    # 動画リスト取得
    videos = get_playlist_videos(youtube, playlist_id)
    print(f"動画数: {len(videos)}")
    
    # 出力ディレクトリ作成
    safe_title = "".join(c for c in playlist_title if c.isalnum() or c in (' ', '-', '_')).strip()
    output_dir = base_output_dir / safe_title
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 動画ダウンロード
    download_playlist(playlist_url, output_dir)
    
    # HTMLプレイリスト生成
    create_html_playlist(output_dir, playlist_title, videos)
    
    print(f"\n✅ 完了！")
    print(f"📁 保存先: {output_dir}")
    print(f"▶️  再生: {output_dir / 'playlist.html'} をブラウザで開く")
    print(f"\nこのフォルダをコピーすれば、他のマシンでもそのまま再生できます。")

if __name__ == '__main__':
    main()
