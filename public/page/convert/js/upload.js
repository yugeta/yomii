import { Common } from "./common.js"
import { Zip }    from "./zip.js"
import { Pdf }    from "./pdf.js"
import { Info }   from "./info.js"
import { View }   from "./view.js"

export class Upload{
  constructor(){
    Common.init()
    this.post()
  }

  post(){
    const files = Common.input_file.files
    for(const file of files){
      this.posted(file)
    }
  }
  posted(file){
    this.clear()
    const info = new Info(file)
    console.log(info)

    switch(info.ext){
      case "yomii":
      case "zip":
        new Zip(file, this.finish.bind(this))
      break

      case "pdf":
        new Pdf(file, this.finish.bind(this))
      break
    }
  }

  finish(){
    new View()
  }

  clear(){
    Common.img_area.innerHTML = ""
    Common.download_area.textContent = ""
    if(Common.button_save){
      Common.button_save.setAttribute("data-hidden" , "1")
    }
  }
}
