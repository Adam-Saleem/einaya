<?php

declare(strict_types=1);

namespace App\Traits;

use App\Services\TwoFactorService;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

/**
 * Adds 2FA capabilities to any User model that has the columns:
 *   two_factor_secret (text, nullable)
 *   two_factor_recovery_codes (text, nullable)
 *   two_factor_confirmed_at (timestamp, nullable)
 *
 * Both Central\User and Tenant\User use this trait. The `secret` and
 * `recovery_codes` columns are encrypted at rest — recovery codes are also
 * individually hashed before encryption so a stolen DB still requires the
 * encryption key + a brute-force pass to use them.
 */
trait HasTwoFactorAuth
{
    /**
     * Generate a fresh secret and persist it. Returns the otpauth:// URL +
     * its rendered SVG data URI so the caller can show a QR.
     *
     * Calling this REPLACES any existing secret and clears the confirmation
     * — confirmTwoFactor() must be called before 2FA is enforced again.
     *
     * @return array{secret: string, otpauth_url: string, qr_svg: string}
     */
    public function enableTwoFactor(): array
    {
        $service = app(TwoFactorService::class);

        $secret = $service->generateSecret();

        $this->forceFill([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $url = $service->provisioningUrl($this->getEmailForTwoFactor(), $secret);

        return [
            'secret' => $secret,
            'otpauth_url' => $url,
            'qr_svg' => $service->qrCodeSvg($url),
        ];
    }

    /**
     * Verify the supplied code; on success, mark 2FA confirmed and generate
     * the initial set of recovery codes. Returns the plaintext codes so the
     * caller can show them once.
     *
     * @return list<string>|null  Plaintext recovery codes on success, null on
     *                            failure (caller should re-prompt).
     */
    public function confirmTwoFactor(string $code): ?array
    {
        if ($this->two_factor_secret === null) {
            return null;
        }

        if (! $this->verifyCode($code)) {
            return null;
        }

        $codes = $this->regenerateRecoveryCodes();

        $this->forceFill([
            'two_factor_confirmed_at' => now(),
        ])->save();

        return $codes;
    }

    public function disableTwoFactor(): void
    {
        $this->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_confirmed_at !== null
            && $this->two_factor_secret !== null;
    }

    public function verifyCode(string $code): bool
    {
        if ($this->two_factor_secret === null) {
            return false;
        }

        $secret = Crypt::decryptString($this->two_factor_secret);

        return app(TwoFactorService::class)->verify($secret, $code);
    }

    /**
     * Consume a recovery code. Recovery codes are one-time-use — on a
     * successful match the code is removed from the stored list.
     */
    public function useRecoveryCode(string $code): bool
    {
        $code = strtoupper(trim($code));

        if ($code === '' || $this->two_factor_recovery_codes === null) {
            return false;
        }

        $stored = $this->loadRecoveryCodeHashes();

        foreach ($stored as $i => $hash) {
            if (Hash::check($code, $hash)) {
                array_splice($stored, $i, 1);
                $this->forceFill([
                    'two_factor_recovery_codes' => Crypt::encryptString(json_encode($stored, JSON_THROW_ON_ERROR)),
                ])->save();

                return true;
            }
        }

        return false;
    }

    /**
     * @return list<string>  New plaintext codes; caller MUST display once and
     *                       not persist them anywhere else.
     */
    public function regenerateRecoveryCodes(): array
    {
        $service = app(TwoFactorService::class);
        $plain = $service->generateRecoveryCodes();

        $hashes = array_map(fn (string $code) => Hash::make($code), $plain);

        $this->forceFill([
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($hashes, JSON_THROW_ON_ERROR)),
        ])->save();

        return $plain;
    }

    /**
     * @return list<string>
     */
    private function loadRecoveryCodeHashes(): array
    {
        $payload = Crypt::decryptString($this->two_factor_recovery_codes);
        $decoded = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);

        return is_array($decoded) ? array_values($decoded) : [];
    }

    private function getEmailForTwoFactor(): string
    {
        $email = $this->getAttribute('email');

        return is_string($email) && $email !== '' ? $email : 'user-'.$this->getKey();
    }
}
