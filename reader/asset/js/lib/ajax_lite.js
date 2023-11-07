
export class AjaxLite{
  constructor(options){
    this.options = options || {}
    const xhr = new XMLHttpRequest()
    xhr.open(this.options.post ?? 'get' , this.options.url , this.options.async ?? true)
    xhr.setRequestHeader('Content-Type', 'text/html');
    xhr.onreadystatechange = (e => {
      if(xhr.readyState !== XMLHttpRequest.DONE){return}
      const status = xhr.status;
      if (status === 0 || (status >= 200 && status < 400)) {
        this.loaded({data : e.target.response})
      }
      else {
        this.options.file = 'assets/html/404.html'
        new Asset(this.options)
        // this.loaded()
      }
    }).bind(this)
    console.log(options.query)
    const queries = this.convert_query(options.query)
    xhr.send(queries)
  }

  convert_query(query){
    query = query || {}
    return Object.entries(options.query).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&')
  }

  loaded(){

  }
}