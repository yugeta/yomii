import { Urlinfo }   from './lib/urlinfo.js'
import { Login }     from './login.js'

export class Menu{
  constructor(){
    this.set_lists()
    this.set_active()
    this.set_tooltip()
    this.hidden_login_bool()
    this.hidden_auth()
    this.check_auth()
    this.check_content()
  }
  get urlinfo(){
    return new Urlinfo()
  }
  get page_name(){
    return this.urlinfo.queries.p || ''
  }
  get file_name(){
    return this.urlinfo.queries.f || ''
  }

  get area(){
    return document.querySelector('menu')
  }

  static get default_page_name(){
    return 'index'
  }

  set_lists(){
    const lists = []
    const elms = document.querySelectorAll('header .menu a[href], menu nav a[href]')
    for(const elm of elms){
      const href = elm.getAttribute('href')
      const queries = this.get_url_queries(href)
      const parent = 
      lists.push({
        href    : href,
        page    : queries.p || '',
        file    : queries.f || '',
        current : this.is_current(queries),
        logined : elm.closest(`[data-logined]`) ? true : false,
        unlogin : elm.closest(`[data-unlogin]`) ? true : false,
        auth    : this.get_auth_num(elm),
      })
    }
    Menu.lists = lists
  }
  is_current(queries){
    if((queries.p || '') === this.page_name
    && (queries.f || '') === this.file_name){
      return true
    }
    else{
      return false
    }
  }
  get_auth_num(elm){
    if(!elm){return null}
    const elm_auth = elm.closest(`[data-auth]`)
    if(!elm_auth){return null}
    const auth = elm_auth.getAttribute('data-auth')
    if(!auth){return null}
    return Number(auth)
  }

  get_href2page_name(href){
    const queries = Object.fromEntries(new URLSearchParams(href))
    return queries.p || null
  }
  get_url_queries(href){
    return Object.fromEntries(new URLSearchParams(href))
  }

  set_active(){
    const page_name = this.page_name
    const elms = document.querySelectorAll('header .menu a[href], menu nav a[href]')
    if(!elms){return}
    for(const elm of elms){
      const href = elm.getAttribute('href')
      if(!href){continue}
      const queries = this.get_url_queries(href.replace(/^\.\//,''))
      if(page_name === queries.p
      || (!queries.p && (!page_name || page_name === Menu.default_page_name))){
        elm.setAttribute('data-status' , 'active')
        // 子階層の場合、階層を開く
        const parent = elm.closest(`menu nav > ul > li`)
        if(parent && parent.querySelector('label')){
          parent.querySelector(`:scope > input[type='checkbox']`).checked=true
        }
      }
    }
  }

  set_tooltip(){
    this.area.addEventListener('mouseover' , this.area_mouseover.bind(this))
    this.area.addEventListener('mouseout'  , this.area_mouseout.bind(this))
  }
  area_mouseover(e){
    const target_li = e.target.closest('menu nav ul > li')
    if(!target_li){return}
    const target = target_li.querySelector(':scope > a , :scope > label')
    if(!target){return}
    const name = target.textContent.trim()
    if(this.get_tooltip(name)){return}
    this.make_tooltip(name , target)
  }
  area_mouseout(e){
    this.clear_tooltips()
  }
  get_tooltip(name){
    return document.querySelector(`.menu-tooltip[data-name='${name}']`)
  }
  make_tooltip(name , target){
    const div = document.createElement('div')
    div.classList.add('menu-tooltip')
    div.setAttribute('data-name' , name)
    div.textContent = name
    document.body.appendChild(div)
    const rect = target.getBoundingClientRect()
    const pos = {
      x : rect.width,
      y : rect.top,
    }
    div.style.setProperty('height' , `${rect.height}px` , '')
    div.style.setProperty('line-height' , `${rect.height}px` , '')
    div.style.setProperty('left' , `${pos.x}px` , '')
    div.style.setProperty('top'  , `${pos.y}px` , '')
  }
  clear_tooltips(){
    const elms = document.querySelectorAll('.menu-tooltip')
    for(let i=elms.length-1; i>=0; i--){
      elms[i].parentNode.removeChild(elms[i])
    }
  }

  // data-logined
  // data-unlogin
  hidden_login_bool(){
    // logined
    if(Login.is_logined){
      const menus = document.querySelectorAll(`nav [data-unlogin]`)
      for(const elm of menus){
        elm.parentNode.removeChild(elm)
      }
    }
    else{
      const menus = document.querySelectorAll(`nav [data-logined]`)
      for(const elm of menus){
        elm.parentNode.removeChild(elm)
      }
    }
    
  }
  // data-auth='%auth-id'
  hidden_auth(){
    const data = Login.load_cache() || {}
    // console.log(data)
    const menus = document.querySelectorAll(`body nav [data-auth]`)
    for(const elm of menus){
      const auth_code = elm.getAttribute('data-auth')
      if(data && auth_code && Number(auth_code) === data.auth_code){continue}
      elm.parentNode.removeChild(elm)
    }
  }

  check_auth(){
    const active_page_elm   = document.querySelector(`nav a[data-status='active']`)
    if(!active_page_elm){return}
    const href = active_page_elm.getAttribute('href')
    // logined
    if(active_page_elm.hasAttribute('data-logined')){
      if(!Login.is_logined && this.page_name === this.get_href2page_name(href)){
        this.move_root()
      }
    }
  }

  move_root(){
    location.href = './'
  }

  // 対象外の権限ページを表示しようとした時は、indexにリダイレクトする
  check_content(){
    const login_data = Login.load_cache()
    const current_menu = Menu.lists.find(e => e.current === true)
    if(!current_menu){return}

    // console.log(Menu.lists,login_data,current_menu)
    // console.log(current_menu.logined,'===',Login.is_logined)
    // console.log(current_menu.unlogin,'!==',Login.is_logined)
    // console.log(current_menu.auth,'===',login_data.user.auth_code)

    if(!current_menu.logined && !current_menu.unlogin && !current_menu.auth){
      // console.log('no')
      return
    }

    if(!current_menu){return}

    // logined
    if(current_menu.logined && current_menu.logined !== Login.is_logined){
      location.href = './'
      // console.log('no-logined')
    }
    // unlogin
    if(current_menu.unlogin && current_menu.unlogin === Login.is_logined){
      location.href = './'
      // console.log('no-unlogin')
    }
    // auth
    if(current_menu.auth && login_data && login_data.user && current_menu.auth !== login_data.user.auth_code){
      location.href = './'
      // console.log('no-auth')
    }
  }

}