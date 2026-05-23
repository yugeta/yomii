/**
 * pCloud 公開リンク共有
 * 
 * 公開フォルダリンクのコードを使って、認証なしでファイル一覧・ダウンロードを行う。
 * PHP プロキシ（pcloud_publink.php）経由でアクセスする。
 * 
 * 使い方:
 *   URL: ?p=shelf&source=pcloud_share&code=XXXXXX
 */
import { Loading } from "../../../asset/js/loading/loading.js"

export class PCloudShare{

  static PROXY_URL = "page/storage/php/pcloud_publink.php"

  /**
   * 公開リンクコードからファイル一覧を取得
   * @param {string} code - 公開リンクコード
   * @param {string|number} [folderid] - サブフォルダID（省略時はルート）
   */
  static async list_files(code, folderid){
    if(!code){
      throw new Error("公開リンクコードが指定されていません。")
    }

    const body = { code }
    if(folderid){
      body.folderid = folderid
    }

    const response = await fetch(PCloudShare.PROXY_URL + "?action=list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if(data.result === "error"){
      throw new Error(data.message)
    }
    return data
  }

  /**
   * 公開リンクからファイルをダウンロード（Blob として返す）
   */
  static async download_file(code, fileid){
    if(!code || !fileid){
      throw new Error("code と fileid が必要です。")
    }

    new Loading({ type: "plane" })
    Loading.set_status('active')
    Loading.set_rate(10)

    try{
      const response = await fetch(PCloudShare.PROXY_URL + "?action=download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, fileid }),
      })

      Loading.set_rate(50)

      // エラーチェック（JSON が返ってきた場合はエラー）
      const content_type = response.headers.get("content-type") || ""
      if(content_type.includes("application/json")){
        const data = await response.json()
        Loading.set_status('passive')
        throw new Error(data.message || "ダウンロードに失敗しました")
      }

      const blob = await response.blob()
      Loading.set_rate(100)
      requestAnimationFrame(() => Loading.set_status('passive'))
      return blob
    }catch(e){
      Loading.set_status('passive')
      throw e
    }
  }
}
