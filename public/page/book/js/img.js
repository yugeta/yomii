export class Img{
  pages = []

  constructor(options){
    this.options = options || {}
    this.load()
  }

  load(){
    if(!this.options.data || !this.options.data.datas || !this.options.data.datas.length){return}
    for(let i=0; i<this.options.data.datas.length; i++){
      const img = new Image()
      img.onload = this.loaded.bind(this, i)
      img.src = `data:image/webp;base64,${this.options.data.datas[i]}`
      this.pages[i] = {
        page      : i,
        w         : null,
        h         : null,
        img       : img,
        status    : "loading",
        dimension : null,
        single    : this.get_single(i),
      }
    }
  }

  get_single(num){
    if(!this.options.data.pages){return false}
    const data = this.options.data.pages[num]
    return data.single ? true : false
  }

  loaded(num, e){
    const w = e.target.naturalWidth
    const h = e.target.naturalHeight
    this.pages[num].w = w
    this.pages[num].h = h
    this.pages[num].status = "success"
    this.pages[num].dimension = w < h ? "horizontal" : "vertical"
    this.check()
  }

  check(){
    const loaded_count = this.pages.filter(e => e.status === "success").length
    if(loaded_count !== this.pages.length){return}
    this.finish()
  }

  finish(){
    if(this.options.callback){
      this.options.callback(this.pages)
    }
  }
}