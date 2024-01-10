import { Data }     from "./data.js"
import { Book }     from "./book.js"

export class Init{
  constructor(options){
    if(!options || !options.data){return}
    Data.data = options.data || null
    new Book()
  }
}