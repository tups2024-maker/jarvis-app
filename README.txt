JARVIS V4.6 シフト表・配送管理Excel統合版

追加:
・シフト表ページ（日付×ドライバー、クリック編集、保存、CSV出力）
・配送管理表Excelページ
  - 既存 .xlsx/.xls を読み込み
  - シート切替
  - セル編集
  - IndexedDBへ端末保存
  - 編集版 .xlsx を再ダウンロード
・JARVISチャットで「今日の活動報告」「シフト表を開いて」「配送管理表を見せて」に対応
・V4.5の活動報告、エリア別出勤、ドライバー稼働日数、売上/粗利等を維持

注意:
Excel読込/出力にはSheetJS CDNを利用するため、初回はインターネット接続が必要です。
GitHubへ index.html / app.js / style.css / sw.js / manifest.json / jarvis-v4-data.json を上書きして Commit changes。
