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
    xhr.onload = this.loaded.bind(this)
    const e = encodeURIComponent
    const q = Object.entries(query).map(([k, v]) => `${e(k)}=${e(v)}`).join('&')
    xhr.send(q)
  }
  loaded(e){
    // this.progress()
    setTimeout(this.progress.bind(this) , 3000)
  }

  progress(){
    const query = {
      mode : "convert_progress",
      uuid : this.uuid,
    }
    const xhr = new XMLHttpRequest()
    xhr.open('POST' , Common.php_book , true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = this.progressed.bind(this)
    const e = encodeURIComponent
    const q = Object.entries(query).map(([k, v]) => `${e(k)}=${e(v)}`).join('&')
    xhr.send(q)

  }
  progressed(e){
    if(!e || !e.target || !e.target.response){
      console.log("response-error");
      return
    }
    const res = JSON.parse(e.target.response)
    console.log(res);

    // converting
    if(res.status === "progress"){
      setTimeout(this.progress.bind(this) , 3000)
    }

    // converted
    else if(res.status === "success"){
      console.log("finished !!")
      this.download()
    }
  }

  download(){
    const query = {
      mode : "get_json",
      uuid : this.uuid,
    }
    const xhr = new XMLHttpRequest()
    xhr.open('POST' , Common.php_book , true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = this.download_dialog.bind(this)
    const e = encodeURIComponent
    const q = Object.entries(query).map(([k, v]) => `${e(k)}=${e(v)}`).join('&')
    xhr.send(q)
  }
  download_dialog(e){
    const json = e.target.response
    const data = JSON.parse(json)
    const blob = new Blob([json], { type: 'application/json' });
    const a    = document.createElement("a")
    a.download = data.name || (+new Date())+".json"
    a.href     = URL.createObjectURL(blob)
    a.click()
  }
}