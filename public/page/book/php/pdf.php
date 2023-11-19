<?php

require_once dirname(__FILE__). "/common.php";

class Pdf{
  public static $info = [];
  var $temp_dir = "data/tmp/";
  var $setting  = [];
  var $quality  = 50;
  var $max_size = 1000;

  function __construct($setting=[]){
    if(!$setting){return;}
    $this->setting = $setting;
  }

  function convert(){
    $dir  = $this->setting["tmp_dir"];
    $out  = "{$dir}/out-singlefile";
    $file = $dir .DIRECTORY_SEPARATOR. $this->setting["origin_file"];
    $jsons = [];
    for($i=0; $i<$this->setting["page_count"]; $i++){
      $page_num = $i+1;
      $page_str = sprintf("%05d", $page_num);

      // progress
      $progress_data = [
        "page_count" => $this->setting["page_count"],
        "current"    => $page_num,
      ];
      Common::progress_save($this->setting["uuid"] , $progress_data);

      // png変換
      $out_path = "{$dir}/out-{$page_str}";
      $png_path = "{$out_path}.png";
      $this->pdf2png($file , $out_path , $page_num);

      // webp変換
      $webp_path = "{$dir}/out-{$page_str}.webp";
      $this->png2webp($png_path, $webp_path);
      
      // json変換
      $json = $this->webp2json($webp_path);
      $jsons[$i] = $json;
      echo $i ." @ ". $png_path ." @ ". $webp_path .PHP_EOL;
    }
    $json_path = $this->setting["tmp_dir"].".json";
    $datas = [
      "setting" => $this->setting,
      "datas"   => $jsons,
    ];
    $json = json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    file_put_contents($json_path, $json);
    $this->delete_tmp_dir();
  }

  function pdf2png($pdf_file=null, $out_path=null , $page=1){
    $cmd = "pdftoppm -png {$pdf_file} {$out_path} -f {$page} -l {$page} -cropbox -singlefile";
    exec($cmd);
    $num = sprintf("%03d" , $page);
    return "{$out_path}-{$num}.png";
  }
  
  function png2webp($png_path=null, $webp_path=null, $quality=null){
    if(!is_file($png_path)){return;}
    $quality = $quality ? $quality : $this->quality;
    $png_image = imagecreatefrompng($png_path);
    $png_image = $this->resize_image($png_image);
    imagewebp($png_image , $webp_path, $quality);
    // unlink($png_path);
  }

  function resize_image($image=null){
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

  function webp2json($webp_path=null){
    if(!$webp_path || !is_file($webp_path)){return;}
    $num  = sprintf("%03d" , $page);
    $base64 = base64_encode(file_get_contents($webp_path));
    // unlink($webp_path);
    return $base64;
  }

  function delete_tmp_dir(){
    if(!is_dir($this->setting["tmp_dir"])){return;}
    exec("rm -rf ".$this->setting["tmp_dir"] , $res);
    return $res;
  }

  function delete_temp($tmp_dir=null){
    if(!is_dir($tmp_dir)){return;}
    die($tmp_dir);
    exec("rm -rf {$tmp_dir}");
  }
}