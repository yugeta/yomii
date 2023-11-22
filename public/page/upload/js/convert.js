import { Common }  from "./common.js"
import { Loading } from "../../../asset/js/loading/loading.js"
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"

export class Convert{
  static ext = "yomii"

  constructor(uuid){
    new Loading()
    Loading.set_status('active')

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
    // console.log(res);

    // converting
    if(res.status === "progress"){
      setTimeout(this.progress.bind(this) , 1500)
      const rate = res.current / res.page_count * 100
      // console.log("progress: ",rate,res.page_count, )
      Loading.set_rate(rate)
    }

    // converted
    else if(res.status === "success"){
      // console.log("finished !!")
      this.get_link()
      // this.auto_download()
      Loading.set_status('passive')
    }
  }

  get_link(){
    const query = {
      mode : "get_download_link",
      uuid : this.uuid,
    }
    const xhr = new XMLHttpRequest()
    xhr.open('POST' , Common.php_book , true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = this.set_link.bind(this)
    const e = encodeURIComponent
    const q = Object.entries(query).map(([k, v]) => `${e(k)}=${e(v)}`).join('&')
    xhr.send(q)
  }
  set_link(e){
    const json    = e.target.response
    const data    = JSON.parse(json)
    const a       = document.createElement("a")
    a.className   = "download"
    a.download    = data.name || (+new Date())+"."+ Convert.ext
    a.href        = new Urlinfo().dir + data.path
    a.textContent = data.name
    a.setAttribute("name" , data.name)
    document.querySelector("main").appendChild(a)
    this.auto_download(data.name)
  }

  auto_download(name){
    const a = document.querySelector(`a.download[name="${name}"]`)
    if(a){
      a.click()
    }
  }

  // download(){
  //   const query = {
  //     mode : "get_json",
  //     uuid : this.uuid,
  //   }
  //   const xhr = new XMLHttpRequest()
  //   xhr.open('POST' , Common.php_book , true)
  //   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  //   xhr.onload = this.download_dialog.bind(this)
  //   const e = encodeURIComponent
  //   const q = Object.entries(query).map(([k, v]) => `${e(k)}=${e(v)}`).join('&')
  //   xhr.send(q)
  // }
  // download_dialog(e){
  //   const json = e.target.response
  //   const data = JSON.parse(json)
  //   const blob = new Blob([json], { type: 'application/json' });
  //   const a    = document.createElement("a")
  //   a.download = data.name || (+new Date()) +"."+ Convert.ext
  //   a.href     = URL.createObjectURL(blob)
  //   a.click()
  // }
}