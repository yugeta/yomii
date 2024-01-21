import { Element }   from "./element.js"
import { Page }      from "./page.js"
import { Data }      from "./data.js"
import { Common }    from "./common.js"
import { Upload }    from "./upload.js"
import { Book }      from "./book.js"

export class Event{
  constructor(){
    this.set_upload()
    this.set_direction()
    // this.set_mouse()
    // this.set_touch()
    this.set_left_button()
    this.set_right_button()
    this.set_page_scroll()
    this.set_window_resize()
  }

  // Upload
  set_upload(){
    if(!Element.upload){return}
    Element.upload.addEventListener("change" , (e =>new Upload(e)))
  }

  // Direction
  set_direction(){
    Element.direction.addEventListener("click" , this.click_direction.bind(this))
  }

  click_direction(){
    Common.header_menu_close()
  }

  // // Mouse
  // set_mouse(){
  //   window.addEventListener("mousedown"  , this.mousedown.bind(this))
  //   window.addEventListener("mousemove"  , this.mousemove.bind(this))
  //   window.addEventListener("mouseup"    , this.mouseup.bind(this))
  // }

  // exist_page(){
  //   const pages = Element.book.querySelectorAll(".page")
  //   return pages.length ? true : false
  // }
  // get elm_page(){
  //   return Element.book.querySelector(".page")
  // }

  // mousedown(e){
  //   if(!this.exist_page()){return}
  //   this.page_data = {
  //     x : e.pageX,
  //     y : e.pageY,
  //   }
  //   Element.book.setAttribute("data-move" , "true")
  // }
  // mousemove(e){
  //   if(!this.page_data){return}
  //   const move = e.pageX - this.page_data.x
  //   this.elm_page.style.setProperty("margin-left" , `${move}px` , "")
  // }
  // mouseup(e){
  //   if(this.page_data){
  //     // if(Element.book.hasAttribute("data-move")){
  //     //   Element.book.removeAttribute("data-move")
  //     // }
  //     // if(this.elm_page.style.getPropertyValue("margin-left")){
  //     //   // this.elm_page.style.removeProperty("margin-left")
  //     //   this.elm_page.style.setProperty("margin-left" , "0px" , "")
  //     // }
  //     delete this.page_data
  //   }
  // }

  // // Touch
  // set_touch(){
  //   window.addEventListener("touchstart" , this.touchstart.bind(this))
  //   window.addEventListener("touchmove"  , this.touchmove.bind(this))
  //   window.addEventListener("touchend"   , this.touchend.bind(this))
  // }

  // touchstart(e){
    
  // }
  // touchmove(e){

  // }
  // touchend(e){

  // }


  // Button
  set_left_button(){
    if(!Element.btn_left){return}
    Element.btn_left.addEventListener("click" , this.click_left_button.bind(this))
  }
  click_left_button(){
    new Page("left")
  }

  set_right_button(){
    if(!Element.btn_right){return}
    Element.btn_right.addEventListener("click" , this.click_right_button.bind(this))
  }
  click_right_button(){
    new Page("right")
  }

  // Scroll
  set_page_scroll(){
    Element.book.addEventListener("scroll" , this.move_page_scroll.bind(this))
  }
  move_page_scroll(e){
    if(!this.can_scroll()){return}
    new Page("scroll", {scrollLeft: e.target.scrollLeft})
  }
  can_scroll(){
    if(!Data.is_scroll){return false}
    if(Data.flg_resize){return false}
    return true
  }

  // Resize
  set_window_resize(){
    window.addEventListener("resize" , this.resize_window.bind(this))
  }
  resize_window(){
    if(Data.dimension === Common.dimension){return}
    Data.flg_resize = true
    Data.dimension = Common.dimension
    
// console.log(Data.groups)
    switch(Common.dimension){
      case "landscape":
        Data.group_num = Common.page_num2group_num(Data.page_num)
      break
      case "portrait":
        Data.page_num  = Common.group_num2page_num(Data.group_num)
      break
    }
// console.log("event-resize",Data.group_num,Data.page_num)
    new Book()
    // console.log(Data.dimension, Common.dimension)
    setTimeout((()=>{Data.flg_resize = false}),500)
    Page.transition()
  }
}

