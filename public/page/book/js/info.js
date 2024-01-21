/**
 * Info
 * - アップロードしたファイルの各種情報を取得する
 */
export class Info{
  constructor(file){
    const file_sp  = file.name.split(".")
    const ext       = file_sp.pop()
    const file_type = file.type ? file.type.split("/") : null

    this.filename = file.name
    this.size     = file.size
    this.type     = file.type
    this.name     = file_sp.join(".")
    this.ext      = file_type && file_type.length === 2 ? file_type[1].toLowerCase() : ext.toLowerCase()
    this.file     = file
  }
}