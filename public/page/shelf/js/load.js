

export class Load{
  constructor(options){
    this.options = options || {}
    this.load()
  }
  load(){
    const query = {
      mode : 'lists',
      dir  : this.options.dir,
    }
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true;
    xhr.open('POST' , 'page/shelf/php/main.php' , true)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = this.loaded.bind(this)
    const query_string = Object.entries(query).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
    xhr.send(query_string)
  }
  loaded(e){
    if(!e || !e.target || !e.target.response){return}
    const res = JSON.parse(e.target.response)
    this.datas = res.lists
    this.finish()
  }
  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}