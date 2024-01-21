// import { Main }    from "./main.js"
// import { Info }    from "./info.js"
// import { Common }  from "./common.js"
// import { Loading } from "./loading.js"
// import * as PdfJs  from "./plugin/pdf/build/pdf.js"

export class Pdf{
  constructor(pdf_file, callback){console.log("pdf");return
    this.callback = callback || null
    PdfJs.GlobalWorkerOptions.workerSrc = `page/${Main.page_name}/js/plugin/pdf/build/pdf.worker.js`;
    Common.set_file_info(new Info(pdf_file))
    const reader = new FileReader();
    reader.onload = this.file_loaded.bind(this)
    reader.readAsArrayBuffer(pdf_file)
  }

  file_loaded(e){
    const data = e.target.result
    PdfJs.getDocument({
      data       : data,
      cMapUrl    : `page/${Main.page_name}/js/plugin/pdf/cmaps/`,
      cMapPacked : true,
    }).promise.then(this.set_images.bind(this))
  }

  async set_images(pdf){
    new Loading({
      page_count: pdf.numPages,
    })

    for(let i=1; i<=pdf.numPages; i++){
      Loading.set_active(i-1)
      const pdf_page    = await pdf.getPage(i)
      const canvas  = await this.get_canvas(pdf_page)
      const imgData = this.canvas2img(canvas)
      const img     = await this.create_image(imgData)
      Common.images.push(img)
    }
    this.finish()
  }

  async get_canvas(page){
    const canvas   = document.createElement("canvas")
    const viewport = page.getViewport({ scale: 1 })
    const size     = Common.adjust_size({
      w : viewport.width,
      h : viewport.height,
    })
    canvas.width   = size.w
    canvas.height  = size.h
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
    Loading.clear()

    if(Common.button_save){
      Common.button_save.setAttribute("data-hidden","0")
    }
    if(this.callback){
      this.callback()
    }
    // new Archive(this.file_info)
  }
}
