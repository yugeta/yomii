import { Common }  from "./common.js"

export class Convert{
  constructor(uuid){
    this.uuid = uuid
    this.start()
  }
  
  start(){
    const query = {
      mode : "convert_start",
      uuid : this.uuid,
    }
    const xhr = new XMLHttpRequest()
    // xhr.withCredentials = true;
    xhr.open('POST' , Common.php_book , true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = this.progress.bind(this)
    const e = encodeURIComponent
    const q = Object.entries(query).map(([k, v]) => `${e(k)}=${e(v)}`).join('&')
    xhr.send(q)
  }
  progress(e){
    console.log(e.target.response)
  }

}