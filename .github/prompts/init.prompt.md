---
agent: ask
description: セッション初期化（PROJECT_STATUS.md の読み込みと確認）
alwaysApply: true
---

## ステップ1: VS Code バージョン確認

`.github/vscode-version.txt` を読んでください。

- **`Auto-updated by vscode-version-recorder extension` という行がある場合**: 拡張機能は正常に動作しています。そのバージョン番号を使用してステップ2へ
- **その行がなく、バージョン番号が記載されている場合**: 拡張機能は未インストールの可能性があります。そのバージョン番号を使用してステップ2へ。その後、ユーザーに確認してください：

  > ⚠️ **vscode-version-recorder 拡張機能が検出されません**  
  > 自動インストールしますか？

  ユーザーが同意した場合、以下のコマンドを順に実行してください：

  ```powershell
  gh release download v0.1.0 --repo freesemt/vscode-version-recorder --pattern "*.vsix" --dir $env:TEMP
  code-insiders --install-extension "$env:TEMP\vscode-version-recorder-0.1.0.vsix"
  ```

  インストール後、**VS Code を再起動**するよう案内してください。

- **バージョン番号未記載またはファイルが存在しない場合**: 以下をユーザーに表示してください：

  > ⚠️ **VS Code バージョンの記録をお願いします**  
  > メニュー → **ヘルプ** → **バージョン情報** → 最初の行の番号（例: `1.114.0-insider`）を  
  > `.github/vscode-version.txt` の末尾に追記してください。

## ステップ2: alwaysApply 対応チェック

取得したバージョンの数値部分（例: `1.114.0` の `1.114`）が **1.99 以上** かどうか判定してください。

- **1.99 以上** → ✅ `alwaysApply: true` が有効です。自動初期化は正常に動作しています。
- **1.99 未満** → ⚠️ `alwaysApply: true` は動作しません。毎回 `/init` を手動実行してください。

## ステップ3: PROJECT_STATUS.md の要約

`PROJECT_STATUS.md` を読んで、以下を日本語で要約してください：

1. **現在のタスク** — 何に取り組んでいるか
2. **直近の進捗** — 最近完了したこと
3. **次のステップ** — 優先度順に

最後に「**初期化完了** (kannondai-community) / VS Code vX.XX.X ✅」と明記してください。
