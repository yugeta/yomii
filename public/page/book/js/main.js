import { Upload }    from "./upload.js"
import { Direction } from "./direction.js"
import { Event }     from "./event.js"
import { Urlinfo }   from "../../../asset/js/lib/urlinfo.js"
import { BookCache } from "../../storage/js/book_cache.js"
import { PCloud }    from "../../storage/js/pcloud.js"
import { PCloudShare } from "../../storage/js/pcloud_share.js"
import { GoogleDriveShare } from "../../storage/js/google_drive_share.js"

export class Main{
  constructor(){
    new Event()

    const params = new URLSearchParams(location.search)
    const source = params.get("source")

    this.set_shelf_link(params, source)

    if(source === "pcloud"){
      this.load_from_pcloud(params)
    }else if(source === "pcloud_share"){
      this.load_from_pcloud_share(params)
    }else if(source === "google_drive_share"){
      this.load_from_google_drive_share(params)
    }else if(source === "google_drive"){
      this.load_from_google_drive(params)
    }else if(source === "cache"){
      this.load_from_cache(params)
    }else if(source === "local"){
      this.load_from_local(params)
    }else if(source === "sample"){
      this.load_from_sample(params)
    }else{
      // 従来の方式（ファイル選択 or サーバーからのダウンロード）
      new Upload({
        callback : (()=>new Direction())
      })
    }
  }

  /**
   * pCloud から書籍を読み込む（IndexedDB キャッシュ経由）
   */
  async load_from_pcloud(params){
    const path = params.get("path")
    const name = params.get("book") || "book"

    if(!path){
      console.error("pCloud path が指定されていません")
      return
    }

    try{
      const blob = await BookCache.get_or_download(path, name, async () => {
        return await PCloud.download_file(path)
      })

      const file = new File([blob], name, { type: "application/zip" })
      new Upload({ target: { files: [file] } })
      new Direction()
    }catch(e){
      console.error("pCloud book load error:", e)
      alert(`書籍の読み込みに失敗しました: ${e.message}`)
    }
  }

  /**
   * pCloud 公開リンクから書籍を読み込む（IndexedDB キャッシュ経由）
   */
  async load_from_pcloud_share(params){
    const code   = params.get("code")
    const fileid = params.get("fileid")
    const name   = params.get("book") || "book"

    if(!code || !fileid){
      console.error("pCloud share: code または fileid が指定されていません")
      alert("共有リンクの情報が不足しています。")
      return
    }

    try{
      const source_path = `pcloud_share://${code}/${fileid}`
      const blob = await BookCache.get_or_download(source_path, name, async () => {
        return await PCloudShare.download_file(code, fileid)
      })
      const file = new File([blob], name, { type: "application/zip" })
      new Upload({ target: { files: [file] } })
      new Direction()
    }catch(e){
      console.error("pCloud share book load error:", e)
      alert(`書籍の読み込みに失敗しました: ${e.message}`)
    }
  }

  /**
   * Google Drive 共有フォルダから書籍を読み込む（認証不要）
   */
  async load_from_google_drive_share(params){
    const file_id = params.get("file_id")
    const name    = params.get("book") || "book"

    if(!file_id){
      console.error("Google Drive share: file_id が指定されていません")
      alert("ファイル情報が不足しています。")
      return
    }

    try{
      const source_path = `google_drive_share://${file_id}`
      const blob = await BookCache.get_or_download(source_path, name, async () => {
        return await GoogleDriveShare.download_file(file_id)
      })
      const file = new File([blob], name, { type: "application/zip" })
      new Upload({ target: { files: [file] } })
      new Direction()
    }catch(e){
      console.error("Google Drive share book load error:", e)
      alert(`書籍の読み込みに失敗しました: ${e.message}`)
    }
  }

  /**
   * Google Drive（OAuth認証済み）から書籍を読み込む
   */
  async load_from_google_drive(params){
    const file_id = params.get("file_id")
    const name    = params.get("book") || "book"

    if(!file_id){
      console.error("Google Drive: file_id が指定されていません")
      return
    }

    try{
      const source_path = `google_drive://${file_id}`
      const { GoogleDrive } = await import("../../storage/js/google_drive.js")
      const blob = await BookCache.get_or_download(source_path, name, async () => {
        return await GoogleDrive.download_file(file_id)
      })
      const file = new File([blob], name, { type: "application/zip" })
      new Upload({ target: { files: [file] } })
      new Direction()
    }catch(e){
      console.error("Google Drive book load error:", e)
      alert(`書籍の読み込みに失敗しました: ${e.message}`)
    }
  }

  /**
   * IndexedDB キャッシュから書籍を読み込む
   */
  async load_from_cache(params){
    const source_path = params.get("path")
    const name = params.get("book") || "book"

    if(!source_path){
      console.error("cache path が指定されていません")
      return
    }

    try{
      const meta = await BookCache.get_meta(source_path)
      if(!meta){
        // 旧ID形式でも試す
        const legacy_id = BookCache.generate_id_legacy(source_path)
        const legacy_blob = await BookCache.get_data(legacy_id)
        if(legacy_blob && legacy_blob.size > 0){
          // 旧形式から新形式にマイグレーション
          await BookCache.remove(legacy_id)
          await BookCache.save(source_path, name, legacy_blob)
          const file = new File([legacy_blob], name, { type: "application/zip" })
          new Upload({ target: { files: [file] } })
          new Direction()
          return
        }

        alert("キャッシュが見つかりません。pCloud から再ダウンロードします。")
        const blob = await BookCache.get_or_download(source_path, name, async () => {
          return await PCloud.download_file(source_path)
        })
        const file = new File([blob], name, { type: "application/zip" })
        new Upload({ target: { files: [file] } })
        new Direction()
        return
      }

      const blob = await BookCache.get_data(meta.id)
      if(!blob || blob.size === 0){
        alert("キャッシュデータが破損しています。再ダウンロードします。")
        await BookCache.remove(meta.id)
        const new_blob = await BookCache.get_or_download(source_path, name, async () => {
          return await PCloud.download_file(source_path)
        })
        const file = new File([new_blob], name, { type: "application/zip" })
        new Upload({ target: { files: [file] } })
        new Direction()
        return
      }

      await BookCache.touch(source_path)
      const file = new File([blob], name, { type: "application/zip" })
      new Upload({ target: { files: [file] } })
      new Direction()
    }catch(e){
      console.error("Cache book load error:", e)
      alert(`書籍の読み込みに失敗しました: ${e.message}`)
    }
  }

  /**
   * ローカルフォルダから書籍を読み込む（File System Access API）
   */
  async load_from_local(params){
    const name = params.get("book") || ""
    const dir = params.get("dir") || ""
    if(!name) return

    try{
      const { Load } = await import("../../shelf/js/load.js")
      const folder_handle = await Load.get_local_folder_handle()
      if(!folder_handle){
        alert("ローカルフォルダが設定されていません。マイページで設定してください。")
        return
      }

      // サブフォルダに潜る
      let target_handle = folder_handle
      if(dir){
        const segments = dir.split("/").filter(s => s)
        for(const segment of segments){
          target_handle = await target_handle.getDirectoryHandle(segment)
        }
      }

      const file_handle = await target_handle.getFileHandle(name)
      const file = await file_handle.getFile()

      new Upload({ target: { files: [file] } })
      new Direction()
    }catch(e){
      console.error("Local book load error:", e)
      alert(`書籍の読み込みに失敗しました: ${e.message}`)
    }
  }

  /**
   * サンプル書籍を読み込む（サーバーから fetch）
   */
  async load_from_sample(params){
    const name = params.get("book") || ""
    const dir = params.get("dir") || ""
    if(!name) return

    const path = dir ? `data/shelf/${dir}/${name}` : `data/shelf/${name}`

    try{
      const response = await fetch(path)
      if(!response.ok){
        throw new Error(`HTTP ${response.status}`)
      }
      const blob = await response.blob()
      const file = new File([blob], name, { type: "application/zip" })

      new Upload({ target: { files: [file] } })
      new Direction()
    }catch(e){
      console.error("Sample book load error:", e)
      alert(`サンプル書籍の読み込みに失敗しました: ${e.message}`)
    }
  }

  static data = null
  static mime      = "image/webp"
  static page_name = new Urlinfo().queries.p || "index"

  /**
   * 本棚リンクを設定（現在の本と同じソース・ディレクトリに戻る）
   */
  set_shelf_link(params, source){
    const link = document.getElementById("shelf-link")
    if(!link) return

    if(!source){
      // ソース不明の場合はデフォルトの本棚リンク
      return
    }

    const shelf_params = new URLSearchParams()
    shelf_params.set("p", "shelf")

    const source_id = params.get("source_id") || ""

    // 動的タブから来た場合は動的ソースとして本棚に戻る
    if(source_id){
      shelf_params.set("source", `dynamic_pcloud_share`)
      shelf_params.set("source_id", source_id)
    }else{
      shelf_params.set("source", source)
    }

    // パスからディレクトリを抽出
    const path = params.get("path") || ""
    const dir = params.get("dir") || ""
    const book = params.get("book") || ""
    const code = params.get("code") || ""

    if(code && !source_id){
      // 直接共有リンクの場合は code を引き継ぐ
      shelf_params.set("code", code)
    }

    // pCloud 共有リンクのサブフォルダ位置を引き継ぐ
    const folderid = params.get("folderid") || ""
    if(folderid){
      shelf_params.set("folderid", folderid)
    }

    if(dir){
      // sample ソースの場合は dir パラメータがそのまま使える
      shelf_params.set("dir", dir)
    }else if(path){
      // pCloud / cache の場合はパスからディレクトリを抽出
      // 例: /yomii/dir1/dir2/book.yomii → dir1/dir2
      const path_parts = path.replace(/^\/yomii\//, "").split("/")
      path_parts.pop() // ファイル名を除去
      if(path_parts.length > 0 && path_parts[0] !== ""){
        shelf_params.set("dir", path_parts.join("/"))
      }
    }

    // 直前に読んでいた本の名前を渡す（本棚でハイライト用）
    if(book){
      shelf_params.set("current", book)
    }

    link.href = `./?${shelf_params.toString()}`
  }
}

switch(document.readyState){
  case "complete":
  case "interactive":
    new Main()
    break
  default:
    window.addEventListener("DOMContentLoaded" , (()=>new Main()))
    break
}
