<!-- AI Context Standard v0.8.8 - Adopted: 2026-04-02 -->
# AI Assistant Initialization Guide — kannondai-community (Public)

**Purpose**: Initialize AI context for working with this repository

> **On every session start**: Before responding to ANY first message, read [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) first, then output exactly this line at the top of your response:
> `✅ Initialized (kannondai-community) — [現在のタスクを一言で]`
> Then respond to the user's message.

---

## 📚 Core Documents to Read

After reading this file, refer to:
- **PROJECT_STATUS.md** - Current work state and history
- **README.md** - Project overview and purpose
- **tools/README.md** - Tool usage (YouTube playlist scripts, etc.)

---

## 🎯 Repository Context

**Project**: Kannondai Community Information Site (Public)  
**Website**: https://freesemt.github.io/kannondai-community/  
**Repository**: https://github.com/kannondai/kannondai-community  

**Mission**: 神南大自治会の活動に関する情報を、住民にわかりやすく発信する非公式の情報サイト（公開リポジトリ）。

**Primary language**: Japanese (content), English (code/docs)

**Relationship to jichikai-2-priv**: This is the public-facing repo. Private/sensitive documents (annual reports drafts, mail bot, design docs) are in `jichikai-2-priv`.

---

## 📂 Repository Structure

```
docs/
  index.html              # トップページ
  top.html                # メインコンテンツページ（更新履歴はここに表示）
  about_this_site.html    # サイト紹介
  hall-reserve.html       # 集会所予約
  org_chart.html          # 組織図
  data/
    updates.json          # ★ 更新履歴データ（top.html の更新履歴はここを編集する）
  climate-change/         # 気候変動関連ページ
  community/              # コミュニティ関連
  environment/            # 環境関連
  modernize/              # 近代化提案
  philosophy/             # 哲学的基盤
  scripts/                # JavaScript
  styles/                 # CSS
  images/                 # 画像

tools/
  get_playlist.py         # YouTube プレイリスト取得
  bgm_data.json           # 取得済み曲目キャッシュ
  README.md               # ツール使用ガイド
```

---

## 🔑 Working Conventions

### 1. サイトは静的HTML

ビルドシステムやフレームワークなし。HTMLファイルを直接編集する。

### 2. 簡潔性重視

文章・表現はできるだけ簡潔にまとめる。  
冗長な説明や重複を避け、読みやすさ・親しみやすさを優先する。

### 3. 自然な日本語表現

「住民目線の情報を発信する」→「住民目線で発信する」など、より自然で簡潔な日本語表現に。

### 4. サイトの立場

サイトは「有志による非公式のページ」。公式組織の制約に縛られず自由な発信を目指す。

### 5. 文字エンコーディング

常にUTF-8。日本語コンテンツが主。

---

## 💡 Quick Tips for AI Assistants

- **Primary task type**: HTMLページの編集、コンテンツ更新、BGM選曲ページの月次更新
- **Site is static HTML**: No build system — edit HTML files directly
- **Character encoding**: Always UTF-8
- **BGM page updates**: See `tools/README.md` for monthly update workflow
- **BGM playlist access**: `tools/get_playlist.py` supports **unlisted playlists** via YouTube Data API OAuth2 — run `python get_playlist.py <URL>` in `tools/`; browser auth opens automatically if `token.json` is missing/expired
- **Current work**: Check PROJECT_STATUS.md for latest tasks

### 更新履歴の追加方法

`top.html` の更新履歴は **`docs/data/updates.json`** で管理している。  
「更新履歴に追加して」と言われたら `top.html` ではなく **`updates.json` の先頭に追記**する。

```json
{
  "date": "YYYY-MM-DD",
  "description": "「<a href=\"相対パス\">ページタイトル</a>」を掲載しました。"
}
```

- `href` は `docs/` からの相対パス（例: `community/2026__/foo.html`）
- 日付は降順（新しいものを先頭に）

---

## 🤖 AI Operating Conventions (from AI Context Standard v0.8.8)

### Failure Recovery

When the same operation fails 3+ times, stop and explain to the user. Propose alternatives. Do not silently retry 15+ times.

### PowerShell Multi-repo Git

Always use `git -C <path>` instead of `cd <path>; git ...`.  
The terminal tool may silently strip `cd` from chained commands.

```powershell
# ❌ Unreliable
cd C:\path\to\repo; git commit -m "..."

# ✅ Reliable
git -C C:\path\to\repo commit -m "..."
```
