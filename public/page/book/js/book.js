import { Common }  from './common.js'
import { List }    from './list.js'
import { Img }     from './img.js'
import { Setting } from './setting.js'

export class Book{
  constructor(options){
    this.options = options || {}
    this.set_direction()
    new Img({
      data     : Common.data,
      callback : ((datas)=>{
        Common.images = datas
        new List()
        if(Book.is_portrait){
          Book.view_page()
        }
        else{
          Book.view_group()
        }
      }).bind(this)
    })
  }

  set_direction(){
    const elm = document.getElementById(`direction`)
    if(!elm){return}
    elm.checked = Common.data.direction === "right" ? false : true
  }

  // ページ送り
  static next_page(mode){
    if((Common.direction.checked === true  && mode === "left")
    || (Common.direction.checked === false && mode === "right")){
      if(Book.is_portrait){
        if(Common.page_num === 0 && Common.page_sub === null){return}
        Common.page_num = Common.page_num || 0
        let go_page_num = Common.page_num
        if(Common.data.pages[Common.page_num].dimension === "vertical" && Common.page_sub){
          Common.page_sub = null
        }
        else{
          go_page_num--
          Common.page_sub = 1
        }
        Common.group_num = Book.get_page2group_num(go_page_num)
        go_page_num = go_page_num > 0 ? go_page_num : 0
        Book.view_page(mode, go_page_num , Common.page_sub)
      }
      else{
        let go_group_num = Common.group_num - 1
        go_group_num = go_group_num > 0 ? go_group_num : 0
        Book.view_group(mode, go_group_num)
      }
    }
    else if((Common.direction.checked === true  && mode === "right")
         || (Common.direction.checked === false && mode === "left")){
      if(Book.is_portrait){
        Common.page_num = Common.page_num || 0
        let go_page_num = Common.page_num
        if(Common.data.pages[Common.page_num].dimension === "vertical" && !Common.page_sub){
          Common.page_sub = 1
        }
        else{
          go_page_num++
          Common.page_sub = null
        }
        Common.group_num = Book.get_page2group_num(go_page_num)
        go_page_num = go_page_num <= Common.images.length - 1 ? go_page_num : Common.images.length - 1
        Book.view_page(mode, go_page_num , Common.page_sub)
      }
      else{
        let go_group_num = Common.group_num + 1
        go_group_num = go_group_num <= Common.groups.length - 1 ? go_group_num : Common.groups.length - 1
        Book.view_group(mode, go_group_num)
      }
    }
    else if(typeof mode === "number"){

    }
    List.set_active()
  }


  static clear_current_page(){
    const page = Common.area.querySelector(`.page`)
    if(!page){return}
    page.parentNode.removeChild(page)
  }

  static view_page(mode, go_page_num, sub_flg){console.log(mode)
    // Book.clear_current_page()
    Common.page_num = go_page_num ?? 0
    const img = Book.get_page_image(Common.page_num)
    if(!img){return}
    const page = document.createElement("div")
    page.className = "page"
    page.setAttribute("data-count" , 1)
    const dimension = Book.get_page_dimension(page_num)
    page.setAttribute("data-dimension" , dimension)
    const canvas = Book.set_canvas(img , 1, sub_flg)
    page.appendChild(canvas)
    switch(mode){
      case "left":
        img.parentNode.insertBefore(page , img)
        break
      case "right":
      default:
        Common.area.appendChild(page)
        break
    }
    const page_count = Common.page_num + 1
    Common.page_nums.textContent = `${page_count}.${Common.page_sub}`
  }

  static view_group(mode, go_group_num){
    if(Common.group_num === go_group_num){return}
    const elm = Common.area.querySelector(".page")
    // Book.clear_current_page()
    Common.group_num = go_group_num ?? Common.group_num
    const images = Book.get_group_images(Common.group_num)
    if(!images || !images.length){return}
    const page = document.createElement("div")
    page.className = "page"
    page.setAttribute("data-count" , images.length)
    if(images.length === 1){
      const page_num = this.get_page_num(go_group_num,0)
      const dimension = Book.get_page_dimension(page_num)
      page.setAttribute("data-dimension" , dimension)
    }
    for(const img of images){
      const canvas = Book.set_canvas(img , images.length)
      page.appendChild(canvas)
    }
    switch(mode){
      case "left":
        Common.area.insertBefore(page, elm)

        if(elm){
          Common.area.animate({
            transform : ["translateX(-100%)","translateX(0%)"]
          }, {
            id         : "page-move",
            duration   : Setting.duration,
            iterations : 1,
          });
          for(const anim of Common.area.getAnimations()){
            if(anim.id !== 'page-move'){continue}
            Promise.all([anim.finished]).then(e => {
              elm.parentNode.removeChild(elm)
            })
          }
        }
        break

      case "right":
      default:
        Common.area.appendChild(page)
        const drag = Common.area_page.style.getPropertyValue("margin-left") || "0px"
        if(elm){
          Common.area.animate({
            transform : ["translateX(0%)", `translateX(calc(-100% - ${drag}))`]
          }, {
            id         : "page-move",
            duration   : Setting.duration,
            iterations : 1,
          });
          for(const anim of Common.area.getAnimations()){
            if(anim.id !== 'page-move'){continue}
            Promise.all([anim.finished]).then(e => {
              elm.parentNode.removeChild(elm)
            })
          }
        }
        break
    }
    const page_count = Common.group_num+1
    Common.page_nums.textContent = `${page_count}`
  }

  static set_canvas(img , page_count , page_sub_flg){
    const canvas  = document.createElement("canvas")
    const ctx     = canvas.getContext("2d")
    const w       = img.naturalWidth
    const h       = img.naturalHeight
    canvas.width  = w
    canvas.height = h
    let x = 0
    if(Book.is_portrait && page_count === 1 && w > h){
      canvas.width  = w / 2
      if((page_sub_flg && Common.direction.checked)
      || (!page_sub_flg && !Common.direction.checked)){
        x = -(w / 2)
      }
    }
    ctx.drawImage(img, x, 0, w, h)
    return canvas
  }

  static get_page_image(page_num){
    const page_data = Common.images.find(e => e.page === page_num)
    return page_data ? page_data.img : null
  }

  static get_group_images(group_num){
    const page_nums = Common.groups[group_num]
    const images = []
    for(const page_num of page_nums){
      const page_data = Common.images.find(e => e.page === page_num)
      if(!page_data){continue}
      images.push(page_data.img)
    }
    return images
  }

  static get_page_num(group_num , group_page_num){
    group_num = group_num || 0
    return Common.groups[group_num][group_page_num]
  }

  // portrait処理
  static get is_portrait(){
    return screen.width < screen.height ? true : false
  }

  static get_group2page_num(group_num){
    return Common.groups[group_num] ? Common.groups[group_num][0] : 0
  }
  static get_page2group_num(page_num){
    return Common.groups.find(e => e.indexOf(page_num) !== -1)
  }

  static get_page_dimension(page_num){
    if(Common.images && Common.images[page_num] && Common.images[page_num].dimension){
      return Common.images[page_num].dimension
    }
    if(Common.data.pages && Common.data.pages[page_num] && Common.data.pages[page_num].dimension){
      return Common.data.pages[page_num].dimension
    }
    else{
      // console.log(Common.images)
      return ""
    }
  }

  static get is_first(){
    // page
    if(Book.is_portrait && Common.page_num === 0){
      return true
    }
    // group
    if(!Book.is_portrait && Common.group_num === 0){
      return true
    }
  }

  static get is_last(){
    // page
    if(Book.is_portrait && Common.page_num === Common.pages.length-1){
      return true
    }
    if(!Book.is_portrait && Common.group_num === Common.groups.length-1){
      return true
    }
  }
}
