import { Common } from "./common.js"

export class Data{
  static data         = null
  static file_info    = {}
  static images       = []
  // static groups       = []
  static pages        = []
  static group_num    = 0
  static page_num     = 0
  static page_sub     = null
  static book_name    = null
  static duration     = 300
  static list_height  = 100
  static dimension    = Common.dimension
  static is_scroll    = null
  static flg_resize   = null
  static storage_name = "yomii"
  static mime         = "image/webp"

  // yomiiファイルに格納する設定ファイル
  static setting_file  = "___setting.json"

  constructor(){
   this.init()
  }
  init(){
    const data = Data.load()
    if(!data){return}
    if(data.page){
      Data.page_num = data.page
    }
    if(data.group){
      Data.group_num = data.group
    }
  }

  static save(){
    const book_data = {
      name  : Data.book_name,
      page  : Data.page_num,
      group : Data.group_num,
    }
    const datas = Data.load_all() || []
    const index = datas.findIndex(e => e.name === Data.book_name)
    if(index === -1){
      datas.push(book_data)
    }
    else{
      datas[index] = book_data
    }
    const json = btoa(encodeURIComponent(JSON.stringify(datas)))
    window.localStorage.setItem(Data.storage_name , json)
  }
  static load(){
    const datas = Data.load_all()
    return datas.find(e => e.name === Data.book_name)
  }
  static load_all(){
    const str  = window.localStorage.getItem(Data.storage_name)
    return str ? JSON.parse(decodeURIComponent(atob(str))) : []
  }


  static get_name(){
    return Data.book_name
  }
  static set_name(){
    console.log(Data.data)
    const sp =  Data.data.filepath.split("\\")
    const name = sp.pop()
    const sp2 = name.split(".")
    sp2.pop()
    Data.book_name = sp2.join(".")
  }

  static get_file_ext(filename){
    if(!filename){return}
    const sp = filename.split(".")
    return sp.pop()
  }

  static get groups(){
    return Object.values(Data.pages.reduce((acc, obj) => {
      acc[obj.group_id] = acc[obj.group_id] || [];
      acc[obj.group_id].push(obj.page_id);
      return acc;
    }, {}));
  }
}

