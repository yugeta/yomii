import { Header }  from "./header.js"
import { Footer }  from "./footer.js"
import { Content } from "./content.js"

class Main{
  constructor(){
    new Header({callback:this.loaded.bind(this)})
    new Footer({callback:this.loaded.bind(this)})
    new Content({callback:this.loaded.bind(this)})
  }

  loaded(e){
    // console.log(Object.name(e))
  }
}

switch(document.readyState){
  case 'complete':
  case 'interactive':
    new Main()
    break
  default:
    window.addEventListener('DOMContentLoaded' , (()=>new Main()))
    break
}