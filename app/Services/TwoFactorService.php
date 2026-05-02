<?php

declare(strict_types=1);

namespace App\Services;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/**
 * Encapsulates the cryptographic side of 2FA: secret generation, QR-code
 * provisioning URLs, TOTP verification, and recovery-code creation/checking.
 *
 * The HasTwoFactorAuth trait uses this service for everything except the
 * direct attribute reads/writes on the model.
 */
class TwoFactorService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    public function verify(string $secret, string $code): bool
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';

        if ($code === '') {
            return false;
        }

        return $this->google2fa->verifyKey($secret, $code);
    }

    /**
     * Build an otpauth:// URL suitable for embedding in a QR code.
     */
    public function provisioningUrl(string $accountLabel, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $accountLabel,
            $secret,
        );
    }

    /**
     * Render a provisioning URL as an inline-embeddable SVG data URI.
     */
    public function qrCodeSvg(string $provisioningUrl, int $size = 240): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size, 1),
            new SvgImageBackEnd(),
        );

        $svg = (new Writer($renderer))->writeString($provisioningUrl);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    /**
     * @return list<string> 8 plaintext recovery codes; caller is responsible
     *                      for hashing before persistence.
     */
    public function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(Str::random(4).'-'.Str::random(4));
        }

        return $codes;
    }
}
