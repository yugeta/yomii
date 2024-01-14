import { Common } from "./common.js"
import { Zip }    from "./zip.js"
import { Pdf }    from "./pdf.js"
import { Info }   from "./info.js"
import { Main }   from "./main.js"

export class Upload{
  constructor(){
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
      case "zip":
        new Zip(file)
      break

      case "pdf":
        new Pdf(file)
      break
    }
  }

  clear(){
    Common.img_area.innerHTML = ""
    Common.download_area.textContent = ""
  }
}
