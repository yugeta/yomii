import { Book }     from "./book.js"
import { BookList } from "./book_list.js"
import { Element }  from "./element.js"
import { Init }     from "./book/init.js"
import { Urlinfo }  from '../../../asset/js/lib/urlinfo.js'

export class Control{
  constructor(){
    this.set_event()
  }

  set_event(){
    // < left
    if(Element.btn_left){
      Element.btn_left.addEventListener("click" , this.click_left.bind(this))
    }
    // right >
    if(Element.btn_right){
      Element.btn_right.addEventListener("click" , this.click_right.bind(this))
    }
    // direction : <->
    if(Element.direction){
      Element.direction.addEventListener("click" , this.click_direction.bind(this))
    }
    // touch対応デバイスの確認
    if(navigator.maxTouchPoints){
      Element.area.addEventListener("touchstart" , this.touch_start.bind(this))
      Element.area.addEventListener("touchmove"  , this.touch_move.bind(this))
      Element.area.addEventListener("touchend"   , this.touch_end.bind(this))
    }
    // upload
    if(Element.elm_upload){
      Element.elm_upload.addEventListener("change" , this.book_upload.bind(this))
    }
  }

  // 1ページ移動（左）
  click_left(){
    Book.next_page("left")
  }

  // 1ページ移動（右）
  click_right(){
    Book.next_page("right")
  }

  // 方向切替
  click_direction(){
    BookList.set_active()
  }

  // Touch
  touch = null
  touch_start(e){
    const pos = {
      x : e.touches[0].pageX,
      y : e.touches[0].pageY,
    }
    const diff = {
      x : 0,
      y : 0,
    }
    this.touch = {
      pos  : pos,
      diff : diff,
    }
  }
  touch_move(e){
    if(!this.touch){return}
    const diff = {
      x : e.touches[0].pageX - this.touch.pos.x,
      y : e.touches[0].pageY - this.touch.pos.y,
    }
    this.touch.diff = diff
    Element.area_page.style.setProperty("margin-left",`${diff.x}px`,"")

  }
  touch_end(e){
    let direction = null
    if(this.touch && this.touch.diff && this.touch.diff.x && Math.abs(this.touch.diff.x) > 50){
      if(this.touch.diff.x > 0){
        direction = "left"
      }
      else{
        direction = "right"
      }
    }

    if((direction === "left" && Book.is_last) || direction === "right" && Book.is_first){
      direction = "start"
    }

    switch(direction){
      case "left":
        Book.next_page("left")
        break
      case "right":
        Book.next_page("right")
        break
      default:
        Element.area_page.style.removeProperty("margin-left")
    }
    this.touch = null
  }

  book_upload(e){
    if(!e || !e.target || !e.target.files || !e.target.files.length){return}
    const file_data = e.target.files[0]
    Element.main.setAttribute("rel" , "book")
    const fileReader = new FileReader();
    fileReader.onload = (e => {
      Element.main.setAttribute("rel" , "book")
			const json = e.target.result
      const data = JSON.parse(json)
      Book.data = data
      new Urlinfo().add_query("book" , data.name)
      new Init({data : data})
		})
		fileReader.readAsText(file_data)
    // new Init(e.target.files[0])
  }

}