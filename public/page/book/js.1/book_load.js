import { Element }  from './element.js'
import { Book }     from './book.js'
import { Urlinfo }  from '../../../asset/js/lib/urlinfo.js'

export class BookLoad{
  constructor(file_data){
    this.book_up(file_data)
  }

  book_up(file_data){
    if(!file_data){return}
    const fileReader = new FileReader();
    fileReader.onload = (e => {
      Element.main.setAttribute("rel" , "book")
			const json = e.target.result
      const data = JSON.parse(json)
      Book.data = data
      this.change_url(data)
      new Book({data : data})
		})
		fileReader.readAsText(file_data)
  }

  change_url(data){
    const name = data.name
    new Urlinfo().add_query("book" , name)
  }
}