import { Common }   from "./common.js"
import { Data }     from "./data.js"
import { Info }     from "./info.js"
import { Element }  from "./element.js"
import { Img }      from "./img.js"
// import { Loading } from "./loading.js"

export class Zip{
  constructor(zip_file, callback){
    this.callback = callback || null
    Data.file_info = new Info(zip_file)
    // Common.set_file_info(new Info(zip_file))
    const fileReader  = new FileReader();
    fileReader.onload = this.set_images.bind(this)
    fileReader.readAsArrayBuffer(zip_file)
  }

  async set_images(e){
    const data = e.target.result
    const zipArr = new Uint8Array(data);
    const unzip = new Zlib.Unzip(zipArr);
    const filenames = unzip.getFilenames();
    let page_count = 0
    
    // setting
    for(const filename of filenames){
      // settingファイル
      if(filename === Data.setting_file){
        Data.file_info = this.setting_load(unzip)
      }

      // imageファイル
      const ext = Data.get_file_ext(filename)
      if(this.is_image_ext(ext)){
        page_count++
        // console.log("- "+filename)
        continue
      }
    }

    // new Loading({
    //   page_count: page_count,
    // })

    // pages
    let img
    let num = 0
    for(const filename of filenames){
      const ext = Data.get_file_ext(filename)
      if(!this.is_image_ext(ext)){continue}
      const imageUrl = this.file2image(unzip, filename)
      if(!imageUrl){continue}
      img = await this.create_image(imageUrl)
      if(!img){continue}

      // Loading.set_active(num)

      if(ext !== "webp"
      || img.naturalWidth > Common.max_size
      || img.naturalHeight > Common.max_size){
        const canvas   = await this.create_canvas(img)
        const img2Url  = this.canvas2img(canvas)
        img            = await this.create_image(img2Url)
      }
      Data.images.push(new Img(img, num))
      
      // console.log("+ "+ filename)
      num++
    }
    this.finish()
  }

  is_image_ext(ext){
    switch(ext.toLowerCase()){
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "webp":
        return true
    }
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
    const size     = Common.adjust_size({
      w : img.naturalWidth,
      h : img.naturalHeight,
    })
    canvas.width   = size.w
    canvas.height  = size.h
    const ctx = canvas.getContext('2d')
    canvas.getContext("2d").drawImage(img, 0, 0, size.w, size.h)
    return canvas
  }

  canvas2img(canvas){
    const base64 = canvas.toDataURL(Data.mime)
    const tmp    = base64.split(",")
    const bin    = atob(tmp[1])
    const mime   = tmp[0].split(':')[1].split(';')[0]
    const buf    = new Uint8Array(bin.length)
    for (let i=0; i<bin.length; i++) {
      buf[i]  = bin.charCodeAt(i)
    }
    const blob   = new Blob([buf], {type: mime})
    return URL.createObjectURL(blob);
  }

  finish(){
    // Loading.clear()

    // new Archive(this.file_info)
    // if(Common.button_save){
    //   Common.button_save.setAttribute("data-hidden","0")
    // }
    if(this.callback){
      this.callback()
    }
  }

  // 設定ファイルのデータload
  setting_load(unzip){
    const buf = unzip.decompress(Data.setting_file)
    const txt = new TextDecoder().decode(buf);
    const datas = JSON.parse(txt)
    new Info(datas)
    // direction
    if(datas.direction !== undefined){
      Element.direction.checked = datas.direction === "right" ? false : true
    }
    return datas
  }
}