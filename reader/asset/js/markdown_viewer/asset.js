import { Main }      from './main.js'
// import { Login }     from './login.js'

export class Asset{
  constructor(options){
    this.options = options || {}
    if(!this.file || !this.elm){return}
    this.load()
  }

  get file(){
    return this.options.file
  }
  get elm(){
    return document.querySelector(this.options.selector)
  }
  get page_name(){
    return Main.urlinfo.queries.p || 'index'
  }
  get file_name(){
    return Main.urlinfo.queries.f || 'index'
  }

  load(){
    const dt = (+new Date())
    const xhr = new XMLHttpRequest()
    xhr.open('get' , `${this.file}?${dt}` , true)
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
      }
    }).bind(this)
    xhr.send()
  }

  loaded(res){
    if(res && res.data){
      let html = this.convert_string(res.data)
      this.elm.insertAdjacentHTML('beforeend' , html)
      this.set_scripts()
    }
    this.finish()
  }
  convert_string(str){
    str = str.replace(/{{page_name}}/g, this.page_name)
    str = str.replace(/{{file_name}}/g, this.file_name)
    return str
  }

  set_scripts(){
    const scripts = Array.from(this.elm.querySelectorAll('script'))
    this.set_script(scripts)
  }

  set_script(scripts){
    if(!scripts || !scripts.length){return}
    const target_script = scripts.shift()
    if(target_script.getAttribute('src')){
      this.set_script_src(target_script , scripts)
    }
    else{
      this.set_script_inner(target_script , scripts)
    }
  }

  set_script_src(berfore_script , scripts){
    const new_script = document.createElement('script')
    new_script.onload = (scripts => {
      this.set_script(scripts)
    }).bind(this , scripts)
    this.copy_attributes(berfore_script , new_script)
    new_script.setAttribute('data-set',1)
    berfore_script.parentNode.insertBefore(new_script , berfore_script)
    berfore_script.parentNode.removeChild(berfore_script)
  }
  set_script_inner(berfore_script , scripts){
    const script_value = berfore_script.textContent
    Function('(' + script_value + ')')();
    this.set_script(scripts)
  }

  copy_attributes(before_elm , after_elm){
    if(!before_elm || !after_elm){return}
    const attributes = before_elm.attributes
    if(!attributes || !attributes.length){return}
    for(const attr of attributes){
      after_elm.setAttribute(attr.nodeName , attr.nodeValue)
    }
  }

  finish(){
    if(!this.options.callback){return}
    this.options.callback(this)
  }

  is_login_page(html){
    if(!html){return}
    const dom = new DOMParser();
    const doc = dom.parseFromString(html, 'text/html')
    const check_login = doc.querySelector(`input[name='check_login']`)
    if(check_login){return true}
  }
}