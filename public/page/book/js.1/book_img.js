import { Book } from "./book.js"

export class BookImg{
  constructor(options){
    this.options = options || {}
    this.load()
  }

  get data(){
    return Book.data
  }

  load(){
    if(!this.data || !this.data.datas || !this.data.datas.length){return}
    for(let i=0; i<this.data.datas.length; i++){
      const img = new Image()
      img.onload = this.loaded.bind(this, i)
      img.src = `data:image/webp;base64,${this.data.datas[i]}`
      Book.images[i] = {
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
    if(!this.data.pages){return false}
    const data = this.data.pages[num]
    return data.single ? true : false
  }

  loaded(num, e){
    const w = e.target.naturalWidth
    const h = e.target.naturalHeight
    Book.images[num].w = w
    Book.images[num].h = h
    Book.images[num].status = "success"
    Book.images[num].dimension = w < h ? "horizontal" : "vertical"
    this.check()
  }

  check(){
    const loaded_count = Book.images.filter(e => e.status === "success").length
    if(loaded_count !== Book.images.length){return}
    this.set_page_groups()
    this.finish()
  }

  set_page_groups(){
    let page_num  = 0
    let group_num = 0
    Book.pages  = []
    Book.groups = []
    for(let i=0; i<Book.images.length; i++){
      Book.images[i].group_num = group_num
      Book.images[i].page_num  = [page_num]
      const page = Book.images[i]
      const next = Book.images[i+1] || null
      Book.groups[group_num] = [page_num++]

      // 見開き処理
      if(!page.single){
        switch(page.dimension){
          // 見開きページを分割
          case "vertical":
            Book.images[i].page_num.push(page_num)
            Book.groups[group_num].push(page_num++)
          break
          
          // 単ページを見開きにする
          case "horizontal":
            if(next && next.dimension === "horizontal" && !next.single){
              i++ // ページを進める
              Book.images[i].group_num = group_num
              Book.images[i].page_num  = page_num
              Book.groups[group_num].push(page_num++)
            }
          break
        }
      }
      
      group_num++
    }
  }

  finish(){
    if(this.options.callback){
      this.options.callback()
    }
  }
}