# JARVIS

軽貨物運送事業向けの統括AI / 業務管理アプリです。

## Production entry

- GitHub Pages launcher: `index.html`
- Desktop UI: `desktop.html`
- Mobile / iPhone UI: `mobile.html`
- Full management UI: `v7.html`
- Current launcher version: **V7.0.19**

## Generative AI

ブラウザにOpenAI APIキーは保存しません。
JARVISの会話はCloudflare Workerを経由してサーバー側からOpenAI Responses APIへ接続します。

- Worker base: `https://jarvis-api.t-ups2024.workers.dev`
- Chat endpoint: `/api/chat`
- Browser bridge: `jarvis-openai-chat.js`
- Worker handler source: `cloudflare/jarvis-chat-handler.js`
- OpenAI key: Worker Secret `OPENAI_API_KEY`
- Default model: `gpt-5.6-terra`（`OPENAI_MODEL`で上書き可）

## Important operational rule

既存のシフト・配送管理ルートを壊さないことを最優先とします。
Workerへチャット機能を統合するときは `/api/chat` を追加し、既存の `/shift`、`/shift/save`、`/delivery`、`/delivery/save` などの処理を維持してください。

## Data / UI policy

- Googleスプレッドシート正本を優先
- シフトと配送管理表の整合を優先
- 金額・数式・重複・前月残骸を検査
- 外部送信、公開、単価変更、請求・支払確定、契約、不可逆削除は管理者承認後に実行

Last synced: 2026-09-07 (JST)
