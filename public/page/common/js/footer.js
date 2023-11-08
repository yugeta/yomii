export class Footer{
  constructor(options){
    this.options = options || {}
    this.load()
  }
  path = "page/common/html/footer.html"

  load(){
    const xhr = new XMLHttpRequest()
    xhr.open('GET' , this.path , true)
    xhr.setRequestHeader("Content-Type", "text/html");
    xhr.onload = this.loaded.bind(this)
    xhr.send()
  }

  loaded(e){
    document.body.insertAdjacentHTML('beforeend' , e.target.response)
    this.finish()
  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}