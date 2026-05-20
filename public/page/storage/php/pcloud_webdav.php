<?php
/**
 * pCloud WebDAV プロキシ
 * 
 * ブラウザからのリクエストを受けて、pCloud WebDAV に中継する。
 * CORS の問題を回避し、認証情報をサーバー経由で送信する。
 * 
 * エンドポイント:
 *   POST   ?action=upload    ファイルアップロード
 *   POST   ?action=list      ファイル一覧取得
 *   POST   ?action=download  ファイルダウンロード
 *   POST   ?action=mkdir     フォルダ作成
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// POST のみ受け付け
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['result' => 'error', 'message' => 'POST only']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'upload':
        handle_upload();
        break;
    case 'list':
        handle_list();
        break;
    case 'download':
        handle_download();
        break;
    case 'mkdir':
        handle_mkdir();
        break;
    default:
        echo json_encode(['result' => 'error', 'message' => 'Invalid action']);
        break;
}

// ============================================================
// アップロード
// ============================================================
function handle_upload() {
    $email    = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $path     = $_POST['path'] ?? '/yomii/';
    $filename = $_POST['filename'] ?? '';

    if (!$email || !$password) {
        echo json_encode(['result' => 'error', 'message' => '認証情報が必要です']);
        return;
    }

    if (!isset($_FILES['file'])) {
        echo json_encode(['result' => 'error', 'message' => 'ファイルが指定されていません']);
        return;
    }

    $file = $_FILES['file'];
    if (!$filename) {
        $filename = $file['name'];
    }

    // パスの正規化
    $path = rtrim($path, '/') . '/';
    $remote_path = $path . $filename;

    // WebDAV PUT
    $url = 'https://webdav.pcloud.com' . rawurlencode_path($remote_path);
    
    $fp = fopen($file['tmp_name'], 'r');
    if (!$fp) {
        echo json_encode(['result' => 'error', 'message' => 'ファイルを開けません']);
        return;
    }

    $filesize = filesize($file['tmp_name']);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_PUT            => true,
        CURLOPT_INFILE         => $fp,
        CURLOPT_INFILESIZE     => $filesize,
        CURLOPT_USERPWD        => $email . ':' . $password,
        CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 300,
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    fclose($fp);

    if ($error) {
        echo json_encode(['result' => 'error', 'message' => 'cURL error: ' . $error]);
        return;
    }

    // 201 Created or 204 No Content = 成功
    if ($http_code === 201 || $http_code === 204) {
        echo json_encode([
            'result'   => 'success',
            'filename' => $filename,
            'path'     => $remote_path,
            'size'     => $filesize,
        ]);
    } elseif ($http_code === 401) {
        echo json_encode(['result' => 'error', 'message' => '認証に失敗しました。メールアドレスまたはパスワードを確認してください。']);
    } elseif ($http_code === 507) {
        echo json_encode(['result' => 'error', 'message' => 'ストレージ容量が不足しています。']);
    } else {
        echo json_encode(['result' => 'error', 'message' => "アップロード失敗 (HTTP $http_code)", 'response' => $response]);
    }
}

// ============================================================
// ファイル一覧
// ============================================================
function handle_list() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email    = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $path     = $input['path'] ?? '/yomii/';

    if (!$email || !$password) {
        echo json_encode(['result' => 'error', 'message' => '認証情報が必要です']);
        return;
    }

    $path = rtrim($path, '/') . '/';
    $url = 'https://webdav.pcloud.com' . rawurlencode_path($path);

    // PROPFIND リクエスト
    $xml_body = '<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getcontentlength/>
    <D:getlastmodified/>
    <D:resourcetype/>
  </D:prop>
</D:propfind>';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_CUSTOMREQUEST  => 'PROPFIND',
        CURLOPT_POSTFIELDS     => $xml_body,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/xml',
            'Depth: 1',
        ],
        CURLOPT_USERPWD        => $email . ':' . $password,
        CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo json_encode(['result' => 'error', 'message' => 'cURL error: ' . $error]);
        return;
    }

    if ($http_code === 401) {
        echo json_encode(['result' => 'error', 'message' => '認証に失敗しました。']);
        return;
    }

    if ($http_code !== 207) {
        echo json_encode(['result' => 'error', 'message' => "一覧取得失敗 (HTTP $http_code)"]);
        return;
    }

    // XML パース
    $files = parse_propfind_response($response, $path);
    echo json_encode(['result' => 'success', 'files' => $files]);
}

// ============================================================
// ダウンロード
// ============================================================
function handle_download() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email    = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $filepath = $input['filepath'] ?? '';

    if (!$email || !$password || !$filepath) {
        echo json_encode(['result' => 'error', 'message' => 'パラメータが不足しています']);
        return;
    }

    $url = 'https://webdav.pcloud.com' . rawurlencode_path($filepath);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_USERPWD        => $email . ':' . $password,
        CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 300,
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        header('Content-Type: application/json');
        echo json_encode(['result' => 'error', 'message' => 'cURL error: ' . $error]);
        return;
    }

    if ($http_code === 401) {
        header('Content-Type: application/json');
        echo json_encode(['result' => 'error', 'message' => '認証に失敗しました。']);
        return;
    }

    if ($http_code === 404) {
        header('Content-Type: application/json');
        echo json_encode(['result' => 'error', 'message' => 'ファイルが見つかりません。']);
        return;
    }

    if ($http_code !== 200) {
        header('Content-Type: application/json');
        echo json_encode(['result' => 'error', 'message' => "ダウンロード失敗 (HTTP $http_code)"]);
        return;
    }

    // バイナリデータをそのまま返す
    $filename = basename($filepath);
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($response));
    echo $response;
}

// ============================================================
// フォルダ作成
// ============================================================
function handle_mkdir() {
    $input = json_decode(file_get_contents('php://input'), true);
    $email    = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $path     = $input['path'] ?? '';

    if (!$email || !$password || !$path) {
        echo json_encode(['result' => 'error', 'message' => 'パラメータが不足しています']);
        return;
    }

    $path = rtrim($path, '/') . '/';
    $url = 'https://webdav.pcloud.com' . rawurlencode_path($path);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_CUSTOMREQUEST  => 'MKCOL',
        CURLOPT_USERPWD        => $email . ':' . $password,
        CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 30,
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo json_encode(['result' => 'error', 'message' => 'cURL error: ' . $error]);
        return;
    }

    if ($http_code === 201) {
        echo json_encode(['result' => 'success', 'message' => 'フォルダを作成しました', 'path' => $path]);
    } elseif ($http_code === 405) {
        // 既に存在する
        echo json_encode(['result' => 'success', 'message' => 'フォルダは既に存在します', 'path' => $path]);
    } elseif ($http_code === 401) {
        echo json_encode(['result' => 'error', 'message' => '認証に失敗しました。']);
    } else {
        echo json_encode(['result' => 'error', 'message' => "フォルダ作成失敗 (HTTP $http_code)"]);
    }
}

// ============================================================
// ユーティリティ
// ============================================================

/**
 * パスの各セグメントを URL エンコード（/ はそのまま）
 */
function rawurlencode_path($path) {
    $segments = explode('/', $path);
    $encoded = array_map('rawurlencode', $segments);
    return implode('/', $encoded);
}

/**
 * PROPFIND レスポンスの XML をパースしてファイル一覧を返す
 */
function parse_propfind_response($xml_string, $base_path) {
    // pCloud の WebDAV レスポンスは複雑な名前空間を使うため、
    // 正規表現パーサーを使用する
    return parse_propfind_regex($xml_string, $base_path);
}

/**
 * 正規表現によるフォールバックパーサー
 */
function parse_propfind_regex($xml_string, $base_path) {
    $files = [];
    
    // <D:response ...> ... </D:response> ブロックを抽出
    preg_match_all('/<D:response[^>]*>(.*?)<\/D:response>/s', $xml_string, $matches);
    
    if (empty($matches[1])) {
        // D: なしも試す
        preg_match_all('/<response[^>]*>(.*?)<\/response>/s', $xml_string, $matches);
    }

    if (empty($matches[1])) return $files;

    $clean_base = rtrim(urldecode($base_path), '/');

    foreach ($matches[1] as $block) {
        // href
        preg_match('/<D:href>(.*?)<\/D:href>/', $block, $href_match);
        if (empty($href_match[1])) {
            preg_match('/<href>(.*?)<\/href>/', $block, $href_match);
        }
        if (empty($href_match[1])) continue;
        $href = urldecode($href_match[1]);
        
        $clean_href = rtrim($href, '/');
        if ($clean_href === $clean_base || $clean_href === '') continue;

        // フォルダ判定: <D:collection/> が含まれるか
        $is_folder = (bool)preg_match('/<D:collection\s*\/>/', $block);
        
        // href が / で終わる場合もフォルダ
        if (!$is_folder && substr(trim($href_match[1]), -1) === '/') {
            $is_folder = true;
        }

        // サイズ（lp1:getcontentlength または D:getcontentlength）
        preg_match('/<(?:lp1:|D:|g0:)?getcontentlength>(.*?)<\/(?:lp1:|D:|g0:)?getcontentlength>/', $block, $size_match);
        $size = !empty($size_match[1]) ? (int)$size_match[1] : 0;

        // 更新日時
        preg_match('/<(?:lp1:|D:|g0:)?getlastmodified>(.*?)<\/(?:lp1:|D:|g0:)?getlastmodified>/', $block, $mod_match);
        $modified = !empty($mod_match[1]) ? $mod_match[1] : '';

        $name = basename(rtrim($href, '/'));

        $files[] = [
            'name'      => $name,
            'path'      => $href,
            'is_folder' => $is_folder,
            'size'      => $is_folder ? 0 : $size,
            'modified'  => $modified,
        ];
    }

    return $files;
}
