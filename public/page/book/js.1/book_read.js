import { Element } from "./element.js"
import { Book }    from "./book.js"
// import { Setting } from "./setting.js"

export class BookRead{
  static page(mode, go_page_num){
console.log(mode,go_page_num)
    // Book.clear_current_page()
    Book.page_num = go_page_num ?? Book.page_num
    const img = BookRead.get_page_image(Book.page_num)
    if(!img){return}
    const page = document.createElement("div")
    page.className = "page"
    page.setAttribute("data-count" , 1)
    const dimension = BookRead.get_page_dimension(page_num)
    page.setAttribute("data-dimension" , dimension)
    const canvas = BookRead.set_canvas(img , 1)
    page.appendChild(canvas)
    switch(mode){
      case "left":
        if(Element.area.firstChild){
          Element.area.insertBefore(page , Element.area.firstChild)
        }
        else{
          Element.area.appendChild(page)
        }
        break
      case "right":
      default:
        Element.area.appendChild(page)
        break
    }
    const page_count = Book.page_num + 1
    Element.page_nums.textContent = page_count
  }

  static group(mode, go_group_num){
    if(Book.group_num === go_group_num){return}
    const elm = Element.area.querySelector(".page")
    Book.group_num = go_group_num ?? Book.group_num
    const images = BookRead.get_group_images(Book.group_num)
    if(!images || !images.length){return}
    const page = document.createElement("div")
    page.className = "page"
    page.setAttribute("data-count" , images.length)
    if(images.length === 1){
      const page_num = this.get_page_num(go_group_num,0)
      const dimension = BookRead.get_page_dimension(page_num)
      page.setAttribute("data-dimension" , dimension)
    }
    for(const img of images){
      const canvas = BookRead.set_canvas(img , images.length)
      page.appendChild(canvas)
    }
    switch(mode){
      case "left":
        Element.area.insertBefore(page, elm)
        if(elm){
          Element.area.animate({
            transform : ["translateX(-100%)","translateX(0%)"]
          }, {
            id         : "page-move",
            duration   : Book.duration,
            iterations : 1,
          });
          for(const anim of Element.area.getAnimations()){
            if(anim.id !== 'page-move'){continue}
            Promise.all([anim.finished]).then(e => {
              elm.parentNode.removeChild(elm)
            })
          }
        }
        break
      case "right":
      default:
        Element.area.appendChild(page)
        const drag = Element.area_page.style.getPropertyValue("margin-left") || "0px"
        if(elm){
          Element.area.animate({
            transform : ["translateX(0%)", `translateX(calc(-100% - ${drag}))`]
          }, {
            id         : "page-move",
            duration   : Book.duration,
            iterations : 1,
          });
          for(const anim of Element.area.getAnimations()){
            if(anim.id !== 'page-move'){continue}
            Promise.all([anim.finished]).then(e => {
              elm.parentNode.removeChild(elm)
            })
          }
        }
        break
    }
    const page_count = Book.group_num+1
    Element.page_nums.textContent = `${page_count}`
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
      if((page_sub_flg && Element.direction.checked)
      || (!page_sub_flg && !Element.direction.checked)){
        x = -(w / 2)
      }
    }
    ctx.drawImage(img, x, 0, w, h)
    return canvas
  }

  static get_page_image(page_num){
    const page_data = Book.images.find(e => e.page === page_num)
    return page_data ? page_data.img : null
  }

  static get_group_images(group_num){
    const page_nums = Book.groups[group_num]
    const images = []
    for(const page_num of page_nums){
      const page_data = Book.images.find(e => e.page === page_num)
      if(!page_data){continue}
      images.push(page_data.img)
    }
    return images
  }

  static get_page_num(group_num , group_page_num){
    group_num = group_num || 0
    return Book.groups[group_num][group_page_num]
  }

  static get_page_dimension(page_num){
    if(Book.images && Book.images[page_num] && Book.images[page_num].dimension){
      return Book.images[page_num].dimension
    }
    if(Book.data.pages && Book.data.pages[page_num] && Book.data.pages[page_num].dimension){
      return Book.data.pages[page_num].dimension
    }
    else{
      // console.log(Common.images)
      return ""
    }
  }
}