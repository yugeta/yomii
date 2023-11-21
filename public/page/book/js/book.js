

export class Book{
  static data = null
  constructor(options){
    this.options = options || {}
    Book.data = this.options.book
    this.sample()
  }

  static area = document.querySelector(`.book-area`)

  sample(){
    const img = new Image()
    img.src = `data:image/webp;base64,${Book.data.datas[0]}`
    Book.area.appendChild(img)
  }
}
