

export class UpperSelector{
  constructor(elm , selectors){
    if(!elm || !selectors){return}
    this.elm = elm
    this.selectors = selectors
  }
  // 上位階層をselectorで選択する機能
  get target(){
    this.selectors = typeof this.selectors === "object" ? this.selectors : [this.selectors]
    let cur, flg = null
    for(let i=0; i<this.selectors.length; i++){
      if(!this.selectors[i]){continue}
      for(cur=this.elm; cur; cur=cur.parentElement) {
        if(!cur.matches(this.selectors[i])){continue}
        flg = true
        break
      }
      if(flg){break}
    }
    return cur
  }
}