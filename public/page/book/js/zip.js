import { Data }     from "./data.js"
import { Info }     from "./info.js"
import { Element }  from "./element.js"
import { Loading }  from "../../../asset/js/loading/loading.js"

export class Zip{
  images = []
  
  constructor(zip_file){
    new Loading({
      type : "plane"
    })
    Loading.set_status('active')
    this.promise = new Promise((resolve , reject) => {
      this.resolve = resolve
      this.reject  = reject
      const fileReader  = new FileReader();
      fileReader.onload = this.set_images.bind(this)
      fileReader.readAsArrayBuffer(zip_file)
    })
  }

  async set_images(e){
    const data = e.target.result
    const zipArr = new Uint8Array(data);
    const unzip = new Zlib.Unzip(zipArr);
    const filenames = unzip.getFilenames();
    const pages = []
    
    // setting
    for(const filename of filenames){
      const ext = Data.get_file_ext(filename)
      let type = null

      // settingファイル
      if(filename === Data.setting_file){
        type = "setting"
        Data.file_info = this.setting_load(unzip)
      }

      // imageファイル
      else if(this.target_ext.indexOf(ext) !== -1){
        type = "image"
      }
      else {continue}

      pages.push({
        filename : filename,
        ext  : ext,
        type : type
      })
    }
    const datas     = pages.filter(e => e.type === "image")
    this.page_count = datas.length
    

    // pages
    for(let i=0; i<datas.length; i++){
      Loading.set_rate((i+1) / this.page_count * 100)
      const data = datas[i]
      const filename = data.filename
      const ext = Data.get_file_ext(filename)
      const imageUrl = this.file2image(unzip, filename)
      if(!imageUrl){continue}
      const img = await this.get_image(imageUrl, ext)
      if(!img){continue}
      this.images.push(img)
    }
    this.finish()
  }

  target_ext = [
    "jpg",
    "jpg",
    "png",
    "gif",
    "bmp",
    "webp",
  ]

  async get_image(imgUrl, ext){
    let img = await this.create_image(imgUrl)
    if(ext === "webp"){return img}
    const canvas = await this.create_canvas(img)
    const newUrl = this.canvas2img(canvas)
    return await this.create_image(newUrl)
  }

  file2image(unzip, filename){
    const uint8array = unzip.decompress(filename)
    const blob = new Blob([uint8array], {type: Data.mime})
    return URL.createObjectURL(blob)
  }

  async create_image(data){
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = data
      img.onload  = (e => resolve(e.target))
      img.onerror = (e => resolve(null)) // 画像じゃない場合は、nullを返す
    })
  }

  async create_canvas(img){
    const canvas   = document.createElement("canvas")
    const w        = img.naturalWidth
    const h        = img.naturalHeight
    canvas.width   = w
    canvas.height  = h
    canvas.getContext("2d").drawImage(img, 0, 0, w, h)
    return canvas
  }

  canvas2img(canvas){
    const base64 = canvas.toDataURL(Data.mime)
    const tmp    = base64.split(",")
    const bin    = atob(tmp[1])
    const mime   = tmp[0].split(':')[1].split(';')[0]
    const buf    = new Uint8Array(bin.length)
    for(let i=0; i<bin.length; i++){
      buf[i]  = bin.charCodeAt(i)
    }
    const blob   = new Blob([buf], {type: mime})
    return URL.createObjectURL(blob)
  }

  finish(){
    Loading.set_status('passive')
    this.resolve(this.images)
  }

  // 設定ファイルのデータload
  setting_load(unzip){
    const buf = unzip.decompress(Data.setting_file)
    const txt = new TextDecoder().decode(buf)
    const datas = JSON.parse(txt)
    new Info(datas)
    // direction
    if(datas.direction !== undefined){
      Element.direction.checked = datas.direction === "right" ? false : true
    }
    return datas
  }
}