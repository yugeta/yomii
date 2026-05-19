// import { Common }  from './common.js'
import { Info }    from './info.js'
import { Data }    from './data.js'
import { Img }     from '../../book/js/img.js'
import { Zip }     from '../../book/js/zip.js'

export class Upload{
  constructor(options){
    this.options = options || {}
    this.set_event()
  }
  data = null

  static elm_input_upload = document.querySelector(`input[type="file"][name="book"]`)

  set_event(){
    if(Upload.elm_input_upload){
      Upload.elm_input_upload.addEventListener("change" , this.book_up.bind(this))
    }
  }

  // book_up(e){
  //   const filepath = e.target.value
  //   const file = e.target.files[0]
  //   const fileReader = new FileReader()
  //   fileReader.onload = (ev => {
  //       const data = new Uint8Array(ev.target.result)
  //       // ZIPファイル判定（先頭2バイトが "PK" = 0x50, 0x4B）
  //       if(data[0] === 0x50 && data[1] === 0x4B){
  //           // ZIP形式 → Zlib.js で展開して中の設定JSONを取得
  //           const unzip = new Zlib.Unzip(data)
  //           const filenames = unzip.getFilenames()
  //           // setting.json または ___setting.json を探す
  //           const settingFile = filenames.find(f => f.includes('setting.json'))
  //           if(settingFile){
  //               const buf = unzip.decompress(settingFile)
  //               const json = new TextDecoder().decode(buf)
  //               Data.data = JSON.parse(json)
  //           }
  //       } else {
  //           // JSON形式（従来の処理）
  //           const json = new TextDecoder().decode(data)
  //           Data.data = JSON.parse(json)
  //       }
  //       Data.data.filepath = filepath
  //       this.loaded_image(Data.data)
  //   })
  //   fileReader.readAsArrayBuffer(file)
  // }

  book_up(e){
    const filepath = e.target.value
    const fileReader = new FileReader();
    fileReader.onload = (e => {
      console.log(e)
			const json = e.target.result
      Data.data = JSON.parse(json)
      Data.data.filepath = filepath
      // new Img({
      //   data     : Data.data,
      //   callback : this.loaded_image.bind(this)
      // })
      this.loaded_image(Data.data)
		})
		fileReader.readAsText(e.target.files[0])
  }

  loaded_image_from_zip(images, filepath){
    // Zip が展開した画像配列を edit 用の Data に格納
    Data.data = { filepath, images }
    Data.pages = images
    Info.clear()
    this.finish()
  }

  loaded_image(datas){
    Data.pages = datas
    Info.clear()
    this.finish()
  }

  finish(){
    if(this.options.callback){
      this.options.callback()
    }
  }
}