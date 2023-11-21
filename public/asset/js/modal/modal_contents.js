import { Convert } from '../lib/convert.js'

/**
 * # 注意
 * - 対象ボタン等のelementの親要素にposition:relativeをセットしないと、モーダルの座標がズレる。
 */

export class ModalContents{
  constructor(){
    this.set_css()
    window.addEventListener('click' , this.click_window)
  }

  static get modal_class_name(){
    return 'modal-contents'
  }
  static get modal_list(){
    return document.querySelector(`.${ModalContents.modal_class_name}`)
  }

  get head(){
    return document.querySelector('head')
  }

  get css_class(){
    return 'mynt-modal-contents'
  }

  set_css(){
    if(document.querySelector(`head link.${this.css_class}`)){return false}
    const js_url = import.meta.url.split('/modal_contents.js')
    const link = document.createElement('link')
    link.classList.add(this.css_class)
    link.rel = 'stylesheet'
    link.href = `${js_url[0]}/modal_contents.css`
    this.head.appendChild(link)
    return true
  }

  click_window(e){
    if(e.target.closest(`.${ModalContents.modal_class_name}`)){return}
    if(e.target === ModalContents.elm){return}
    ModalContents.close()
  }

  static access(options){
    if(!options){return}
    ModalContents.options = options || {}
    if(ModalContents.check() === true){return}
    ModalContents.close()
    setTimeout(ModalContents.view , 0)
  }

  static check(){
    if(ModalContents.options.datas.length === 1
    && ModalContents.options.elm.value === ModalContents.options.datas[0].name){
      return true
    }
  }

  static view(){
    
    const div = document.createElement('div')
    div.className = ModalContents.modal_class_name
    div.setAttribute('data-pos' , ModalContents.options.position || '')
    ModalContents.options.elm.parentNode.appendChild(div)
    const pos = ModalContents.get_pos()
    div.style.setProperty('left'  , `${pos.x}px` , '')
    div.style.setProperty('top'   , `${pos.y}px` , '')

    const ul = document.createElement('ul')
    ul.onclick = ModalContents.click
    div.appendChild(ul)

    for(const data of ModalContents.options.datas){
      if(ModalContents.options.asset){
        const html = new Convert(ModalContents.options.asset).double_bracket(data)
        ul.insertAdjacentHTML('beforeend' , html)
      }
      else{
        const li = document.createElement('li')
        li.textContent = data.name
        li.setAttribute('data-id' , data.id)
        ul.appendChild(li)
      }
    }
  }

  static get_pos(){
    // const rect = ModalContents.options.elm.getBoundingClientRect()
    // console.log(rect.top,ModalContents.options.elm.offsetTop)
    // console.log(ModalContents.options.elm.offsetTop)
    switch(ModalContents.options.position){
      case 'top':
        return {
          x : ModalContents.options.elm.offsetLeft,
          y : ModalContents.options.elm.offsetTop,
          w : ModalContents.options.elm.offsetWidth,
        }
        // return {
        //   x : rect.left,
        //   y : rect.top,
        //   w : rect.wifth,
        // }
      case 'bottom':
      default:
        return {
          x : ModalContents.options.elm.offsetLeft,
          y : ModalContents.options.elm.offsetTop + ModalContents.options.elm.offsetHeight,
          w : ModalContents.options.elm.offsetWidth,
        }
    }
  }

  static click(e){
    const li = e.target.closest('li')
    if(!li){return}
    ModalContents.change_func(li)
    ModalContents.close()
  }

  static close(){
    if(!ModalContents.modal_list){return}
    ModalContents.modal_list.parentNode.removeChild(ModalContents.modal_list)
  }

  static change_func(data){
    if(!ModalContents.options.callback){return}
    ModalContents.options.callback(data)
  }
}