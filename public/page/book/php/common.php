<?php

class Common{
  public static $shelf        = "data/shelf/";
  public static $temp         = "data/tmp/";
  public static $origin       = "original";
  public static $setting_file = "setting.json";

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
}