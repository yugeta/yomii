import { Common }  from "./common.js"

export class Archive{
  constructor(options){
    this.options = options || {}
    this.filename = Common.file_info.name || `book_`+(+new Date())
    this.loading_start()
    this.create()
  }

  get_images(){
    return Common.img_area.querySelectorAll("img")
  }

  async create(){
    const zip = new Zlib.Zip()

    // images
    const images = this.get_images()
    for(let i=0; i<images.length; i++){
      const data = await this.src2buffer(images[i].src);
      const num = ("0000"+i).slice(-4)
      zip.addFile(data, {
        filename: this.stringToByteArray(`${num}.webp`),
      })
    }

    // ___setting.json
    zip.addFile(this.create_setting_data(), {
      filename: this.stringToByteArray(Common.setting_file),
    })

    // create link file
    const buf  = zip.compress()
    const blob = new Blob([buf], {type: "application/zip"})
    const url  = URL.createObjectURL(blob);
    this.set_link(url)
  }

  stringToByteArray(str) {
    const array = new (window.Uint8Array !== void 0 ? Uint8Array : Array)(str.length)
    for (let i = 0, il = str.length; i < il; ++i) {
        array[i] = str.charCodeAt(i) & 0xff
    }
    return array
  }

  async src2buffer(imgSrc){
    return new Promise((resolve, reject) =>{
      fetch(imgSrc)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array)
        };
        reader.readAsArrayBuffer(blob);
      })
      .catch(error => {
        console.error('画像の取得に失敗しました:', error);
      });
    })
  }

  set_link(data){
    const a = document.createElement("a")
    a.textContent = `${this.filename}.${Common.download_ext}`
    a.download    = `${this.filename}.${Common.download_ext}`
    a.href        = data

    // delete-loading
    this.loading_finish()

    // 自動ダウンロード
    a.click() 

    // リンク表示
    // Common.download_area.appendChild(a)
  }

  get direction(){
    return Common.elm_direction.checked ? "left" : "right"
  }

  create_setting_data(){
    const setting_data = {
      base_filename : Common.file_info.filename,
      name          : Common.file_info.name,
      direction     : this.direction,
      singles       : Common.file_info.singles,
      deletes       : Common.file_info.deletes,
    }
    const setting_json = JSON.stringify(setting_data , null , "  ")
    const str = unescape(encodeURIComponent(setting_json))
    return this.stringToByteArray(str)
  }
  
  loading_start(){
    Common.download_area.setAttribute("data-loading" , "progress")
  }

  loading_finish(){
    Common.download_area.setAttribute("data-loading" , "finish")
  }
}