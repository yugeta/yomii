
export class Wareki{

  static get era(){
    return [
      {
        w : "明治",
        y : 1868,
        m : 9,
        d : 8,
        a : "m",
        A : "M",
      },
      {
        w : "大正",
        y : 1912,
        m : 7,
        d : 30,
        a : "t",
        A : "T",
      },
      {
        w : "昭和",
        y : 1926,
        m : 12,
        d : 25,
        a : "s",
        A : "S",
      },
      {
        w : "平成",
        y : 1989,
        m : 1,
        d : 8,
        a : "h",
        A : "H",
      },
      {
        w : "令和",
        y : 2019,
        m : 5,
        d : 1,
        a : "r",
        A : "R",
      },
    ]
  }

  constructor(options){
    if(!options){return}
    this.options = options
    switch(options.type){
      default:
        this.yyyymmdd2wareki()
    }
  }

  // 

  // 西暦(y,m,d) -> 和暦(g:元号 , y:年 , m:月 , d:日)
  yyyymmdd2wareki(){
    const gengo = this.conv_gengo()
    const wy = gengo ? this.options.year - gengo.y : null
    this.data =  {
    ...gengo,
    ...{
      wy : wy,
      m : this.options.month,
      d : this.options.date,
    }}
  }
  conv_gengo(year){
    let target = null
    for(const era of Wareki.era){
      const target_date = Date.parse(`${this.options.year}-${this.options.month}-${this.options.date}`)
      const era_date    = Date.parse(`${era.y}-${era.m}-${era.d}`)
      if(target_date >= era_date){
        target = era
      }
    }
    return target
  }

}