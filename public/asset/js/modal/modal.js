/**
 * Modal
 * 
 * ex --
   new Modal({
   caption : 'ラベルを削除する',
    content : this.modal_content,
    buttons : [
      {
        label : 'cancel',
        click : (()=>{
          this.current_item.setAttribute('data-status' , '')
          this.modal.close()}
        ).bind(this),
        style : {
          width : '30%',
        },
      },
      {
        label : '削除',
        click : this.modal_click_label_delete.bind(this),
        style : {
          width : '30%',
        },
      },
    ],
   })
 * -----
 */
export class Modal{
  constructor(options){
    this.options = options || {}
    this.id = 'modal_'+ (+new Date())
    
    if(this.add_css() === false){
      this.init()
    }
  }
  get window(){
    return document.querySelector(`.modal_window[data-id='${this.id}']`)
  }
  static get windows(){
    return document.querySelectorAll(`.modal_window`)
  }
  get content(){
    return this.window.querySelector('.modal_content')
  }
  static get bg(){
    return document.querySelector(`.modal_bg`)
  }
  get css_class(){
    return 'mynt-modal'
  }
  init(){
    this.view_bg()
    this.view()
    this.loaded()
  }

  add_css(){
    if(document.querySelector(`head link.${this.css_class}`)){return false}
    const js_url = import.meta.url.split('/modal.js')
    const link = document.createElement('link')
    link.classList.add(this.css_class)
    link.rel = 'stylesheet'
    link.href = `${js_url[0]}/modal.css`
    link.onload = this.init.bind(this)
    document.querySelector('head').appendChild(link)
    return true
  }

  make_area(){
    const div = document.createElement('div')
    div.className = 'modal_window'
    div.setAttribute('data-active','before')
    div.setAttribute('data-id' , this.id)
    div.appendChild(this.make_close())
    div.appendChild(this.make_title())
    div.appendChild(this.make_caption())
    div.appendChild(this.make_content())
    div.appendChild(this.make_buttons())
    return div
  }
  make_title(){
    const div = document.createElement('div')
    div.className = 'modal_title'
    div.innerHTML = this.options.title || ''
    return div
  }
  make_caption(){
    const div = document.createElement('div')
    div.className = 'modal_caption'
    div.innerHTML = this.options.caption || ''
    return div
  }
  make_content(){
    const div = document.createElement('div')
    div.className = 'modal_content'
    div.insertAdjacentHTML('beforeend' , this.options.content || '')
    return div
  }
  make_close(){
    const div = document.createElement('div')
    div.className = 'modal_close'
    div.addEventListener('click' , this.close.bind(this))
    return div
  }
  make_buttons(){
    if(!this.options.buttons || !this.options.buttons.length){return}
    const div = document.createElement('div')
    div.className = 'modal_buttons'
    for(const button_data of this.options.buttons){
      const btn = document.createElement('button')
      btn.className = 'modal_button'
      btn.textContent = button_data.label || button_data.name || '--'
      if(button_data.click){
        btn.addEventListener('click' , button_data.click)
      }
      if(button_data.style){
        for(const key in button_data.style){
          btn.style[key] = button_data.style[key]
        }
      }
      div.appendChild(btn)
    }
    return div
  }
  view(){
    this.area = this.make_area()
    document.body.appendChild(this.area)
    setTimeout(this.view_init.bind(this) , 0)
  }
  view_init(){
    this.area.setAttribute('data-active' , 'true')
  }
  view_bg(){
    if(Modal.bg){return}
    const bg = document.createElement('div')
    bg.className = 'modal_bg'
    document.body.appendChild(bg)
    return true
  }

  close(){
    // const elms = Modal.windows
    // for(const elm of elms){
    //   elm.parentNode.removeChild(elm)
    // }
    // if(Modal.bg){
    //   Modal.bg.parentNode.removeChild(Modal.bg)
    // }
    Modal.close()
  }

  static close(){
    const elms = Modal.windows
    for(const elm of elms){
      elm.parentNode.removeChild(elm)
    }
    if(Modal.bg){
      Modal.bg.parentNode.removeChild(Modal.bg)
    }
  }

  loaded(){
    if(!this.options.loaded){return}
    this.options.loaded()
  }

}