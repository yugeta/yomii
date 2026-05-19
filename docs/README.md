# Yomii（ヨミー） プロジェクトドキュメント

```
Create : 2023.10.15
Author : Yugeta.Koji
```

## 概要

Yomii（ヨミー）は、スキャンした書籍やPDFファイルをブラウザ上で快適に閲覧するためのWebベースのブックリーダーサービスです。

ユーザーはPDF・ZIP・画像ファイルをアップロードし、サーバー側でWebP画像に変換した後、独自フォーマット（`.yomii`）として保存・閲覧できます。

### 主な特徴

- ブラウザだけで動作するブックリーダー
- PDF / ZIP / 画像フォルダに対応
- 見開き表示（横長画面）と単ページ表示（縦長画面）の自動切替
- 右綴じ / 左綴じの読み方向切替
- 読みかけページの自動保存（localStorage）
- サーバーサイドでのファイル変換（WebP圧縮）

### URL

- 本番: https://book.myntinc.com
- ローカル開発: http://localhost:8001/

---

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| [architecture.md](./architecture.md) | システムアーキテクチャ |
| [frontend.md](./frontend.md) | フロントエンド構成 |
| [backend.md](./backend.md) | バックエンド構成 |
| [docker.md](./docker.md) | Docker環境構築 |
| [data-format.md](./data-format.md) | データフォーマット仕様 |
| [improvements.md](./improvements.md) | 改善点・課題一覧 |
| [storage-strategy.md](./storage-strategy.md) | 書籍ストレージ戦略の検討 |
| [legal-risk.md](./legal-risk.md) | 著作権リスクと対策 |
| [monetization.md](./monetization.md) | マネタイズ計画（有料ストレージ / Stripe） |
| [sync-strategy.md](./sync-strategy.md) | 端末・Webストレージ同期戦略 |
