<?php

class Common{
  public static $shelf         = "data/shelf/";
  public static $temp          = "data/tmp/";
  public static $origin        = "original";
  public static $setting_file  = "setting.json";
  public static $progress_file = "progress.json";

  public static function get_uuid_dir($uuid=null){
    if(!$uuid){return;}
    $dir = dirname(__FILE__). "/../../../". Common::$temp . $uuid;
    return Common::normalize_path($dir);
  }

  public static function get_original_file($ext=null){
    $original_file_name = Common::$origin;
    return "{$original_file_name}.{$ext}";
  }

  public static function normalize_path($path=null){
    $normalize = realpath($path);
    return $normalize ? $normalize : $path;
  }

  public static function get_path($uuid=null, $ext=null){
    $dir  = rtrim(Common::get_uuid_dir($uuid) , DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    $file = Common::get_original_file($ext);
    return $dir . $file;
  }

  public static function get_setting_path($uuid=null){
    $path = Common::get_uuid_dir($uuid) .DIRECTORY_SEPARATOR. Common::$setting_file;
    return is_file($path) ? $path : null;
  }

  public static function get_setting_data($uuid=null){
    $path = Common::get_setting_path($uuid);
    if(!$path){return null;}
    $json = file_get_contents($path);
    return json_decode($json , true);
  }

  public static function get_book_json($uuid=null){
    return Common::get_uuid_dir($uuid) .".json";
  }

  public static function get_progress_path($uuid=null){
    return Common::get_uuid_dir($uuid) .DIRECTORY_SEPARATOR. Common::$progress_file;
  }

  public static function progress_save($uuid=null , $data=[]){
    $data["status"] =  "progress";
    $data["start"]  = $data["time_start"] ? $data["time_start"] : time();
    $data["time"]   = time() - $data["start"];
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $path = Common::get_progress_path($uuid);
    return file_put_contents($path , $json);
  }
  public static function progress_load($uuid=null){//die('["'.$uuid.'"]');
    if(!$uuid){
      return '{"status":"error","message":"no-uuid"}';
    }

    $progress_path = Common::get_progress_path($uuid);
    if($progress_path && is_file($progress_path)){
      return file_get_contents($progress_path);
    }

    $json_path = Common::get_book_json($uuid);
    if($json_path && is_file($json_path)){
      $data = [
        "status" => "success",
        "uuid"   => $uuid,
      ];
      return json_encode($data , JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    
    return '{"status":"error","message":"no-file","progress-file":"'.$progress_path.'","json-file":"'.$json_path.'"}';
  }
}