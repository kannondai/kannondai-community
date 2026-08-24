# tools/ — 管理スクリプト群

## BGM選曲リスト 月次更新手順

対象ファイル: `docs/community/cafe_bgm_selection.html`

### 1. プレイリストから曲目を取得する

```
cd c:\Users\takahashi\GitHub\kannondai-community\tools
python get_playlist.py <YouTubeプレイリストURL> [<2つ目のURL> ...]
```

- 実行結果は `tools/bgm_data.json` に保存される
- ターミナルに曲名・演奏者・動画IDのTSVサマリーが表示される
- **注意**: 「演奏者」はYouTubeチャンネル名がそのまま入るが、旧チャンネル名（例: 「〇〇VEVO」）のことがある。
  貼り付け前に動画ページで**現在の表示名**を確認し、それに揃えること。

#### 初回認証 / トークン期限切れ時

`token.json` が存在しないか期限切れの場合、ブラウザが自動的に開くので  
Googleアカウントでログインして認証を完了する。  
認証後、`token.json` が自動的に更新される。

認証ファイル（gitignore済み、リポジトリには含まれない）:
- `tools/youtube_client_secret.json` — Google Cloud Console からダウンロードしたOAuth2クライアント認証情報
- `tools/token.json` — 認証後に自動生成されるアクセストークン

### 2. HTMLを更新する

#### 前回回の「予定」→「記録」に変換する

```html
<!-- 変更前 -->
<h3>第〇回 <time datetime="YYYY-MM-DD">YYYY年M月D日(曜)</time> 🗓️予定</h3>

<!-- 変更後 -->
<h3>第〇回 <time datetime="YYYY-MM-DD">YYYY年M月D日(曜)</time> 📝記録</h3>
```

説明文も「予定しています」→「お届けしました」などに修正する。

#### 新しい回のセクションを追加する

ファイル先頭寄りの `<section>` 群の最上部に新セクションを挿入する。  
`id` 属性は `cafe-YYYYMMDD`（開催日）とする。

```html
<section id="cafe-YYYYMMDD">
  <h3>第〇回 <time datetime="YYYY-MM-DD">YYYY年M月D日(曜)</time> 🗓️予定</h3>
  <p>...</p>
  <div class="table-container">
    <table class="bgm-table">
      <thead>
        <tr><th>No</th><th>曲名</th><th>作曲</th><th>演奏</th><th>YouTube</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><a href="https://ja.wikipedia.org/wiki/...">曲名</a></td>
          <td><a href="https://ja.wikipedia.org/wiki/...">作曲者名</a></td>
          <td><a href="https://www.youtube.com/watch?v=VIDEO_ID">演奏者名</a></td>
          <td><a href="https://www.youtube.com/watch?v=VIDEO_ID">▶</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

### 3. WikipediaリンクのURLを確認する

日本語版Wikipediaで曲名を検索し、**正確なページタイトル**を確認してから  
URLエンコードして貼り付ける。

よくある落とし穴:
- `曲名_(バッハ)` などの括弧付きが存在しない場合がある → `曲名` 単体を試す
- 同名異曲（同名の映画・アルバム等）の曖昧さ回避ページに注意する
- 英語版のほうが内容的に正確な場合は英語版 (`en.wikipedia.org`) を使う

### 4. コミット＆プッシュ

```
cd c:\Users\takahashi\GitHub\kannondai-community
git add docs/community/cafe_bgm_selection.html
git commit -m "community: 第〇回BGM選曲リスト追加 (YYYY年M月)"
git push
```

---

---

## 別PCでのセットアップ

### 1. リポジトリをクローン（または pull）

```
git clone https://github.com/kannondai/kannondai-community.git
cd kannondai-community
```

### 2. Pythonパッケージをインストール

```
pip install -r tools/requirements.txt
```

### 3. `youtube_client_secret.json` を配置する

このファイルはgitignoreされているため、リポジトリには含まれない。  
以下のいずれかの方法で `tools/` フォルダに配置する：

**方法A: 元のPCからコピー**
```
# 元のPC側で実行（例：USB・OneDrive等に一時コピー）
copy c:\Users\takahashi\GitHub\kannondai-community\tools\youtube_client_secret.json <転送先>
```

**方法B: Google Cloud Console から再ダウンロード**
1. https://console.cloud.google.com/ にアクセス
2. プロジェクト「kannondai-community」（または該当プロジェクト）を選択
3. 「APIとサービス」→「認証情報」→ OAuth 2.0 クライアントID の「ダウンロード」
4. ダウンロードしたファイルを `tools/youtube_client_secret.json` にリネームして配置

### 4. 初回認証

`get_playlist.py` を初めて実行すると自動的にブラウザが開く。  
Googleアカウントでログインして認証を完了すれば `token.json` が自動生成される。

```
cd tools
python get_playlist.py <YouTubeプレイリストURL>
```

---

## BGM紹介文の執筆方針

### 基本原則
- 紹介文は**表に書いてあることを繰り返さない**
- 「曲目の羅列」「一般的な季節の感想」は意味がないので避ける
- 紹介文がないなら、いっそ省いた方がよい（表だけで十分）

### 書くべき内容（表にない情報のみ）

以下のいずれかを一文で添える：
- **選曲の経緯・背景**（例：前回と同じ曲を再度選んだ理由、Copilot に候補を出してもらった等）
- **当日の反応・エピソード**（例：好評だった、リクエストがあった）
- **曲に関する小さな発見**（例：ギター版だと別の曲に聞こえる）

### 実例

**良い例：**
> 「ハレルヤとショパンの夜想曲は、前回３月と同じ選曲です。気に入った曲は繰り返しても飽きない — そういう曲だということかもしれません。」

> 「今回は Copilot に候補を挙げてもらいました。演奏者は引き続き選定中です。」

> 「古谷さんお薦めの…代わりに…にしました」「歌詞がない方がよいと感じました」

**悪い例（曲目の羅列）：**
> 「４月は、バッハの…チェロとギターによるクラシックの名曲に加えて…お届けします。」→ 表で分かる

> 「５月は新緑の季節。…季節感のある５曲を検討中です。」→ 誰でも書ける

---

## ファイル一覧

| ファイル | 説明 |
|----------|------|
| `get_playlist.py` | YouTubeプレイリスト取得スクリプト（OAuth2認証対応） |
| `create_offline_playlist.py` | YouTube再生リストのオフライン再生用HTMLプレイリスト生成ツール |
| `bgm_data.json` | 取得した曲目データのキャッシュ |
| `youtube_client_secret.json` | OAuth2クライアント認証情報 (**gitignore**) |
| `token.json` | アクセストークン（初回認証後に自動生成） (**gitignore**) |
| `extracted_documents.txt` | その他の一時文書 (**gitignore**) |

---

## オフライン再生プレイリスト生成（`create_offline_playlist.py`）

### 目的

YouTube Premium のオフライン保存機能を補完し、以下の利便性を向上させるツール：
- **ループ再生**（YouTube Premium アプリでは不可）
- **動画ごとの音量調整**（保存・復元機能付き）
- **クロスプラットフォーム再生**（フォルダごとコピーで別マシンでも使用可能）

### YouTube 利用規約への配慮

このツールは `yt-dlp` を使用して動画をダウンロードします。  
**YouTube Premium 契約のオフライン保存の範囲内での利用** を前提としています。

**自主基準**（`docs/community/2025__/YouTube 自主基準.pdf` 参照）:
- YouTube Premium 契約メンバーが一定比率で存在
- 視聴回数貢献、高評価、チャンネル登録によるクリエイター支援
- 非営利目的（観音台カフェでの BGM 利用）
- 節度を保った適切な運用

**免責**: YouTube 利用規約の解釈や法的判断については、ユーザーの責任において行ってください。

### 使い方

#### 1. 依存パッケージのインストール

```bash
# グローバル Python 3.14 環境（管理者権限 PowerShell）
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib yt-dlp
```

#### 2. OAuth2 認証情報の配置

`get_playlist.py` と同じ認証情報を使用します。  
`tools/youtube_client_secret.json` が既に存在する場合は不要です。

#### 3. プレイリストのダウンロードと HTML 生成

```bash
cd E:\GitHub\kannondai-community\tools
python create_offline_playlist.py "https://www.youtube.com/playlist?list=PLxxx"

# 出力先を指定する場合
python create_offline_playlist.py "https://www.youtube.com/playlist?list=PLxxx" E:\YouTube\offline-playlists
```

**初回実行時**: ブラウザが開いて OAuth2 認証を求められます。認証後、`token.json` が自動生成されます。

#### 4. 生成されるファイル

```
E:\YouTube\offline-playlists\[再生リスト名]\
  ├─ playlist.html        # ← ブラウザで開く
  ├─ volumes.json         # 音量設定ファイル
  ├─ 1-動画タイトル.mp4
  ├─ 2-動画タイトル.mp4
  └─ ...
```

### 音量調整機能（ポータブル対応）

#### 調整方法

1. `playlist.html` をブラウザで開く
2. 各動画の右側にある音量スライダーで調整
3. または、再生中にメイン音量スライダーで調整
4. **「💾 音量設定を保存」ボタンをクリック**
5. ダウンロードされた `volumes.json` で元のファイルを**上書き**

#### ポータブル性

`volumes.json` は以下の形式で保存されます：

```json
{
  "1-video_title.mp4": 0.75,
  "2-video_title.mp4": 1.0,
  "3-video_title.mp4": 0.5
}
```

**フォルダごとコピーすれば、別のマシンでも音量設定が保持されます。**

### HTML プレイリストの機能

- ✅ 自動繰り返し再生（ON/OFF 切替可能）
- ✅ 前へ/次へボタン
- ✅ 動画ごとの音量調整（自動保存・復元）
- ✅ プレイリスト一覧（クリックで選択再生）
- ✅ キーボード操作（← → R）
- ✅ 完全オフライン動作（インターネット不要）
- ✅ ポータブル（フォルダごとコピーで他のマシンでも動作）

### 技術的背景

**開発日**: 2026年8月2日  
**開発理由**: YouTube Premium オフライン保存機能ではループ再生ができないため

このツールは、YouTube Premium の正当な利用を前提とした **プレイリスト管理ツール** として機能します。
