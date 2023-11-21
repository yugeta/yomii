export class ModalList{
  constructor(){
    this.set_css()
    window.addEventListener('click' , this.click_window)
  }

  get head(){
    return document.querySelector('head')
  }

  get css_class(){
    return 'mynt-modal-lists'
  }

  set_css(){
    if(document.querySelector(`head link.${this.css_class}`)){return false}
    const js_url = import.meta.url.split('/modal_list.js')
    const link = document.createElement('link')
    link.classList.add(this.css_class)
    link.rel = 'stylesheet'
    link.href = `${js_url[0]}/modal_list.css`
    this.head.appendChild(link)
    return true
  }

  click_window(e){
    if(e.target.closest(`.${ModalList.modal_class_name}`)){return}
    if(e.target === ModalList.elm){return}
    ModalList.close()
  }

  static get modal_class_name(){
    return 'modal-list'
  }
  static get modal_list(){
    return document.querySelector(`.${ModalList.modal_class_name}`)
  }

  static access(elm , datas , click){
    if(!elm || !datas){return}
    ModalList.elm   = elm
    ModalList.datas = datas
    ModalList.click_callback = click
    if(ModalList.check() === true){return}
    ModalList.close()
    setTimeout(ModalList.view , 0)
  }

  static check(){
    if(ModalList.datas.length === 1
    && ModalList.elm.value === ModalList.datas[0].name){
      return true
    }
  }

  static view(){
    const x = ModalList.elm.offsetLeft
    const y = ModalList.elm.offsetTop + ModalList.elm.offsetHeight
    const w = ModalList.elm.offsetWidth
    const ul = document.createElement('ul')
    ul.className = ModalList.modal_class_name
    ul.onclick = ModalList.click
    ul.style.setProperty('left'  , `${x}px` , '')
    ul.style.setProperty('top'   , `${y}px` , '')
    ul.style.setProperty('width' , `${w}px` , '')
    ModalList.elm.parentNode.appendChild(ul)
    for(const data of ModalList.datas){
      const li = document.createElement('li')
      li.textContent = data.name
      li.setAttribute('data-id' , data.id)
      ul.appendChild(li)
    }
  }

  static click(e){
    const li = e.target.closest('li')
    if(!li){return}
    ModalList.change_func({
      id   : li.getAttribute('data-id'),
      name : li.textContent
    })
    ModalList.close()
  }

  static close(){
    if(!ModalList.modal_list){return}
    ModalList.modal_list.parentNode.removeChild(ModalList.modal_list)
  }

  static change_func(data){
    if(!ModalList.click_callback){return}
    ModalList.click_callback(data)
  }
}