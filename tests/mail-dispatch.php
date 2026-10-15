<?php
declare(strict_types=1);

// A mail double verifies provider dispatch without sending a message.
namespace PHPMailer\PHPMailer {
    #[\AllowDynamicProperties]
    class PHPMailer {
        public const ENCRYPTION_SMTPS = 'ssl';
        public const ENCRYPTION_STARTTLS = 'tls';
        public static int $sent = 0;
        public function __construct(bool $exceptions) {}
        public function __call(string $method, array $arguments): void {}
        public function send(): void { self::$sent++; }
    }
}
namespace {
    $mode = $argv[1] ?? 'smtp';
    putenv('BREVO_API_KEY=');
    putenv('SMTP_USERNAME=' . ($mode === 'smtp' ? 'fixture-user' : ''));
    putenv('SMTP_PASSWORD=' . ($mode === 'smtp' ? 'fixture-password' : ''));
    putenv('SMTP_FROM_EMAIL=' . ($mode === 'smtp' ? 'sender@example.test' : ''));
    require dirname(__DIR__) . '/api/app-config.php';
    require dirname(__DIR__) . '/api/email-delivery-helpers.php';
    try {
        sendOtpEmail('recipient@example.test', 'Test recipient', '123456');
        if ($mode !== 'smtp' || \PHPMailer\PHPMailer\PHPMailer::$sent !== 1) {
            throw new \LogicException('SMTP fallback was not used.');
        }
    } catch (\RuntimeException $e) {
        if ($mode !== 'missing' || !str_contains($e->getMessage(), 'configure the email service')) throw $e;
    }
    echo "PASS mail provider selection: {$mode}\n";
}
