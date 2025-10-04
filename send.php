<?php
// fukuterrace-LP/send.php
// 入力内容をメール送信するシンプルなハンドラーです。
// 送信先は環境変数 FUKUTERRACE_TO または下部の定数 RECIPIENT_EMAIL で設定できます。

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

$envRecipient = getenv('FUKUTERRACE_TO') ?: getenv('RECIPIENT_EMAIL');
define('RECIPIENT_EMAIL', $envRecipient ?: 'h.shiga69@gmail.com'); // ← 任意のメールアドレスに変更してください

define('MAIL_SUBJECT_PREFIX', '[福てらす墓園LP]');

$mode = isset($_POST['mode']) && $_POST['mode'] === 'material' ? 'material' : 'visit';
$lastName = trim((string)($_POST['lastName'] ?? ''));
$firstName = trim((string)($_POST['firstName'] ?? ''));
$fullName = trim($lastName . ' ' . $firstName);
$phone = trim((string)($_POST['phone'] ?? ''));
$visitEmail = trim((string)($_POST['visitEmail'] ?? ''));
$materialEmail = trim((string)($_POST['materialEmail'] ?? ''));
$zipcode = trim((string)($_POST['zipcode'] ?? ''));
$address = trim((string)($_POST['address'] ?? ''));
$visitDate1 = trim((string)($_POST['visitDate1'] ?? ''));
$visitDate2 = trim((string)($_POST['visitDate2'] ?? ''));
$note = trim((string)($_POST['note'] ?? ''));

$errors = [];

if ($lastName === '') {
    $errors[] = '氏は必須です。';
}

if ($mode === 'visit') {
    if ($phone === '' && $visitEmail === '') {
        $errors[] = '電話番号またはメールアドレスのいずれかを入力してください。';
    }
    if ($visitEmail !== '' && !filter_var($visitEmail, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'メールアドレスの形式が正しくありません。';
    }
} else {
    if ($materialEmail === '' || !filter_var($materialEmail, FILTER_VALIDATE_EMAIL)) {
        $errors[] = '資料請求のメールアドレスを正しく入力してください。';
    }
    if (!preg_match('/^\d{7}$/', preg_replace('/[^0-9]/', '', $zipcode ?? ''))) {
        $errors[] = '郵便番号はハイフンなしの7桁で入力してください。';
    }
    if ($address === '') {
        $errors[] = '住所を入力してください。';
    }
}

if (!filter_var(RECIPIENT_EMAIL, FILTER_VALIDATE_EMAIL)) {
    $errors[] = '送信先メールアドレスが無効です。管理者に確認してください。';
}

if ($errors) {
    http_response_code(400);
    echo implode("\n", $errors);
    exit;
}

$subject = MAIL_SUBJECT_PREFIX . ' ' . ($mode === 'visit' ? '見学予約の申し込み' : '資料請求の申し込み');

$lines = [
    '----- フォーム送信内容 -----',
    '送信元IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '不明'),
    '送信日時: ' . (new DateTime('now', new DateTimeZone('Asia/Tokyo')))->format('Y-m-d H:i:s'),
    '',
    '区分: ' . ($mode === 'visit' ? '見学予約' : '資料請求'),
    '氏名: ' . ($fullName !== '' ? $fullName : $lastName),
    '電話番号: ' . ($phone !== '' ? $phone : '未入力'),
    'メールアドレス: ' . ($mode === 'visit' ? ($visitEmail !== '' ? $visitEmail : '未入力') : $materialEmail),
];

if ($mode === 'visit') {
    $lines[] = '第1希望日: ' . ($visitDate1 !== '' ? $visitDate1 : '未入力');
    $lines[] = '第2希望日: ' . ($visitDate2 !== '' ? $visitDate2 : '未入力');
} else {
    $lines[] = '郵便番号: ' . $zipcode;
    $lines[] = '住所: ' . $address;
}

$lines[] = '';
$lines[] = 'ご相談内容:';
$lines[] = $note !== '' ? $note : '（未記入）';
$lines[] = '';
$lines[] = '-----------------------------';

$body = implode("\n", $lines);

$fromEmail = ($visitEmail !== '' ? $visitEmail : ($materialEmail !== '' ? $materialEmail : 'no-reply@fukuterrace.jp'));
$headers = [];
$headers[] = 'From: ' . mb_encode_mimeheader('福てらす墓園 LP') . ' <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $fromEmail;
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$sent = mb_send_mail(RECIPIENT_EMAIL, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo '送信に失敗しました。時間を置いて再度お試しください。';
    exit;
}

echo 'OK';
