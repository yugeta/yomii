import { Upload }  from './upload.js'
import { View }    from './view.js'
import { Event }   from './event.js'

export class Main{
  constructor(){
    new Event()
    this.upload()
  }

  upload(){
    new Upload({
      callback : this.view.bind(this)
    })
  }
  view(){
    new View()
  }

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
