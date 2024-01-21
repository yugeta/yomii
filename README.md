Yomii（ヨミー）
===
```
Create : 2023.10.15
Author : Yugeta.Koji
```

# Summary
- スキャンした書籍を読むためのwebサービス。


# Thinks
- webアクセスするだけで、ローカルに保存しているbookを読めるブックリーダー
- ローカルデータは、一度サーバーのデータ変換機能を通す必要がある。
- ストレージレンタル機能（有料）
- electronを使って、サーバーアクセスをしなくてもリーダー機能ができるアプリも検討（web版完成後に作成予定）
  - nodejsでサーバー処理ができるようになると、electronのみでブック変換もできるようになる。
- 対象フォーマット
  - pdf
  - zip
  - フォルダに入ったjpeg,png,gif,webpのweb画像ファイル
  * 以下要検討
  - rar?などの他圧縮ファイルは別途検討
  - epub形式の検討


# Specs
- 以下の仕組みによりシステム構築を行う。
1. データ(book)保持用のサーバー（ファイルサーバーでも可）
  - サーバーからアクセスできるサービスであれば、webストレージなども利用可能
2. データを読み込んで1枚ごとのページに分割するサーバー機能
  - zip,pdfなどを、jpeg or webpに変換する。
  - サイズなども柔軟に対応できる変換システム。
  - jsonにかためてダウンロードできる仕様（base64変換）
3. ブックリーダー機能
  - データサーバーを通して取得したbookページデータを表示する
  - データ保持しているbookを一覧表示する
  - リード履歴などをロギング
  - 見開き表示(PCのみ)
  - ページめくり機能
  - ページ一覧表示機能（サムネイル）
  - メモ書き機能（ページ毎と、book毎）
  - ページ単位の落書き機能
  - しおり機能
  - 評価機能
  - 読後感をsnsにツィート機能
  - ログイン機能(Google OAuth)


# URL
- https://book.myntinc.com

# Docker
- php+ubuntuコマンドを使うので、独自のdocker-composeを実行して開発環境を構築する。
```
# 実行手順
cd docker
docker-compose up -d
```

# Start-up
> cd docker
> docker-compose up -d
- http://localhost:8001/


# Plugin
- TCPDF
> git clone https://github.com/tecnickcom/TCPDF

- FPDI
> git clone https://github.com/Setasign/FPDI.git

# composer
> composer update


# Upload(convert)
- 使っているPCやスマホなどからのzipやpdfファイルをアップロードして、jsonデータ(yomi)を取得する。
- web上にあるURLを指定して、jsonデータ(yomi)を取得する。
- 任意のオープンストレージ（API等）にアクセス（ログイン）をして、jsonデータ(yomi)を取得する。

- 取得したjsonデータはローカルに保存しておくか、サーバーにプール（有料）することが選択できる。

# Data
- 変換前のbookデータ(zipやpdf)ファイルをサーバーにプールしておくことができる（有料）
- 変換後のjsonデータをサーバープールしてある場合、1ページずつの画像データをブラウザで読むことができる。（軽量でスピードが早い）
- 無料で使い続けたければ、ローカルjsonデータがオススメ。

# FUnction
- Page rate change : Landscape（横長）: 見開き , Portrait（縦長）: 単一ページ
- Reading-page : 対象書籍の読みかけページの保存(localStorage)

# install
- plugins
> git clone git@github.com:imaya/zlib.js.git

