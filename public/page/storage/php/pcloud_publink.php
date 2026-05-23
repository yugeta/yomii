<?php
/**
 * pCloud 公開リンク プロキシ
 * 
 * 公開リンクコードを使って、認証なしでファイル一覧・ダウンロードを行う。
 * getpublinkdownload は Web アプリからの直接呼び出しが制限されているため、
 * PHP プロキシ経由でアクセスする。
 * 
 * エンドポイント:
 *   POST   ?action=list      公開フォルダのファイル一覧取得
 *   POST   ?action=download  公開リンクからファイルダウンロード
 *   POST   ?action=debug     デバッグ用: pCloud API の生レスポンスを返す
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
    case 'list':
        handle_list();
        break;
    case 'download':
        handle_download();
        break;
    case 'debug':
        handle_debug();
        break;
    default:
        echo json_encode(['result' => 'error', 'message' => 'Invalid action']);
        break;
}

// ============================================================
// ファイル一覧（showpublink）
// ============================================================
function handle_list() {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = $input['code'] ?? '';

    if (!$code) {
        echo json_encode(['result' => 'error', 'message' => '公開リンクコードが必要です']);
        return;
    }

    // pCloud API: showpublink（認証不要）
    $url = 'https://api.pcloud.com/showpublink?code=' . urlencode($code);

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
        echo json_encode(['result' => 'error', 'message' => "API エラー (HTTP $http_code)"]);
        return;
    }

    $data = json_decode($response, true);

    if (!$data || ($data['result'] ?? -1) !== 0) {
        $error_msg = get_pcloud_error_message($data['result'] ?? -1);
        echo json_encode(['result' => 'error', 'message' => $error_msg, 'pcloud_error' => $data['result'] ?? null]);
        return;
    }

    // メタデータからファイル一覧を構築
    $metadata = $data['metadata'] ?? [];
    $files = [];

    if (isset($metadata['contents']) && is_array($metadata['contents'])) {
        foreach ($metadata['contents'] as $item) {
            $files[] = [
                'name'      => $item['name'] ?? '',
                'is_folder' => !empty($item['isfolder']),
                'size'      => $item['size'] ?? 0,
                'modified'  => $item['modified'] ?? '',
                'fileid'    => $item['fileid'] ?? null,
                'folderid'  => $item['folderid'] ?? null,
            ];
        }
    }

    echo json_encode([
        'result'      => 'success',
        'folder_name' => $metadata['name'] ?? '',
        'files'       => $files,
    ]);
}

// ============================================================
// ダウンロード（getpublinkdownload）
// ============================================================
function handle_download() {
    $input = json_decode(file_get_contents('php://input'), true);
    $code   = $input['code'] ?? '';
    $fileid = $input['fileid'] ?? '';

    if (!$code || !$fileid) {
        echo json_encode(['result' => 'error', 'message' => 'code と fileid が必要です']);
        return;
    }

    // Step 1: ダウンロードリンクを取得
    $url = 'https://api.pcloud.com/getpublinkdownload?code=' . urlencode($code) . '&fileid=' . urlencode($fileid) . '&forcedownload=1';

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

    $data = json_decode($response, true);

    if (!$data || ($data['result'] ?? -1) !== 0) {
        $error_msg = get_pcloud_error_message($data['result'] ?? -1);
        echo json_encode(['result' => 'error', 'message' => $error_msg]);
        return;
    }

    $hosts = $data['hosts'] ?? [];
    $path  = $data['path'] ?? '';

    if (empty($hosts) || !$path) {
        echo json_encode(['result' => 'error', 'message' => 'ダウンロードリンクを取得できませんでした']);
        return;
    }

    // Step 2: 実際にファイルをダウンロード
    $download_url = 'https://' . $hosts[0] . $path;

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $download_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 300,
    ]);

    $file_data = curl_exec($ch);
    $dl_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $dl_error = curl_error($ch);
    curl_close($ch);

    if ($dl_error) {
        echo json_encode(['result' => 'error', 'message' => 'ダウンロード cURL error: ' . $dl_error]);
        return;
    }

    if ($dl_http_code !== 200) {
        echo json_encode(['result' => 'error', 'message' => "ダウンロード失敗 (HTTP $dl_http_code)"]);
        return;
    }

    // バイナリデータをそのまま返す
    $filename = basename(urldecode($path));
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($file_data));
    echo $file_data;
}

// ============================================================
// デバッグ: pCloud API の生レスポンスを返す
// ============================================================
function handle_debug() {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = $input['code'] ?? '';

    if (!$code) {
        echo json_encode(['result' => 'error', 'message' => 'code が必要です']);
        return;
    }

    $url = 'https://api.pcloud.com/showpublink?code=' . urlencode($code);

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

    echo json_encode([
        'debug'     => true,
        'api_url'   => $url,
        'http_code' => $http_code,
        'curl_error'=> $error,
        'raw_response' => json_decode($response, true),
    ]);
}

// ============================================================
// ユーティリティ
// ============================================================

/**
 * pCloud エラーコードからメッセージを返す
 */
function get_pcloud_error_message($code) {
    $messages = [
        1028 => '公開リンクコードが指定されていません。',
        7001 => '無効なリンクコードです。',
        7002 => 'このリンクはオーナーによって削除されています。',
        7004 => 'このリンクは有効期限切れです。',
        7005 => 'このリンクのトラフィック制限に達しました。',
        7006 => 'このリンクのダウンロード回数制限に達しました。',
    ];
    return $messages[$code] ?? "pCloud API エラー (code: $code)";
}
