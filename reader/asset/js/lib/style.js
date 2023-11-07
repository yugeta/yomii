
export class Style{
  constructor(){

  }

  search_value(selector , property , sheets){
    sheets = sheets || document.styleSheets
    let val = ''
    for(const sheet of sheets){
      if(this.diff_ownerNode(sheet.ownerNode)){continue}
      const res = this.get_rules(selector , property , sheet.cssRules)
      val = res || val
    }
    return val
  }

  diff_ownerNode(node){
    if(node.nodeName !== 'LINK'){return}
    const baseUri = node.baseURI.split('/')[2]
    const href    = node.href.split('/')[2]
    if(baseUri !== href){return true}
  }

  get_rules(selector , property , rules){
    let val = ''
    for(const rule of rules){
      if(rule.href){
        const res = this.get_rules(selector , property , rule.styleSheet.cssRules)
        val = res || val
      }
      else{
        const res = this.get_value(selector , property , rule)
        val = res || val
      }
    }
    return val
  }
  get_value(selector , property , rule){
    if(rule.selectorText === selector){
      const reg = new RegExp(property+'(.*?):(.+?);')
      const res = rule.cssText.match(reg)
      return res && res.length && res[2] ? res[2] : ''
    }
  }
}