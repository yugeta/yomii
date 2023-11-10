import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"

export class Breadcrumps{
  constructor(){
    const dir = new Urlinfo().queries.dir || ''
    if(!dir){return}
    this.clear()
    this.dir = decodeURI(dir)
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
      // if(dir){continue}
      links.push({
        dir  : dir,
        name : dirs[i],
      })
    }
    // console.log(links)
    this.links =  links
    return links
  }

  view(){
    // this.elm.textContent = this.dir
    const url = new Urlinfo().url
    {
      const a = document.createElement('a')
      a.textContent = 'Top'
      a.href = `${url}?p=shelf`
      this.elm.appendChild(a)
      this.elm.innerHTML += "/"
    }
    for(const link of this.links){
      const a = document.createElement('a')
      a.textContent = link.name
      a.href = `${url}?p=shelf&dir=${link.dir}`
      this.elm.appendChild(a)
      this.elm.innerHTML += "/"
    }
  }


}