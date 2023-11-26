
// import { Common }  from './common.js'
import { Upload }  from './upload.js'
import { View }    from './view.js'
// import { Control } from './control.js'
// import { Header }  from './header.js'
// import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Main{
  constructor(){
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
