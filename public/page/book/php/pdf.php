<?php


// set_time_limit(120);
require_once 'vendor/autoload.php';
// require_once dirname(__FILE__) .'/../../../plugin/FPDI/src/autoload.php';
// require_once dirname(__FILE__) .'/../../../plugin/FPDI/src/Tfpdf/Fpdi.php';
// use setasign\Fpdi\Tfpdf\FpdfTpl;
use setasign\Fpdi\Fpdi;
// require_once dirname(__FILE__) .'/../../../plugin/FPDI/src/Fpdi.php';

class Pdf{
  var $temp_dir = "data/tmp/";
  var $uuid     = null;
  var $filepath = null;
  // var $zip = null;
  var $datas    = [];
  var $quality  = 30;
  var $max_size = 1000;

  function __construct($filepath=null){
    if(!$filepath){return;}
    $this->filepath = dirname(__FILE__) ."/../../../".$filepath;
    $this->uuid = date("YmdHis") ."_". uniqid();
    $out_path = $this->temp_dir.$this->uuid."/";
    $this->make_dir($out_path);
    $this->pdf2png($this->filepath , $out_path);
    $this->png2webp($out_path, $this->quality);
    // die($this->filepath);
    // echo is_file($this->filepath)." @ ".$this->filepath.PHP_EOL;

    // pdftoppm
    // $cmd = 'pdfimages "'.$this->filepath.'" -f '.($pageNum+1).' -l '. ($pageNum+1) .' -'. $cmd_ext_option .' '. $archiveDir .'file';
    // pdf->png
    // $cmd = "pdftoppm -png {$this->filepath} {$this->temp_dir}out -cropbox";
    // exec($cmd);
    // 

    // // ImageMagick
    // // $pdfFilePath = 'path/to/your/file.pdf';
    // $outputImagePath = 'path/to/output/image.png';

    // // ImageMagickを使用してPDFの最初のページを画像に変換
    // // echo $this->filepath[0].PHP_EOL;
    // exec("convert {$this->filepath} out.png");

    // echo "Image saved as $outputImagePath";

    /*
    // FPDI
    // initiate FPDI
    $pdf = new Fpdi();
    $file = $this->filepath;
    $pageCount = $pdf->setSourceFile($file);
    echo $pageCount;exit();
    
    $tplId  = $pdf->importPage(1);
    $pdf->useTemplate($tplId, 10, 10, 100);
    $pdf->Output(); 
    // echo $pageData;
    // print_r($pageCount);
    // // add a page
    // $pdf->AddPage();
    // // set the source file
    // // $pdf->setSourceFile("Fantastic-Speaker.pdf");
    // $pdf->setSourceFile($filepath);
    // // import page 1
    // $tplId = $pdf->importPage(1);
    // // use the imported page and place it at point 10,10 with a width of 100 mm
    // $pdf->useTemplate($tplId, 10, 10, 100);

    // $pdf->Output();   
    */

    // $this->zip = new ZipArchive;
    // $this->set_lists();
  }

  function make_dir($dir=null){
    if(!is_dir($dir)){
      mkdir($dir , 0777 , true);
    }
  }

  function pdf2png($pdf_file=null, $out_path=null){
    $cmd = "pdftoppm -png {$pdf_file} {$out_path}out -cropbox";
    // $cmd = "pdftoppm -png {$pdf_file} {$out_path}out -f 1 -l 1 -cropbox";
    exec($cmd);
  }
  
  function png2webp($out_path=null, $quality=50){
    $files = scandir($out_path);
    for($i=0; $i<count($files); $i++){
      if(!preg_match("/^(.+?)\.png$/", $files[$i] , $match)){continue;}
      $path = $out_path. $files[$i];
      $png = imagecreatefrompng($path);
      $png = $this->resize_image($png);
      $webp_file = $out_path. $match[1].".webp";
      imagewebp($png , $webp_file, $quality);
      if(is_file($webp_file)){
        unlink($path);
      }
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





  function set_lists(){
    $this->zip->open($this->filepath);
    $page_count = $this->zip->numFiles;
    $pages = [];
    for($i=0; $i<$page_count; $i++){
      $name = $this->zip->getNameIndex($i);
      $name = trim($name);
      if(preg_match("/\/$/", $name)){continue;}
      $ext = $this->get_ext($name);
      switch($ext){
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "webp":
          $data = $this->zip->statIndex($i);
          $data["ext"] = $ext;
          $pages[] = $data;
          break;
      }
    }
    $this->zip->close();
    $this->datas = $pages;
    return $pages;
  }

  function page2index($page=null){
    return $this->datas[$page]["index"];
  }

  function page2info($page=null){
    return $this->datas[$page];
  }

  function get_ext($file_name=null){
    if(!$file_name){return;}
    if(!strstr($file_name, ".")){return;}
    $sp = explode(".", $file_name);
    return $sp[count($sp)-1];
  }

  function page2ext($page=null){
    if($page===null){return;}
    return $this->datas[$page]['ext'];
  }

  function get_page($page=null){
    if($page === null){return;}
    $index = $this->page2index($page);
    $this->zip->open($this->filepath);
    $data = $this->zip->getFromIndex($index);
    $this->zip->close();
    return $data;
  }

  function img($page=null){
    if($page === null){return;}
    $ext    = $this->page2ext($page);
    $data   = $this->get_page($page);
    $image = imagecreatefromstring($data);
    header('Content-Type: image/webp');
    imagewebp($image);
  }

  function page($page=null){
    return [
      "data" => $this->get_page($page),
      "ext"  => $this->page2ext($page),
    ];
  }

  function get_temp_dir($uuid=null){
    $uuid = date("YmdHis") ."_". ($uuid ? $uuid : uniqid());
    if(!is_dir($this->temp_dir. $uuid)){
      mkdir($this->temp_dir. $uuid , 0777 , true);
    }
    return $this->temp_dir. $uuid."/";
  }

  function convert_book(){
    $dir = dirname(__FILE__) ."/../../../";
    $tmp_dir = $this->create_temp();
    $json = $this->create_json($dir.$tmp_dir);
    echo $json;
    // $this->delete_temp($dir.$tmp_dir);
    file_put_contents($dir.$tmp_dir."data.json" , $json);
    return;
  }

  function create_temp(){
    $start_time = microtime(true);
    $quality = 30;
    $tmp_dir = $this->get_temp_dir();
    for($i=0; $i<count($this->datas); $i++){
      $data  = $this->get_page($i);
      $ext   =  $this->page2ext($i);
      $image = imagecreatefromstring($data);
      $image = $this->resize_image($image, $ext);

      $num = sprintf("%05d" , $i);
      imagewebp($image , "{$tmp_dir}{$num}.webp" , $quality);
      imagedestroy($image);
    }
    return $tmp_dir;
    // return $tmp_dir." @ ".count($this->datas)." @ ". (microtime(true) - $start_time);
  }

  

  function create_json($tmp_dir=null){
    $files = scandir($tmp_dir);
    $datas = [];
    for($i=0; $i<count($files); $i++){
      if(!preg_match("/\.webp$/", $files[$i])){continue;}
      $data = file_get_contents($tmp_dir. $files[$i]);
      $datas[] = base64_encode($data);
    }
    return json_encode($datas , JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  }

  function delete_temp($tmp_dir=null){
    if(!is_dir($tmp_dir)){return;}
    die($tmp_dir);
    exec("rm -rf {$tmp_dir}");
  }
}