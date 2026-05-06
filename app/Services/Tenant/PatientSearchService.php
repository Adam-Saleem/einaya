<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Patient;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class PatientSearchService
{
    /**
     * Multi-field fuzzy search used by the cmd+k palette and the patients
     * filter input. Matches across patient_code, first/last name, phone,
     * national_id, and email — phone digits are loosely compared so a
     * search for "0599…" matches a stored "+970-59-9…".
     *
     * Limit is bounded so the JSON payload stays small for the live search.
     */
    public function search(string $query, int $limit = 12): Collection
    {
        $term = trim($query);
        if ($term === '') return collect();

        $like = '%'.$term.'%';
        $digits = preg_replace('/\D+/', '', $term);

        return Patient::query()
            ->where(function (Builder $q) use ($like, $digits) {
                $q->where('patient_code', 'like', $like)
                    ->orWhere('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", [$like])
                    ->orWhere('national_id', 'like', $like)
                    ->orWhere('email', 'like', $like);

                if ($digits !== '' && strlen($digits) >= 4) {
                    // Compare on the digits-only form so search doesn't
                    // care about formatting characters in stored numbers.
                    $q->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') LIKE ?",
                        ['%'.$digits.'%'],
                    );
                }
            })
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get([
                'id', 'patient_code', 'first_name', 'last_name', 'phone',
                'date_of_birth', 'gender', 'profile_photo_path', 'has_insurance',
            ]);
    }

    /**
     * Used by the registration form to flag potential duplicates BEFORE
     * the secretary clicks save. Returns up to 5 patients matching the
     * normalized phone (digits only, ignoring punctuation).
     *
     * @return Collection<int, Patient>
     */
    public function findByPhone(string $phone): Collection
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if ($digits === '' || strlen($digits) < 6) return collect();

        return Patient::query()
            ->whereRaw(
                "REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', '') = ?",
                [$digits],
            )
            ->limit(5)
            ->get(['id', 'patient_code', 'first_name', 'last_name', 'phone', 'date_of_birth']);
    }
}
