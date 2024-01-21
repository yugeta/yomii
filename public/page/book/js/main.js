import { Upload }    from "./upload.js"
import { Direction } from "./direction.js"
import { Event }     from "./event.js"
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"

export class Main{
  constructor(){
    new Event()
    new Upload({
      callback : (()=>new Direction())
    })
  }

  static data = null
  static mime      = "image/webp"
  static page_name = new Urlinfo().queries.p || "index"
}

switch(document.readyState){
  case "complete":
  case "interactive":
    new Main()
    break
  default:
    window.addEventListener("DOMContentLoaded" , (()=>new Main()))
    break
}
