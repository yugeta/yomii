import { Urlinfo } from './lib/urlinfo.js'

export class SetCss{
  constructor(script_tag){
    if(!script_tag){return}
    const src  = script_tag.getAttribute('src')
    const urlinfo = new Urlinfo(src)
    const link = document.createElement('link')
    link.rel   = 'stylesheet'
    link.href  = `${urlinfo.origin}/${urlinfo.dir}/markdown.css`
    script_tag.parentNode.insertBefore(link , script_tag)
  }
}
