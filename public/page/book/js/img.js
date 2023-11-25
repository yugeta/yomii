import { Common } from "./common.js"

export class Img{
  constructor(options){
    this.options = options || {}
    this.load()
  }

  load(){
    if(!Common.data || !Common.data.datas || !Common.data.datas.length){return}
    for(let i=0; i<Common.data.datas.length; i++){
      const img = new Image()
      img.onload = this.loaded.bind(this, i)
      img.src = `data:image/webp;base64,${Common.data.datas[i]}`
      Common.pages[i] = {
        page : i,
        w : null,
        h : null,
        img : img,
        status : "loading",
        dimension : null,
      }
    }
  }

  loaded(num, e){
    const w = e.target.naturalWidth
    const h = e.target.naturalHeight
    Common.pages[num].w = w
    Common.pages[num].h = h
    Common.pages[num].status = "success"
    Common.pages[num].dimension = w < h ? "horizontal" : "vertical"
    this.check()
  }

  check(){
    const loaded_count = Common.pages.filter(e => e.status === "success").length
    if(loaded_count !== Common.pages.length){return}
    this.finish()
  }

  finish(){
    if(this.options.callback){
      this.options.callback()
    }
  }
}