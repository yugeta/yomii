<?php

/**
 * 対象のディレクトリ内のフォルダとファイルを階層毎にリスト取得する処理
 * @return object ["type","name"]
 */

class Lists{
  public static $dir = __DIR__. "/../../../data/shelf/";

  public static function get_path($dir=null){
    if($dir){
      if(!preg_match("/\/$/",$dir)){
        $dir .= "/";
      }
      return Lists::$dir . $dir;
    }
    else{
      return Lists::$dir;
    }
  }

  public static function scan($data=[]){
    $path = urldecode(self::get_path($data["dir"]));
    if(!$path || !is_dir($path)){return;}
    $scans = scandir($path);
    $lists = [];
    for($i=0; $i<count($scans); $i++){
      if($scans[$i] === "." || $scans[$i] === ".."){continue;}
      if(preg_match("/^\./", $scans[$i])){continue;}
      $lists[] = [
        "type" => Lists::get_type($path.$scans[$i]),
        "name" => $scans[$i],
      ];
    }
    return [
      "dir"   => Lists::$dir,
      "lists" => $lists,
    ];
  }

  public static function get_type($path=null){
    // $path = Lists::$dir.$file_name;
    if(is_dir($path)){
      return "dir";
    }
    if(is_file($path)){
      return "file";
    }
  }

  public static function json($data=[]){
    $lists = Lists::scan($data);
    if($lists){
      echo json_encode($lists , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
  }
}