
export class Common{
  static php_book      = "book.php"
  static form_upload   = document.forms.upload
  static button_upload = document.querySelector(`button[name="upload"]`)
  static input_file    = document.querySelector(`input[type="file"][name="book"]`)
  static img_area      = document.querySelector(".pages")
  static download_area = document.querySelector(".control .download")
  static download_ext  = "yomii"
  static button_save   = document.querySelector(`button.save`)
  static elm_direction = document.getElementById("direction")
  
  // 画像の最大サイズ（縦横兼用）
  static max_size      = 1500

  // yomiiファイルに格納する設定ファイル
  static setting_file  = "___setting.json"
  // 設定ファイルのデータ格納用
  static setting_data  = {}

  // 読み込んだファイルのデータ
  static file_info = {
    filename  : null,
    name      : null,
    dimension : null,
    singles   : [],
    deletes   : [],
  }

  // 読み込んだ画像データ
  static images = []

  static adjust_size(size){
    switch(size.w > size.h){
      // landscape
      case true:
        if(size.w <= Common.max_size){return size}
        return {
          w : Common.max_size,
          h : ~~(size.h * (Common.max_size / size.w)),
        }

      // horizon
      case  false:
        if(size.h <= Common.max_size){return size}
        return {
          w : ~~(size.w * (Common.max_size / size.h)),
          h : Common.max_size,
        }
      break
    }
  }

  static get_file_ext(filename){
    if(!filename){return}
    const sp = filename.split(".")
    return sp.pop()
  }

  static set_file_info(datas){
    for(const key in Common.file_info){
      Common.file_info[key] = datas[key] !== undefined ? datas[key] : Common.file_info[key]
    }
  }

  static init(){
    Common.file_info = {
      filename  : null,
      name      : null,
      dimension : null,
      singles   : [],
      deletes   : [],
    }
    Common.setting_data = {}
    Common.images = []
  }
}
