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
      Common.direction.addEventListener("click" , List.set_active.bind(this))
    }
  }

  click_left(){
    Book.change_page("left")
  }

  click_right(){
    Book.change_page("right")
  }
}