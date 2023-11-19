import { Common }  from "./common.js"
import { Convert } from "./convert.js"

export class Upload{
  constructor(){
    this.post()
  }

  post(){
    if(!Common.input_file.value){return}
    const form_data = new FormData(Common.form_upload)
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true;
    xhr.open('POST' , Common.php_book , true)
    xhr.onload = this.posted.bind(this)
    xhr.send(form_data)
  }

  posted(e){
    if(!e || !e.target || !e.target.response){return}
    const res = JSON.parse(e.target.response)
    if(!res){
      // alert("正常にアップロードできませんでした。")
      return
    }
    new Convert(res.uuid)
    this.setting = res
    this.progress()
  }

  progress(){

  }
}
