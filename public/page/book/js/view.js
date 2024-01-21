import { Data }    from "./data.js"
import { Element } from "./element.js"
import { Common }  from "./common.js"

export class View{
  constructor(){
    switch(Common.dimension){
      case "landscape":
        this.group(Data.group_num)
        // next
        this.group(Data.group_num+1)
        // prev
        this.group(Data.group_num-1)
      break

      case "portrait":
        this.page(Data.page_num)
        // next
        this.page(Data.page_num+1)
        // prev
        this.page(Data.page_num-1)
      break
    }
  }
  // 対象のグループ要素に画像が挿入されているか確認（要素がない場合も処理をしない）
  check_group_image(group_num){
    const elm_group = this.elm_group(group_num)
    if(!elm_group){return true}
    return elm_group.querySelector("canvas") ? true : false
  }

  group(group_num){
    if(group_num < 0 || !Data.groups[group_num]){return}
    if(this.check_group_image(group_num) === true){return}
    const page_nums = Data.groups[group_num]
    if(!page_nums){return}
    for(const page_num of page_nums){
      const page_data = Common.page2Info(page_num)
      const img       = page_data.img
      const elm_page  = this.elm_page(page_num)
      // console.log(group_num,page_num,elm_page)
      if(img.naturalWidth > img.naturalHeight){
        const sub_flg = page_nums.findIndex(e => e === page_num) === 1 ? true : false
        const canvas  = new Canvas(img, sub_flg).canvas
        elm_page.appendChild(canvas)
      }
      else{
        const canvas = new Canvas(img).canvas
        if(!canvas){continue}
        elm_page.appendChild(canvas)
      }
    }
  }

  check_page_image(page_num){
    const elm_page = this.elm_page(page_num)
    if(!elm_page){return true}
    return elm_page.querySelector("canvas") ? true : false
  }

  page(page_num){
    if(page_num < 0 || page_num > Math.max(Data.groups.length)){return}
    if(this.check_page_image(page_num) === true){return}
    const page_data = Common.page2Info(page_num)
    const img       = page_data.img
    const elm_page  = this.elm_page(page_num)
    const page_nums = Data.groups.find(e => e.indexOf(page_num) !== -1)
    if(img.naturalWidth > img.naturalHeight){
      const sub_flg = page_nums.findIndex(e => e === page_num) === 1 ? true : false
      const canvas  = new Canvas(img, sub_flg).canvas
      elm_page.appendChild(canvas)
    }
    else{
      const canvas = new Canvas(img).canvas
      if(canvas){
        elm_page.appendChild(canvas)
      }
    }
  }

  page_data(page_num){
    return Data.page[page_num]
  }

  elm_page(page_num){
    return Element.book.querySelector(`.page[data-page="${page_num}"]`)
  }
  elm_group(group_num){
    return Element.book.querySelector(`.group[data-group="${group_num}"]`)
  }
  elm_group_pages(group_num){
    const elm_group = this.elm_group(group_num)
    return elm_group.querySelectorAll(`.page`)
  }
}

class Canvas{
  constructor(img , sub_flg){
    if(!img){return null}
    this.img = img
    this.w   = img.naturalWidth
    this.h   = img.naturalHeight

    if(sub_flg !== undefined){
      this.canvas = this.half(sub_flg)
    }
    else{
      this.canvas = this.full()
    }
  }
  full(){
    const canvas  = document.createElement("canvas")
    canvas.width  = this.w
    canvas.height = this.h
    let x = 0
    canvas.getContext("2d").drawImage(this.img, x, 0, this.w, this.h)
    return canvas
  }

  half(sub_flg){
    const canvas  = document.createElement("canvas")
    canvas.width  = ~~(this.w / 2)
    canvas.height = this.h
    let x = 0
    if((sub_flg  &&  Element.direction.checked)
    || (!sub_flg && !Element.direction.checked)){
      x = -canvas.width
    }
    canvas.getContext("2d").drawImage(this.img, x, 0, this.w, this.h)
    return canvas
  }
}