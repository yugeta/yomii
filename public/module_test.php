<?php

header('Content-Type: text/html');

echo "<meta charset='utf-8'/>";



echo "<pre>";
echo "<h1>Book Viewer YoMii! ホゲ</h1>";

$shelf = "data/shelf/";
$dir   = $_GET['dir'];
$book  = $_GET['book'];
$path  = "{$shelf}{$dir}{$book}";

echo is_file($path)." @ ".$path.PHP_EOL;

// echo function_exists("ZipArchive");

// new ZipArchive();

// echo "<p>archive-inner-files</p>";

// require_once "page/book/php/archive.php";

// $pageArchiveName = "sample";
// echo 'unarj -f -D -o "data/path/" "'.$path.'" "'. $pageArchiveName .'"';
// exec('unarj -f -D -o "data/path/" "'.$path.'" "'. $pageArchiveName .'"');
// echo $path.PHP_EOL;

// exec("lsar '{$path}'" , $res1);
// print_r($res1);

// exec("bsdtar -tf '{$path}'" , $res2);
// print_r($res2);

// echo "<h2>linux-command</h2>";
// exec("unzip -Z1 '{$path}'" , $res1);
// exec("unzip -p '{$path}' '{$res1[2]}'" , $res2);
// print_r($res1[2]);
// echo PHP_EOL;
// print_r($res2);

// echo phpinfo();

echo "<h2>page-lists</h2>";
$zip = new ZipArchive;
 $zip->open($path);
// echo $zip->statName();
// print_r($lists);
// var_dump($zip->getArchiveComment());
// ZIPアーカイブを開く
$numFiles = $zip->numFiles;
for($i=0; $i<$numFiles; $i++){
    // $fileInfo = $zip->statIndex($i);
    // // echo $fileInfo['name'] . PHP_EOL;
    // print_r($fileInfo);

    $name = $zip->getNameIndex($i) .PHP_EOL;
    $name = trim($name);
    if(preg_match("/\/$/", $name)){continue;}
    // echo $name." @ ".get_ext($name).PHP_EOL;
    switch(get_ext($name)){
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "webp":
            print_r($zip->statIndex($i));
            break;
    }
    
}
$zip->close();

// echo "<h2>page-view</h2>";
// $zip = new ZipArchive;
// if ($zip->open($path) === TRUE) {
//     echo $zip->getFromIndex(2);
//     $zip->close();
// } else {
//     echo '失敗';
// }

function get_ext($file_name=null){
    if(!$file_name){return;}
    // $file_name = trim($file_name);
    if(!strstr($file_name, ".")){return;}
    $sp = explode(".", $file_name);
    return $sp[count($sp)-1];
}





