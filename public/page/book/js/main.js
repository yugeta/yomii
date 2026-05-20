import { Upload }    from "./upload.js"
import { Direction } from "./direction.js"
import { Event }     from "./event.js"
import { Urlinfo }   from "../../../asset/js/lib/urlinfo.js"
import { BookCache } from "../../storage/js/book_cache.js"
import { PCloud }    from "../../storage/js/pcloud.js"

export class Main{
  constructor(){
    new Event()

    const params = new URLSearchParams(location.search)
    const source = params.get("source")

    if(source === "pcloud"){
      this.load_from_pcloud(params)
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
      if(!blob){
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
    if(!name) return

    try{
      const { Load } = await import("../../shelf/js/load.js")
      const folder_handle = await Load.get_local_folder_handle()
      if(!folder_handle){
        alert("ローカルフォルダが設定されていません。マイページで設定してください。")
        return
      }

      const file_handle = await folder_handle.getFileHandle(name)
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
