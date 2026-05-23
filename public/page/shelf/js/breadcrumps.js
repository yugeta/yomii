import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"

export class Breadcrumps{
  constructor(){
    const params = new URLSearchParams(location.search)
    const dir = params.get("dir") || ''
    if(!dir){return}
    this.clear()
    this.dir = dir
    this.create_links()
    this.view()
  }
  elm = document.querySelector(`.breadcrumps`)

  clear(){
    this.elm.innerHTML = ""
  }

  create_links(){
    const dirs = this.dir.split('/')
    const links = []
    for(let i=0; i<dirs.length; i++){
      const dir = dirs.slice(0,i+1).join('/')
      links.push({
        dir  : dir,
        name : decodeURIComponent(dirs[i].replace(/\+/g, ' ')),
      })
    }
    this.links =  links
    return links
  }

  view(){
    const url = new Urlinfo().url
    const source = new URLSearchParams(location.search).get("source") || "local"
    {
      const a = document.createElement('a')
      a.textContent = 'Top'
      a.href = `${url}?p=shelf&source=${source}`
      this.elm.appendChild(a)
      this.elm.innerHTML += " / "
    }
    for(let i = 0; i < this.links.length; i++){
      const link = this.links[i]
      const is_current = (i === this.links.length - 1)
      if(is_current){
        const span = document.createElement('span')
        span.textContent = link.name
        span.className = 'breadcrumps-current'
        this.elm.appendChild(span)
      }else{
        const a = document.createElement('a')
        a.textContent = link.name
        a.href = `${url}?p=shelf&source=${source}&dir=${encodeURIComponent(link.dir)}`
        this.elm.appendChild(a)
        this.elm.innerHTML += " / "
      }
    }
  }


}