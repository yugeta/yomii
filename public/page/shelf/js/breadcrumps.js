import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"
import { generate_breadcrumbs } from "../../storage/js/google_drive_utils.js"

export class Breadcrumps{
  constructor(){
    const params = new URLSearchParams(location.search)
    const dir = params.get("dir") || ''
    if(!dir){return}
    this.clear()
    this.dir = dir
    this.source = params.get("source") || "local"
    this.create_links()
    this.view()
  }
  elm = document.querySelector(`.breadcrumps`)

  clear(){
    this.elm.innerHTML = ""
  }

  create_links(){
    // Google Drive の場合は generate_breadcrumbs ユーティリティを使用
    if(this.source === "google_drive"){
      const crumbs = generate_breadcrumbs(this.dir)
      if(!crumbs) return
      this.links = crumbs.slice(1).map(c => ({ dir: c.path, name: c.name }))
      this.root_name = "Yomii"
      return
    }

    const dirs = this.dir.split('/')
    const links = []
    for(let i=0; i<dirs.length; i++){
      const dir = dirs.slice(0,i+1).join('/')
      links.push({
        dir  : dir,
        name : decodeURIComponent(dirs[i].replace(/\+/g, ' ')),
      })
    }
    this.links = links
    this.root_name = "Top"
    return links
  }

  view(){
    const url = new Urlinfo().url
    const params = new URLSearchParams(location.search)
    const source = params.get("source") || "local"
    const source_id = params.get("source_id") || ""
    const code = params.get("code") || ""

    // 共通パラメータを構築するヘルパー
    const build_params = (dir) => {
      const p = new URLSearchParams()
      p.set("p", "shelf")
      p.set("source", source)
      if(source_id) p.set("source_id", source_id)
      if(code) p.set("code", code)
      if(dir) p.set("dir", dir)
      return p.toString()
    }

    {
      const a = document.createElement('a')
      a.textContent = this.root_name || 'Top'
      a.href = `${url}?${build_params("")}`
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
        a.href = `${url}?${build_params(link.dir)}`
        this.elm.appendChild(a)
        this.elm.innerHTML += " / "
      }
    }
  }


}