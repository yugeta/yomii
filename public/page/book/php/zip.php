<?php

require_once dirname(__FILE__). "/common.php";

class Zip{
  public static $info = [];
  var $temp_dir = "data/tmp/";
  var $setting  = [];
  var $quality  = 50;
  var $max_size = 1000;

  function __construct($setting=null){
    if(!$setting){return;}
    $this->setting = $setting;
  }

  function convert(){
    $zip      = new ZipArchive;
    $dir      = $this->setting["tmp_dir"];
    $file     = $dir .DIRECTORY_SEPARATOR. $this->setting["origin_file"];
    $zip->open($file);
    $jsons    = [];
    $names    = [];
    for($i=0; $i<$this->setting["page_count"]; $i++){
      $name = $zip->getNameIndex($i);
      $name = trim($name);
      // progress
      $progress_data = [
        "page_count" => $this->setting["page_count"],
        "current"    => $i+1,
      ];
      Common::progress_save($this->setting["uuid"] , $progress_data);

      // フォルダの場合は処理を飛ばす
      if(!$name || preg_match("/\/$/", $name)){continue;}
      // 画像ファイルのみをたいしょうにする。
      $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
      if(!$this->is_target_ext($ext)){continue;}
      $data = $zip->getFromIndex($i);
      $image = imagecreatefromstring($data);
      $image = $this->resize_image($image, $ext);
      $num = sprintf("%05d" , $i);
      $webp_path = "{$dir}/out-{$num}.webp";
      echo $webp_path.PHP_EOL;
      imagewebp($image , $webp_path , $this->quality);
      imagedestroy($image);
      $base64 = base64_encode(file_get_contents($webp_path));
      $jsons[] = $base64;
    }
    $zip->close();
    $json_path = $this->setting["tmp_dir"].".json";
    $this->setting["page_count"] = count($jsons);
    $datas = [
      "setting" => $this->setting,
      "datas"   => $jsons,
    ];
    $json = json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    file_put_contents($json_path, $json);
    $this->delete_tmp_dir();
  }

  function is_target_ext($ext=null){
    switch($ext){
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return true;
      default:
       return false;
    }
  }

  function resize_image($image=null, $ext=null){
    $max_size = 1000;
    $x1 = imagesx($image);
    $y1 = imagesy($image);
    $x2 = $y2 = $max_size;
    // landscape
    if($x1 > $y1){
      if($x1 < $max_size){
        return $image;
      }
      $rate = $x1 / $max_size;
      $x2 = $max_size;
      $y2 = floor($y1 / $rate);

    }
    // horizontal
    else{
      if($y1 < $max_size){
        return $image;
      }
      $rate = $y1 / $max_size;
      $y2 = $max_size;
      $x2 = floor($x1 / $rate);
    }
    $image2 = imagecreatetruecolor($x2, $y2);
    imagecopyresampled($image2, $image, 0, 0, 0, 0, $x2, $y2, $x1, $y1);
    return $image2;
  }

  function delete_tmp_dir(){
    if(!is_dir($this->setting["tmp_dir"])){return;}
    exec("rm -rf ".$this->setting["tmp_dir"] , $res);
    return $res;
  }
}