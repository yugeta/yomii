
export class ThreeComma{
  constructor(){
    const elms = document.querySelectorAll(`[data-string-type='three-comma'], .three-comma`)
    for(const elm of elms){
      this.convert(elm)
    }
  }
  convert(elm){
    elm.textContent = Number(elm.textContent).toLocaleString()
  }
}
