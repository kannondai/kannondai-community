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
| `bgm_data.json` | 取得した曲目データのキャッシュ |
| `youtube_client_secret.json` | OAuth2クライアント認証情報 (**gitignore**) |
| `token.json` | アクセストークン（初回認証後に自動生成） (**gitignore**) |
| `extracted_documents.txt` | その他の一時文書 (**gitignore**) |
