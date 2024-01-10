import { Data }     from "./data.js"

export class Book{
  constructor(){
    this.image_load()
  }

  image_load(){console.log(Data.data)
    if(!Data.data || !Data.data.datas || !Data.data.datas.length){return}
    for(let i=0; i<Data.data.datas.length; i++){
      const img = new Image()
      img.setAttribute("data-num" , i)
      img.onload = this.image_loaded.bind(this, i)
      img.onerror = (e => {alert("Error. image-load fail.")})
      img.src = `data:image/webp;base64,${Data.data.datas[i]}`
    }
  }

  image_loaded(num, e){
    const id = Number(e.target.getAttribute("data-num"))
    const w  = e.target.naturalWidth
    const h  = e.target.naturalHeight
    Data.images[num] = {
      status    : "complete",
      id        : id,
      w         : w,
      h         : h,
      img       : e.target,
      dimension : this.get_dimension(id,w,h),
      single    : this.get_single_flg(id,w,h)
    }
    Data.images[num].dimension = w < h ? "horizontal" : "vertical"
    this.image_load_finish()
  }

  // ページの縦横判定: 編集前と編集後の互換性担保処理
  get_dimension(id, w,h){
    if(Data.data.pages 
    && Data.data.pages[id]
    && Data.data.pages[id].dimension){
      return Data.data.pages[id].dimension
    }
    else{
      return w < h ? "horizontal" : "vertical"
    }
  }

  // シングルページ判定: 編集前と編集後の互換性担保処理
  get_single_flg(id,w,h){
    if(Data.data.pages
    && Data.data.pages[id]
    && typeof Data.data.pages[id].single !== "undefined"){
      return Data.data.pages[id].single
    }
    else{
      return w < h ? true : false
    }
  }

  // 画像読み込み処理終了判定
  image_load_finish(){
    if(Data.images.length !== Data.data.datas.length){return}
    this.set_page_groups()
    // console.log(Data.groups,Data.data.groups,Data.images)
  }

  set_page_groups(){
    let page_num  = 0
    let group_num = 0
    for(let i=0; i<Data.images.length; i++){
      Data.images[i].group_num = group_num
      Data.images[i].page_num  = [page_num]
      const page = Data.images[i]
      const next = Data.images[i+1] || null
      Data.groups[group_num] = [page_num++]

      // 見開き処理
      if(!page.single){
        switch(page.dimension){
          // 見開きページを分割
          case "vertical":
            Data.images[i].page_num.push(page_num)
            Data.groups[group_num].push(page_num++)
          break
          
          // 単ページを見開きにする
          case "horizontal":
            if(next && next.dimension === "horizontal" && !next.single){
              i++ // ページを進める
              Data.images[i].group_num = group_num
              Data.images[i].page_num  = page_num
              Data.groups[group_num].push(page_num++)
            }
          break
        }
      }
      group_num++
    }
  }
}
