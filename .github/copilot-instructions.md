<!-- AI Context Standard v0.7 - Adopted: 2026-03-24 -->
# AI Assistant Initialization Guide — kannondai-community (Public)

**Purpose**: Initialize AI context for working with this repository

> **On every session start**: Read [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) to get the current task and recent context before responding.

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
  top.html                # メインコンテンツページ
  about_this_site.html    # サイト紹介
  hall-reserve.html       # 集会所予約
  org_chart.html          # 組織図
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
- **Current work**: Check PROJECT_STATUS.md for latest tasks
