import { SetCss }  from './set_css.js'
import { Convert } from './convert.js'

export class Markdown{
  constructor(string){
    new SetCss(this.my_script)
    
    if(string){
      this.text = new Convert(string).text
    }
    else{
      for(const elm of this.elms){
        elm.innerHTML = new Convert(elm.textContent).text
        elm.setAttribute('data-markdown' , 'converted')
      }
    }
  }

  get key(){
    return 'markdown'
  }

  get elms(){
    return document.querySelectorAll(`.${this.key}`)
  }

  get my_script(){
    return document.querySelector(`script#${this.key}`)
  }

}

