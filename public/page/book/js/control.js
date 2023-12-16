import { Common } from "./common.js"
import { Book }   from "./book.js"
import { List }   from "./list.js"

export class Control{
  constructor(){
    this.set_event()
  }

  set_event(){
    if(Common.btn_left){
      Common.btn_left.addEventListener("click" , this.click_left.bind(this))
    }
    if(Common.btn_right){
      Common.btn_right.addEventListener("click" , this.click_right.bind(this))
    }
    if(Common.direction){
      Common.direction.addEventListener("click" , this.click_direction.bind(this))
    }
    // touch対応デバイスの確認
    if(navigator.maxTouchPoints){
      Common.area.addEventListener("touchstart" , this.touch_start.bind(this))
      Common.area.addEventListener("touchmove"  , this.touch_move.bind(this))
      Common.area.addEventListener("touchend"   , this.touch_end.bind(this))
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
    List.set_active()
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
    Common.area_page.style.setProperty("margin-left",`${diff.x}px`,"")

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
// console.log(1,direction)

    if((direction === "left" && Book.is_last) || direction === "right" && Book.is_first){
      direction = "start"
    }
// console.log(2,direction)

    switch(direction){
      case "left":
        Book.next_page("left")
        break
      case "right":
        Book.next_page("right")
        break
      default:
        Common.area_page.style.removeProperty("margin-left")
    }
    this.touch = null
  }
}