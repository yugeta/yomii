import { Main }    from "./main.js"
import { Loading }  from "../../../asset/js/loading/loading.js"
import * as PdfJs  from "../../../asset/js/pdf/build/pdf.js"

export class Pdf{
  images = []

  constructor(pdf_file){
    this.images = []
    new Loading({
      type : "plane"
    })
    Loading.set_status('active')
    PdfJs.GlobalWorkerOptions.workerSrc = `asset/js/pdf/build/pdf.worker.js`;
    this.promise = new Promise((resolve,reject) => {
      this.resolve  = resolve
      this.reject   = reject
      const reader  = new FileReader();
      reader.onload = this.set_image.bind(this)
      reader.readAsArrayBuffer(pdf_file)
    })
  }

  set_image(e){
    PdfJs.getDocument({
      data       : e.target.result,
      cMapUrl    : `asset/js/pdf/cmaps/`,
      cMapPacked : true,
    }).promise.then(this.set_images.bind(this))
  }

  async set_images(pdf){
    for(let i=1; i<=pdf.numPages; i++){
      Loading.set_rate((i) / pdf.numPages * 100)
      const pdf_page    = await pdf.getPage(i)
      const canvas  = await this.get_canvas(pdf_page)
      const imgData = this.canvas2img(canvas)
      const img     = await this.create_image(imgData)
      this.images.push(img)
    }
    this.finish()
  }

  async get_canvas(page){
    const canvas   = document.createElement("canvas")
    const viewport = page.getViewport({ scale: 1 })
    canvas.width   = viewport.width
    canvas.height  = viewport.height
    const ctx = canvas.getContext('2d')
    const task = page.render({
      canvasContext: ctx,
      viewport: viewport,
    })
    await task.promise
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

  async create_image(data){
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = data
      img.onload = (e => resolve(e.target))
      img.onerror = reject
    })
  }

  finish(){
    Loading.set_status('passive')
    this.resolve(this.images)
  }
}
