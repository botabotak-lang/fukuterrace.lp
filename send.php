<?php
// fukuterrace-LP/send.php
// ログ出力あり・CRLF改行コード・完全個別送信版

// ログ設定
ini_set('log_errors', 'On');
ini_set('error_log', __DIR__ . '/php_error.log');
$debug_log = __DIR__ . '/debug_log.txt';

function writeLog($msg) {
    global $debug_log;
    $date = date('Y-m-d H:i:s');
    file_put_contents($debug_log, "[$date] $msg\n", FILE_APPEND);
}

writeLog("--- Access Started ---");

mb_language('Japanese');
mb_internal_encoding('UTF-8');

header('Access-Control-Allow-Origin: *');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    writeLog("Method not allowed: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    exit;
}

// 送信先リスト
$recipients = [
    'info@fukuterrace.jp',
    'yamasa@sanosekizai.com',
    'h.shiga69@gmail.com',
    'botabotak@gmail.com'
];

$from_email = 'info@fukuterrace.jp';
$from_name = '福てらす墓園';

// 入力取得
$mode = $_POST['mode'] ?? 'unknown';
$lastName = trim($_POST['lastName'] ?? '');
$firstName = trim($_POST['firstName'] ?? '');
$fullName = "$lastName $firstName";
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$zipcode = trim($_POST['zipcode'] ?? '');
$address = trim($_POST['address'] ?? '');
$note = trim($_POST['note'] ?? '');

$vDate1 = trim($_POST['visitDate1'] ?? '');
$vTime1 = trim($_POST['visitTime1'] ?? '');
$visitDate1 = $vDate1 . ($vTime1 ? ' ' . $vTime1 : '');

$vDate2 = trim($_POST['visitDate2'] ?? '');
$vTime2 = trim($_POST['visitTime2'] ?? '');
$visitDate2 = $vDate2 . ($vTime2 ? ' ' . $vTime2 : '');

writeLog("Input: Mode=$mode, Name=$fullName, Email=$email");

// バリデーション
if (!$email) {
    writeLog("Error: No email");
    http_response_code(400);
    echo "メールアドレスが必要です";
    exit;
}

// 本文作成
$subject = "[福てらす墓園LP] " . ($mode === 'visit' ? '見学予約' : '資料請求');
$body = "区分: " . ($mode === 'visit' ? '見学予約' : '資料請求') . "\n";
$body .= "氏名: $fullName\n";
$body .= "メール: $email\n";
$body .= "電話: $phone\n";
$body .= "住所: $address\n";
$body .= "日時1: $visitDate1\n";
$body .= "日時2: $visitDate2\n";
$body .= "備考: $note\n";
$body .= "送信日時: " . date('Y-m-d H:i:s');

// ヘッダー（test_mail.phpと完全に同じ構成にする）
// CRLF (\r\n) を使用
$headers = "From: $from_email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8";

// 管理者・関係者へ送信（ループで個別に送る）
$success_count = 0;
foreach ($recipients as $to) {
    // 第5引数 -f を指定
    $res = mb_send_mail($to, $subject, $body, $headers, "-f $from_email");
    if ($res) {
        writeLog("Sent to Admin: $to [OK]");
        $success_count++;
    } else {
        writeLog("Sent to Admin: $to [FAIL]");
    }
}

// 自動返信
$autoSubject = "【福てらす墓園】お申込み完了のお知らせ";
$autoBody = "$fullName 様\n\nお申込みありがとうございます。\n担当者よりご連絡いたします。\n\n" . $body;
$autoHeaders = "From: $from_email\r\n";
$autoHeaders .= "Content-Type: text/plain; charset=UTF-8";

$resAuto = mb_send_mail($email, $autoSubject, $autoBody, $autoHeaders, "-f $from_email");
writeLog("Sent to Customer: $email " . ($resAuto ? "[OK]" : "[FAIL]"));

if ($success_count > 0) {
    echo "OK";
} else {
    http_response_code(500);
    echo "Mail Error";
}
