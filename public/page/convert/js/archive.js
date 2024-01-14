import { Common }  from "./common.js"

export class Archive{
  constructor(options){
    this.options = options || {}
    this.filename = this.options.name || `book_`+(+new Date())
    this.create()
  }

  get_images(){
    return Common.img_area.querySelectorAll("img")
  }

  async create(){
    const images = this.get_images()
    const zip = new Zlib.Zip()
    for(let i=0; i<images.length; i++){
      const data = await this.src2buffer(images[i].src);
      const num = ("0000"+i).slice(-4)
      zip.addFile(data, {
        filename: this.stringToByteArray(`foo_${num}.webp`),
      })
    }
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

    // 自動ダウンロード
    // a.click() 

    // リンク表示
    Common.download_area.appendChild(a)
  }
}