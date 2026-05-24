/**
 * Google Drive 共有フォルダ（読み取り専用）
 * 
 * 公開共有フォルダのIDを使って、認証なしでファイル一覧・ダウンロードを行う。
 * PHP プロキシ（google_drive_share.php）経由でアクセスする。
 * 
 * 使い方:
 *   URL: ?p=shelf&source=google_drive_share&folder_id=XXXXXX
 *   または動的ソースとして追加ダイアログから登録
 * 
 * ユーザー設定手順:
 *   1. Google Drive でフォルダを「リンクを知っている全員」に共有
 *   2. 共有リンク URL を Yomii の「+」ボタンから登録
 *   3. 認証不要で書籍一覧・閲覧が可能
 */
import { Loading } from "../../../asset/js/loading/loading.js"

export class GoogleDriveShare{

  static PROXY_URL = "page/storage/php/google_drive_share.php"

  /**
   * 共有フォルダ内のファイル一覧を取得
   * @param {string} folder_id - Google Drive フォルダ ID
   * @returns {{result: string, files: Array}}
   */
  static async list_files(folder_id){
    if(!folder_id){
      throw new Error("フォルダIDが指定されていません。")
    }

    const response = await fetch(GoogleDriveShare.PROXY_URL + "?action=list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id }),
    })

    const data = await response.json()
    if(data.result === "error"){
      throw new Error(data.message)
    }
    return data
  }

  /**
   * ファイルをダウンロード（Blob として返す）
   * @param {string} file_id - Google Drive ファイル ID
   * @returns {Blob}
   */
  static async download_file(file_id){
    if(!file_id){
      throw new Error("ファイルIDが必要です。")
    }

    new Loading({ type: "plane" })
    Loading.set_status("active")
    Loading.set_rate(10)

    try{
      const response = await fetch(GoogleDriveShare.PROXY_URL + "?action=download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id }),
      })

      Loading.set_rate(50)

      // エラーチェック（JSON が返ってきた場合はエラー）
      const content_type = response.headers.get("content-type") || ""
      if(content_type.includes("application/json")){
        const data = await response.json()
        Loading.set_status("passive")
        throw new Error(data.message || "ダウンロードに失敗しました")
      }

      const blob = await response.blob()
      Loading.set_rate(100)
      requestAnimationFrame(() => Loading.set_status("passive"))
      return blob
    }catch(e){
      Loading.set_status("passive")
      throw e
    }
  }

  /**
   * Google Drive 共有リンク URL からフォルダ ID を抽出
   * 対応形式:
   *   https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
   *   https://drive.google.com/drive/folders/FOLDER_ID
   *   https://drive.google.com/drive/u/0/folders/FOLDER_ID
   *   直接フォルダ ID を入力した場合もそのまま返す
   * @param {string} url_or_id - URL またはフォルダ ID
   * @returns {string|null} フォルダ ID or null
   */
  static extract_folder_id(url_or_id){
    if(!url_or_id) return null

    const trimmed = url_or_id.trim()

    // URL 形式: /folders/XXXXX を抽出
    const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    if(match){
      return match[1]
    }

    // フォルダ ID 直接入力（英数字・ハイフン・アンダースコアのみ）
    if(/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length > 10){
      return trimmed
    }

    return null
  }
}
