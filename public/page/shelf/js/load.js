import { PCloud } from "../../storage/js/pcloud.js"

export class Load{
  constructor(options){
    this.options = options || {}
    this.source = this.options.source || "local"

    switch(this.source){
      case "pcloud":
        this.load_pcloud()
        break
      case "local":
      default:
        this.load_local()
        break
    }
  }

  // ローカルサーバーからファイル一覧を取得
  load_local(){
    const query = {
      mode : 'lists',
      dir  : this.options.dir,
    }
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true;
    xhr.open('POST' , 'page/shelf/php/main.php' , true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = this.loaded_local.bind(this)
    const query_string = Object.entries(query).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
    xhr.send(query_string)
  }

  loaded_local(e){
    if(!e || !e.target || !e.target.response){return}
    const res = JSON.parse(e.target.response)
    this.datas = res.lists
    this.finish()
  }

  // pCloud からファイル一覧を取得
  async load_pcloud(){
    if(!PCloud.is_authenticated()){
      this.datas = []
      this.error_message = "pCloud が連携されていません。マイページで設定してください。"
      this.finish()
      return
    }

    try{
      // URLSearchParams で正しくデコード
      const params = new URLSearchParams(location.search)
      const raw_dir = params.get("dir") || ""
      const dir = raw_dir ? `/yomii/${raw_dir}/` : "/yomii/"
      console.log("pCloud list path:", dir)
      
      const files = await PCloud.list_files_path(dir)
      
      this.datas = files.map(file => ({
        type : file.is_folder ? "dir" : "file",
        name : file.name,
        size : file.size,
        modified : file.modified,
      }))
      this.finish()
    }catch(e){
      console.error("pCloud list error:", e)
      this.datas = []
      this.error_message = e.message
      this.finish()
    }
  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}
