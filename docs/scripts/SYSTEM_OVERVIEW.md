# 集会所予約状況カレンダー — システム概要

**最終更新**: 2026-07-18

---

## 📌 システムの目的

神南大自治会の集会所予約状況を住民に分かりやすく公開するWebカレンダー。  
外部の予約管理サイト（C-SQR）から毎日自動的にデータを取得し、GitHub Pages上で表示する。

---

## 🧩 システム構成

### 1. データ取得・変換（自動化）

**ファイル**: `docs/scripts/fetch_reservations.py`

**機能**:
- C-SQRサイトにログインし、iCal形式の予約データを取得
- 取得したicsファイルを `docs/scripts/events.ics` として保存
- icsファイルをカレンダー表示用JSON形式に変換し、`docs/scripts/calendar-reservations.json` に保存

**実行環境**: GitHub Actions（毎日15時UTC = 日本時間0時）

**認証情報**: GitHub Secrets（`CSQR_ACCOUNT`, `CSQR_PASSWORD`）

**変換仕様**:
- icsファイルの各イベントを日付ごとに集約
- 時間範囲（例: `09:30 - 12:00`）をキーとして予約内容を格納
- 終日イベントは `"終日"` というキー
- DESCRIPTIONフィールドがあれば SUMMARY と結合して保存
- **信頼境界ベースのマージ**: 
  - 新規データの最古の日付を「信頼境界」として特定
  - 信頼境界より前の既存データのみ保持
  - 信頼境界以降は新規データで完全に置き換え（削除・変更・追加すべて反映）
- **古いデータの自動削除**: 730日（約2年）より古いデータは自動削除

**出力形式** (`calendar-reservations.json`):
```json
{
  "2026-07-18": {
    "09:00 - 12:00": "第二自治会総会資料質疑応接"
  },
  "2026-07-19": {
    "終日": "カフェ"
  }
}
```

---

### 2. GitHub Actions 自動更新

**ファイル**: `.github/workflows/update-reservations.yml`

**トリガー**:
- 定期実行（cron: 毎日15時UTC = 日本時間0時）
- 手動実行（workflow_dispatch）

**処理内容**:
1. リポジトリをチェックアウト
2. Python 3.11をセットアップ
3. 必要なライブラリ（requests, beautifulsoup4）をインストール
4. `fetch_reservations.py` を実行
5. 変更があれば自動コミット・push（GitHub Pagesに反映）

**権限**: `contents: write`

**コミットメッセージ**: "自動更新: 予約データ"

---

### 3. フロントエンド（カレンダー表示）

#### 3.1 HTML (`docs/hall-reserve.html`)

**構成**:
- パスワード保護モーダル（checkpw.js による認証）
- カレンダー本体（`#protected-content` 内）
- ナビゲーションボタン（前月／今日／次月／詳細表示）
- 予約詳細表示エリア（`#reserveDetail`）

**外部リソース**:
- `styles/hall-reserve.css` — カレンダーのスタイル
- `scripts/hall-reserve.js` — カレンダーロジック
- `scripts/japanese-holidays.min.js` — 祝日判定ライブラリ
- `scripts/checkpw.js` — パスワード認証
- `scripts/cache-buster.js` — キャッシュ対策（バージョン管理）

**キャッシュ対策**:
- CSS/JSファイルに `?v=<version>` パラメータを付与
- JSONファイルは動的にキャッシュバスターを生成

#### 3.2 JavaScript (`docs/scripts/hall-reserve.js`)

**主要機能**:
1. **データ取得（2026-08-12更新）**:
   - **初期表示**: 静的JSON（`scripts/calendar-reservations.json`）をフェッチ
     - GASのコールドスタート回避により高速化（0.1〜0.5秒程度）
     - JSONは毎日9:00 JST（GitHub Actions）に自動更新
   - **予約作成・削除後の更新**: GAS API から最新データを取得
     - ユーザーが追加した予約を即座に反映
   - データを `sampleReservations` オブジェクトに格納

2. **カレンダー描画**:
   - 指定年月のカレンダーを動的生成
   - 予約がある日にアイコン表示（簡易表示モード）
   - 祝日判定（`JapaneseHolidays.isHoliday()`）とスタイル適用

3. **アイコン割り当て**:
   - 予約内容のキーワードに応じてアイコンを自動選択
     - "サロン" → 🪑
     - "クラブ" → 🌺
     - "体操" → 👭
     - "カフェ" → 🍵
     - "イベント" → 🎉
     - その他 → ✏️（デフォルト）

4. **表示モード切替**:
   - **簡易表示**（デフォルト）: 日付＋アイコンのみ
   - **詳細表示**: 日付＋予約内容テキスト

5. **日付選択と詳細表示**:
   - 日付セルをクリック → 選択状態（黄色ハイライト）
   - 予約詳細エリアに時間帯と予約内容を表示

6. **ナビゲーション**:
   - 前月／次月ボタン（表示範囲: 過去1年〜未来1年）
   - 今日ボタン（今日の年月に戻り、今日を選択状態にする）

#### 3.3 CSS (`docs/styles/hall-reserve.css`)

**スタイル定義**:
- カレンダーテーブル（レスポンシブ）
- 予約あり日のスタイル（`.reserved` — 青系背景）
- 祝日のスタイル（`.holiday` — 緑系背景）
- 祝日＋予約ありのスタイル（`.holiday-reserved` — グラデーション＋緑枠）
- 選択状態のスタイル（`.selected` — 黄色背景＋オレンジ枠）
- ナビゲーションボタン（青系／オレンジ系）
- 予約詳細エリアのスタイル

---

## 🔐 パスワード保護

**実装方法**: クライアント側JavaScript（`checkpw.js`）によるSHA256ハッシュ比較

**動作**:
1. ページロード時、モーダルでパスワード入力を要求
2. 入力値をSHA256ハッシュ化
3. HTML内に埋め込まれたハッシュ値と比較
4. 一致すれば `#protected-content` を表示、不一致なら再入力

**セキュリティレベル**: 低（クライアント側のみ、ソースコードから解析可能）  
**用途**: 一般公開を避けるための簡易的な制限（完全な認証ではない）

---

## 🛠 運用フロー

### 日次運用（自動）

1. **0時（日本時間）** — GitHub Actions が起動
2. **データ取得** — C-SQRから最新の予約データを取得（過去3ヶ月＋未来分）
3. **データ変換・マージ** — ics → JSON形式に変換し、既存データとマージ
4. **古いデータ削除** — 730日より古いデータを自動削除
5. **コミット・Push** — 変更があればリポジトリに反映
6. **GitHub Pages更新** — 自動デプロイ（数分以内）

**データ蓄積の仕組み**:
- 初回実行時: C-SQRから取得できる範囲（過去3ヶ月程度）のみ
- 2回目以降: C-SQRの取得範囲より前の既存データを保持、取得範囲内は完全に置き換え
- 長期運用により、段階的に過去データが蓄積される（最大2年分）

**削除・変更の反映**:
- C-SQRで予約が削除された場合 → 新規データに含まれないため、自動的に削除される
- 予約内容が変更された場合 → 新規データで上書きされる
- C-SQRの取得範囲（過去3ヶ月程度）については常に最新の状態を反映

### 手動更新

**トリガー方法**:
- GitHub リポジトリページ → Actions → "Update Calendar Reservations" → "Run workflow"

**または**:
```bash
# ローカルで実行（環境変数設定が必要）
export CSQR_ACCOUNT="your_account"
export CSQR_PASSWORD="your_password"
python docs/scripts/fetch_reservations.py
```

---

## 📂 ファイル一覧

### データ・スクリプト
| ファイル | 役割 |
|---------|------|
| `docs/scripts/events.ics` | C-SQRから取得した生のiCalデータ |
| `docs/scripts/calendar-reservations.json` | カレンダー表示用JSON（自動生成） |
| `docs/scripts/fetch_reservations.py` | データ取得・変換スクリプト |
| `.github/workflows/update-reservations.yml` | GitHub Actions 定義 |

### フロントエンド
| ファイル | 役割 |
|---------|------|
| `docs/hall-reserve.html` | カレンダーページ本体 |
| `docs/scripts/hall-reserve.js` | カレンダー表示ロジック |
| `docs/styles/hall-reserve.css` | カレンダースタイル |
| `docs/scripts/japanese-holidays.min.js` | 祝日判定ライブラリ |
| `docs/scripts/checkpw.js` | パスワード認証 |
| `docs/scripts/cache-buster.js` | キャッシュバスター生成 |
| `docs/scripts/core-min.js` | 暗号化ライブラリ（CryptoJS Core） |
| `docs/scripts/sha256-min.js` | SHA256ライブラリ（CryptoJS） |

### ドキュメント
| ファイル | 役割 |
|---------|------|
| `docs/scripts/MEMO.md` | 作業メモ（2025-05-07時点） |
| `docs/scripts/SYSTEM_OVERVIEW.md` | このファイル（システム概要） |

---

## 🔧 カスタマイズポイント

### データ保持期間の変更

`fetch_reservations.py` の `ics_to_custom_json()` 呼び出し時に `keep_days` パラメータを指定:
```python
# 例: 3年分（1095日）保持する場合
ics_to_custom_json(keep_days=1095)
```

### アイコンの変更・追加

`hall-reserve.js` の `getReservationIcon()` 関数を編集:
```javascript
const keywordsToIcons = {
  "サロン": "🪑",
  "クラブ": "🌺",
  "体操": "👭",
  "カフェ": "🍵",
  "イベント": "🎉",
  "新しいキーワード": "🆕", // 追加例
};
```

### スタイルの調整

`hall-reserve.css` を編集:
- `.reserved` — 予約あり日の色
- `.holiday` — 祝日の色
- `.selected` — 選択状態の色

### データ形式の拡張

`fetch_reservations.py` の `ics_to_custom_json()` 関数を編集:
- 現在は `SUMMARY` と `DESCRIPTION` を結合
- 追加フィールド（場所、主催者など）を抽出可能

---

## 🐛 既知の制限・注意事項

1. **パスワード保護は簡易的** — 完全な認証ではない
2. **C-SQR側の仕様変更に依存** — HTML構造変更時は `fetch_reservations.py` の修正が必要
3. **C-SQRからは過去3ヶ月分のみ取得** — 無料プランの制限だが、蓄積機能により段階的に過去データを保持
4. **C-SQRの取得範囲より古いデータの削除は反映されない** — 例: 4ヶ月前の予約が削除されても、C-SQRの取得範囲外（過去3ヶ月）のため、蓄積データには残り続ける。手動でJSONファイルを編集する必要がある
5. **データ保持期限は約2年** — 730日より古いデータは自動削除される（`keep_days` パラメータで変更可能）
6. **タイムゾーン注意** — GitHub Actions は UTC で動作（日本時間との9時間差）
7. **キャッシュ問題** — ブラウザキャッシュが残る場合、スーパーリロード（Ctrl+Shift+R）が必要

---

## 📝 今後の改善候補

- [ ] リアルタイム更新（C-SQR APIがあれば）
- [ ] 予約内容の編集機能（権限管理が必要）
- [ ] 予約状況のiCal配信（ユーザーのカレンダーアプリと同期）
- [ ] スマホ専用UI改善（タッチ操作の最適化）
- [ ] 予約統計表示（利用頻度、人気時間帯など）
- [ ] より強固な認証方式（サーバー側認証）

---

## 🤝 メンテナンス担当者向け情報

### トラブルシューティング

**Q: カレンダーが更新されない**
- GitHub Actions のログを確認（リポジトリ → Actions）
- `fetch_reservations.py` が正常終了しているか
- C-SQR側のログインが成功しているか（環境変数の確認）

**Q: 祝日が表示されない**
- `japanese-holidays.min.js` が正しく読み込まれているか
- ブラウザのコンソールエラーを確認

**Q: パスワードが通らない**
- `hall-reserve.html` 内のハッシュ値が正しいか
- `checkpw.js` が正しく読み込まれているか

### デバッグモード

`fetch_reservations.py` にデバッグオプションを追加可能:
```python
fetch_ics_file(debug=True)
```
→ `schedule_page.html`, `ical_page.html` などを保存してHTML構造を確認

### 手動でのデータ修正

C-SQRの取得範囲より古いデータ（3ヶ月以上前）で削除・訂正が必要な場合は、`docs/scripts/calendar-reservations.json` を直接編集します。

**削除の手順**:
1. `calendar-reservations.json` を開く
2. 該当する日付のエントリを削除（または時間帯のエントリを削除）
3. ファイルを保存してコミット・push

**例**:
```json
{
  "2026-01-15": {
    "09:00 - 12:00": "削除したい予約"  ← このエントリを削除
  }
}
```

---

**関連リンク**:
- [作業メモ (MEMO.md)](MEMO.md)
- [トップページに戻る](../top.html)
- [kannondai-community リポジトリ](https://github.com/kannondai/kannondai-community)
