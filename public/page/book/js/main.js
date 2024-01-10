import { Upload }    from "./upload.js"
import { Direction } from "./direction.js"
import { Event }     from "./event.js"

class Main{
  constructor(){
    new Event()
    new Upload({
      callback : (()=>new Direction())
    })
  }

  static data = null
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
