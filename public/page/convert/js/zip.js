import { Main }    from "./main.js"
import { Info }    from "./info.js"
import { Common }  from "./common.js"
import { Archive } from "./archive.js"

export class Zip{
  constructor(zip_file){
    this.file_info = new Info(zip_file)
    const fileReader = new FileReader();
    fileReader.onload = this.view_images.bind(this)
    fileReader.readAsArrayBuffer(zip_file)
  }

  async view_images(e){
    const data = e.target.result
    const zipArr = new Uint8Array(data);
    const unzip = new Zlib.Unzip(zipArr);
    const filenames = unzip.getFilenames();
    let num = 1
    for(const filename of filenames){
      const imageUrl = this.file2image(unzip, filename)
      if(!imageUrl){continue}
      const img1     = await this.create_image(imageUrl)
      if(!img1){continue}
      const canvas   = await this.create_canvas(img1)
      const img2Url  = this.canvas2img(canvas)
      const img2     = await this.create_image(img2Url)
      const page = document.createElement("div")
      page.className = "page"
      page.setAttribute("data-num" , num)
      Common.img_area.appendChild(page)
      page.appendChild(img2)
      num++
    }
    this.finish()
  }

  file2image(unzip, filename){
    const uint8array = unzip.decompress(filename)
    const blob = new Blob([uint8array], {type: Main.mime})
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
    const base64 = canvas.toDataURL(Main.mime)
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
    new Archive(this.file_info)
  }
}