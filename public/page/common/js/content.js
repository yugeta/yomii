import { Urlinfo } from '../../../asset/js/lib/urlinfo.js'

export class Content{
  constructor(options){
    this.options = options || {}
    this.set_status_loading()
    this.load()
  }
  elm_root = document.querySelector('main')

  default_name = "index"

  get default_page_name(){
    return new Urlinfo().filename_name || this.default_name
  }

  get queries(){
    const query = location.search.replace(/^\?/,'')
    return Object.fromEntries(new Map(query.split('&').map(e => [e.split('=')[0],e.split('=').slice(1).join('=')]))) || {}
  }
  get page_name(){
    return this.queries.p || this.default_page_name
  }
  get file_name(){
    return this.queries.f || this.default_name
  }

  load(){
    const xhr = new XMLHttpRequest()
    xhr.open('get' , `page/${this.page_name}/${this.file_name}.html` , true)
    xhr.setRequestHeader('Content-Type', 'text/html');
    xhr.onload = this.loaded.bind(this)
    xhr.send()
  }

  loaded(e){
    const html = this.convert_html(e.target.response)
    // this.check_load_modules(main)
    this.elm_root.innerHTML = html
    // this.elm_root.parentNode.replaceChild(main, this.elm_root)
    // this.menu_load()
    // if(Asset.page_name === 'index'){
    //   // Asset.top_menu.innerHTML = Asset.aside_menu.querySelector(':scope > ul').innerHTML
    //   // Asset.aside_menu.style.display = 'none'
    // }

    this.set_scripts()
    // this.module_loaded(e)
  }

  convert_html(html){
    html = html.replace(/\{\{page_name\}\}/g, this.page_name)
    html = html.replace(/\{\{file_name\}\}/g, this.file_name)
    return html
  }

  // check_load_modules(main){
  //   const links = main.querySelectorAll('link')
  //   for(const link of links){
  //     // this.module_loading()
  //     // link.addEventListener('load' , this.module_loaded.bind(this))
  //   }

  //   // const scripts = main.querySelectorAll('script')
  //   // for(const script of scripts){
  //   //   if(!script.src){continue}
  //   //   this.module_loading()
  //   //   script.addEventListener('load' , this.module_loaded.bind(this))
  //   // }
  // }

  /* Scripts */
  set_scripts(){
    const scripts = Array.from(this.elm_root.querySelectorAll('script'))
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

  /* Loading */
  set_status_loading(){
    document.querySelector('html').setAttribute('data-status' , 'loading')
  }
  set_status_loaded(){
    document.querySelector('html').setAttribute('data-status' , 'loaded')
  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }

}
