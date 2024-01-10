import { Data }    from "./data.js"
import { Element } from "./element.js"
// import { Common }  from "./common.js"

export class Direction{
  constructor(){
    // this.set_event()
    this.set_direction()
  }

  set_direction(){
    if(!Data.data){return}
    Element.direction.checked = Data.data.direction === "right" ? false : true
  }

  // set_event(){
  //   Element.direction.addEventListener("click" , this.click_direction.bind(this))
  // }

  // click_direction(){
  //   Common.header_menu_close()
  // }
}