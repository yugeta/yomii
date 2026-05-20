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
      // キャッシュ or ダウンロード
      const blob = await BookCache.get_or_download(path, name, async () => {
        return await PCloud.download_file(path)
      })

      // Blob を File オブジェクトに変換して Upload に渡す
      const file = new File([blob], name, { type: "application/zip" })
      
      // Upload クラスに渡すためのイベントオブジェクトを模擬
      new Upload({
        target: { files: [file] }
      })
      new Direction()
    }catch(e){
      console.error("pCloud book load error:", e)
      alert(`書籍の読み込みに失敗しました: ${e.message}`)
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
