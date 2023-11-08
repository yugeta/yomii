/**
 * ゼロパディング（桁数を合わせる）
 * 0 -> '00'
 * new ZeroPadding(0 , '00')
 */
export class ZeroPadding{
  constructor(num , digits){
    this.num = num || 0
    this.digits_str = digits || '00'
  }
  
  get digit(){
    return (this.digits_str + String(this.num)).slice(-2)
  }
}