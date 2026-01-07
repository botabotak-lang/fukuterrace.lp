<?php
// fukuterrace-LP/send.php
// 入力内容をメール送信するハンドラー（自動返信機能付き・個別送信版）

declare(strict_types=1);

mb_language('Japanese');
mb_internal_encoding('UTF-8');

header('Access-Control-Allow-Origin: *');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method Not Allowed';
    exit;
}

// --- 設定エリア ---
// 管理者送信先（確実に届けるため個別に配列にする）
$admin_recipients = ['info@fukuterrace.jp', 'yamasa@sanosekizai.com'];
$bcc_recipients = ['h.shiga69@gmail.com', 'botabotak@gmail.com'];

define('MAIL_SUBJECT_PREFIX', '[福てらす墓園LP]');
define('FROM_EMAIL', 'info@fukuterrace.jp');

// --- 入力値の取得 ---
$mode = isset($_POST['mode']) && $_POST['mode'] === 'material' ? 'material' : 'visit';
$lastName = trim((string)($_POST['lastName'] ?? ''));
$firstName = trim((string)($_POST['firstName'] ?? ''));
$fullName = trim($lastName . ' ' . $firstName);
$email = trim((string)($_POST['email'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$zipcode = trim((string)($_POST['zipcode'] ?? ''));
$address = trim((string)($_POST['address'] ?? ''));

// 日付と時間を結合
$vDate1 = trim((string)($_POST['visitDate1'] ?? ''));
$vTime1 = trim((string)($_POST['visitTime1'] ?? ''));
$visitDate1 = $vDate1 . ($vTime1 ? ' ' . $vTime1 : '');

$vDate2 = trim((string)($_POST['visitDate2'] ?? ''));
$vTime2 = trim((string)($_POST['visitTime2'] ?? ''));
$visitDate2 = $vDate2 . ($vTime2 ? ' ' . $vTime2 : '');

$note = trim((string)($_POST['note'] ?? ''));

// --- バリデーション ---
$errors = [];
if ($lastName === '') $errors[] = 'お名前を入力してください。';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'メールアドレスを正しく入力してください。';

if ($mode === 'visit') {
    if ($phone === '') $errors[] = '電話番号を入力してください。';
} else {
    if ($zipcode === '') $errors[] = '郵便番号を入力してください。';
    if ($address === '') $errors[] = '住所を入力してください。';
}

if ($errors) {
    http_response_code(400);
    echo implode("\n", $errors);
    exit;
}

// --- メール本文作成 ---
$subject = MAIL_SUBJECT_PREFIX . ' ' . ($mode === 'visit' ? '見学予約' : '資料請求');
$body = "----- フォーム送信内容 -----\n";
$body .= "区分: " . ($mode === 'visit' ? '見学予約' : '資料請求') . "\n";
$body .= "氏名: {$fullName}\n";
$body .= "メール: {$email}\n";
if ($mode === 'visit') {
    $body .= "電話番号: {$phone}\n";
    $body .= "第1希望日: {$visitDate1}\n";
    $body .= "第2希望日: {$visitDate2}\n";
} else {
    $body .= "郵便番号: {$zipcode}\n";
    $body .= "住所: {$address}\n";
}
$body .= "ご相談内容:\n{$note}\n";
$body .= "-----------------------------\n";
$body .= "送信日時: " . date('Y-m-d H:i:s') . "\n";

// ヘッダー作成（極限までシンプルに）
$headers = "From: " . FROM_EMAIL . "\n";
$headers .= "Reply-To: " . $email . "\n";
$headers .= "Content-Type: text/plain; charset=UTF-8";

// 1. 管理者へ送信（一人ずつ個別に送る）
$all_admin_sent = true;
foreach ($admin_recipients as $to) {
    if (!mb_send_mail($to, $subject, $body, $headers, "-f " . FROM_EMAIL)) {
        $all_admin_sent = false;
    }
}

// 2. BCCメンバーへ送信
foreach ($bcc_recipients as $to) {
    mb_send_mail($to, "[BCC]" . $subject, $body, $headers, "-f " . FROM_EMAIL);
}

// 3. お客様宛自動返信
$autoSubject = "【福てらす墓園】お申込みいただきありがとうございました";
$autoBody = "{$fullName} 様\n\n";
$autoBody .= "この度は「福てらす墓園」へお問い合わせいただき、誠にありがとうございます。\n";
$autoBody .= "以下の内容でお申し込みを承りました。\n\n";
$autoBody .= "担当者より改めてご連絡させていただきますので、今しばらくお待ちください。\n\n";
$autoBody .= $body;
$autoBody .= "\n-----------------------------\n";
$autoBody .= "福てらす墓園（最林寺内）\n";
$autoBody .= "住所：静岡県藤枝市下藪田３２２\n";
$autoBody .= "電話：0120-955-427\n";

mb_send_mail($email, $autoSubject, $autoBody, $headers, "-f " . FROM_EMAIL);

if (!$all_admin_sent) {
    // 少なくとも一人は失敗した場合
    http_response_code(500);
    echo '送信に一部失敗しました。';
    exit;
}

echo 'OK';
