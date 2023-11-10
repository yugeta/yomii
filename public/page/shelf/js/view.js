

export class View{
  constructor(options){
    // console.log(options)
    this.options = options || {}
    // this.folders = this.options.datas.filter(e => e.type === 'dir')
    // this.files   = this.options.datas.filter(e => e.type === 'file')
    this.clear()
    this.view_items()
    this.set_icons()
  }

  elm_root = document.querySelector(`ul.lists`)

  clear(){
    this.elm_root.innerHTML = ""
  }

  view_items(){
    let id = 0
    for(const data of this.options.datas){
      data.id = id
      const li = document.createElement('li')
      li.setAttribute("data-id"   , data.id)
      li.setAttribute("data-type" , data.type)
      this.set_icon(li, data.type)
      this.set_name(li, data.name)
      this.elm_root.appendChild(li)
      id++
    }
  }

  set_icon(li, type){
    li.setAttribute("data-type" , type)
    const div = document.createElement('div')
    div.className = "icon"
    li.appendChild(div)
  }

  set_name(li, name){
    li.setAttribute("data-name" , name)
    const div = document.createElement('div')
    div.className = "name"
    li.appendChild(div)
    div.textContent = name
  }

  load(data){
    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true;
    const name = data.type === 'dir' ? 'folder' : 'book'
    xhr.open('GET' , `page/shelf/img/${name}.svg` , true)
    xhr.setRequestHeader("Content-Type", "image/svg+xml");
    xhr.onload = this.loaded.bind(this, data)
    xhr.send()
  }
  loaded(data, e){
    switch(data.type){
      case 'dir':
        this.icon_dir = e.target.response
        break
      case 'file':
        this.icon_file = e.target.response
        break
    }
    this.view_icon(data)
  }
  view_icon(data){
    const icon = document.querySelector(`ul.lists li[data-id="${data.id}"] .icon`)
    if(icon){
      switch(data.type){
        case 'dir':
          icon.innerHTML = this.icon_dir
          break
        case 'file':
          icon.innerHTML = this.icon_file
          break
      }
    }
    this.set_icons()
  }


  set_icons(){
    if(!this.options.datas.length){
      this.finish()
      return
    }
    const data = this.options.datas.shift()
    switch(data.type){
      case 'dir':
        if(this.icon_dir){
          this.view_icon(data)
        }
        else{
          this.load(data)
        }
        break
      case 'file':
        if(this.icon_file){
          this.view_icon(data)
        }
        else{
          this.load(data)
        }
        break
    }
  }

  finish(){
    if(this.options.callback){
      this.options.callback(this)
    }
  }
}
