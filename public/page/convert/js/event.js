import { Common } from "./common.js"
import { Upload }  from "./upload.js"

export class Event{
  constructor(){
    if(Common.button_upload){
      Common.button_upload.addEventListener("click" , (()=> new Upload()))
    }
    if(Common.input_file){
      Common.input_file.addEventListener("change" , (()=> new Upload()))
    }
  }

}