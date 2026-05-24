<?php
/**
 * Google Drive 共有フォルダ プロキシ
 * 
 * 公開共有フォルダのIDを使って、認証なしでファイル一覧・ダウンロードを行う。
 * Google Drive API v3 + API Key を使用（OAuth 不要）。
 * 
 * エンドポイント:
 *   POST   ?action=list      共有フォルダのファイル一覧取得
 *   POST   ?action=download  ファイルダウンロード
 * 
 * 必要な環境変数（.env）:
 *   GOOGLE_DRIVE_API_KEY=AIza...
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

// API Key を .env から読み込み
$api_key = get_api_key();
if (!$api_key) {
    echo json_encode(['result' => 'error', 'message' => 'Google Drive API Key が設定されていません']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        handle_list($api_key);
        break;
    case 'download':
        handle_download($api_key);
        break;
    default:
        echo json_encode(['result' => 'error', 'message' => 'Invalid action']);
        break;
}

// ============================================================
// API Key 取得
// ============================================================
function get_api_key() {
    // 1. 環境変数から
    $key = getenv('GOOGLE_DRIVE_API_KEY');
    if ($key) return $key;

    // 2. .env ファイルから
    $env_paths = [
        __DIR__ . '/../../../.env',
        __DIR__ . '/../../../../.env',
    ];
    foreach ($env_paths as $path) {
        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0) continue;
                if (strpos($line, 'GOOGLE_DRIVE_API_KEY=') === 0) {
                    return trim(substr($line, strlen('GOOGLE_DRIVE_API_KEY=')));
                }
            }
        }
    }
    return null;
}

// ============================================================
// ファイル一覧（files.list）
// ============================================================
function handle_list($api_key) {
    $input = json_decode(file_get_contents('php://input'), true);
    $folder_id = $input['folder_id'] ?? '';

    if (!$folder_id) {
        echo json_encode(['result' => 'error', 'message' => 'フォルダIDが必要です']);
        return;
    }

    // Google Drive API v3 files.list
    // 公開共有フォルダの場合、API Key だけでアクセス可能
    $all_files = [];
    $page_token = '';

    do {
        $params = http_build_query([
            'q'        => "'{$folder_id}' in parents and trashed=false",
            'fields'   => 'nextPageToken,files(id,name,size,modifiedTime,mimeType)',
            'pageSize' => 1000,
            'key'      => $api_key,
            'pageToken'=> $page_token,
        ]);

        $url = "https://www.googleapis.com/drive/v3/files?{$params}";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
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

        if ($http_code !== 200) {
            $data = json_decode($response, true);
            $msg = $data['error']['message'] ?? "API エラー (HTTP {$http_code})";
            echo json_encode(['result' => 'error', 'message' => $msg]);
            return;
        }

        $data = json_decode($response, true);

        if (isset($data['files'])) {
            foreach ($data['files'] as $file) {
                $is_folder = ($file['mimeType'] ?? '') === 'application/vnd.google-apps.folder';
                $all_files[] = [
                    'name'      => $file['name'] ?? '',
                    'is_folder' => $is_folder,
                    'size'      => (int)($file['size'] ?? 0),
                    'modified'  => $file['modifiedTime'] ?? '',
                    'file_id'   => $file['id'] ?? '',
                ];
            }
        }

        $page_token = $data['nextPageToken'] ?? '';
    } while ($page_token);

    echo json_encode([
        'result' => 'success',
        'files'  => $all_files,
    ]);
}

// ============================================================
// ダウンロード（files.get alt=media）
// ============================================================
function handle_download($api_key) {
    $input = json_decode(file_get_contents('php://input'), true);
    $file_id = $input['file_id'] ?? '';

    if (!$file_id) {
        echo json_encode(['result' => 'error', 'message' => 'file_id が必要です']);
        return;
    }

    // まずファイル名を取得
    $meta_url = "https://www.googleapis.com/drive/v3/files/{$file_id}?" . http_build_query([
        'fields' => 'name,size,mimeType',
        'key'    => $api_key,
    ]);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $meta_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $meta_response = curl_exec($ch);
    $meta_http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($meta_http !== 200) {
        $data = json_decode($meta_response, true);
        $msg = $data['error']['message'] ?? "ファイル情報の取得に失敗しました (HTTP {$meta_http})";
        echo json_encode(['result' => 'error', 'message' => $msg]);
        return;
    }

    $meta = json_decode($meta_response, true);
    $filename = $meta['name'] ?? 'download';

    // ファイル本体をダウンロード
    $download_url = "https://www.googleapis.com/drive/v3/files/{$file_id}?" . http_build_query([
        'alt' => 'media',
        'key' => $api_key,
    ]);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $download_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 300,
    ]);

    $file_data = curl_exec($ch);
    $dl_http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $dl_error = curl_error($ch);
    curl_close($ch);

    if ($dl_error) {
        echo json_encode(['result' => 'error', 'message' => 'ダウンロード cURL error: ' . $dl_error]);
        return;
    }

    if ($dl_http !== 200) {
        echo json_encode(['result' => 'error', 'message' => "ダウンロード失敗 (HTTP {$dl_http})"]);
        return;
    }

    // バイナリデータをそのまま返す
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($file_data));
    echo $file_data;
}
