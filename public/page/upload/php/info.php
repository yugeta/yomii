<?php

class Info{
  var $info = [];

  function __construct($name=null, $path=null){
    $ext = pathinfo($name, PATHINFO_EXTENSION);
    switch($ext){
      case "zip":
        $this->info = $this->zip($path);
        break;

      case "pdf":
        $this->info = $this->pdf($path);
        break;

      case "epub":
        $this->info = $this->epub($path);
        break;
    }
    $this->info["ext"]  = $ext;
    $this->info["size"] = filesize($path);
  }

  function zip($path=null){
    $zip = new ZipArchive;
    $zip->open($path);
    $datas = [
      "book"  => $path,
      "ext"   => "zip",
      "pages" => $zip->numFiles,
    ];
    $zip->close();
    return $datas;
  }

  function pdf($path=null){
    $cmd = "pdfinfo {$path}";
    $datas = [
      "book" => $path,
    ];
    exec($cmd , $res);
    for($i=0; $i<count($res); $i++){
      if(!$res[$i]){continue;}
      $sp = explode(":", $res[$i]);
      $key = trim($sp[0]);
      $val = trim($sp[1]);
      // blank
      if($val === ""){
        $datas[$key] = null;
      }
      // number
      else if(preg_match("/^\d+?$/" , $val)){
        $datas[$key] = (int)$val;
      }
      // string
      else{
        $datas[$key] = $val;
      }
    }

    return [
      "book"  => $path,
      "ext"   => "pdf",
      "pages" => $datas["Pages"],
    ];
  }

  function epub($path=null){
    return [];
  }
}
