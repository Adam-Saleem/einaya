<?php

declare(strict_types=1);

namespace Database\Factories\Tenant;

use App\Enums\Tenant\PatientGender;
use App\Enums\Tenant\PatientMaritalStatus;
use App\Enums\Tenant\PreferredLanguage;
use App\Models\Tenant\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        // Mix of English (transliterated) and Arabic given names so demo data
        // exercises both LTR and RTL rendering in lists/tables.
        $firstNamesEn = ['Ahmad', 'Mohammed', 'Omar', 'Yousef', 'Ali', 'Fatima', 'Aisha', 'Layla', 'Maryam', 'Sara', 'Khalil', 'Hassan', 'Nour', 'Dana', 'Lina'];
        $firstNamesAr = ['أحمد', 'محمد', 'عمر', 'يوسف', 'علي', 'فاطمة', 'عائشة', 'ليلى', 'مريم', 'سارة', 'خليل', 'حسن', 'نور', 'دانا', 'لينا'];
        $lastNamesEn = ['Saleh', 'Abu-Zayd', 'Khoury', 'Nasser', 'Hamdan', 'Barghouti', 'Awad', 'Issa', 'Daoud', 'Mansour', 'Salman', 'Khalil'];
        $lastNamesAr = ['صالح', 'أبو زيد', 'الخوري', 'ناصر', 'حمدان', 'البرغوثي', 'عوض', 'عيسى', 'داود', 'منصور', 'سلمان', 'خليل'];

        $useArabic = fake()->boolean(50);
        $first = fake()->randomElement($useArabic ? $firstNamesAr : $firstNamesEn);
        $last = fake()->randomElement($useArabic ? $lastNamesAr : $lastNamesEn);

        $cities = ['Ramallah', 'Jerusalem', 'Bethlehem', 'Hebron', 'Nablus', 'Jenin', 'Tulkarm', 'Jericho'];

        return [
            'first_name' => $first,
            'last_name' => $last,
            'national_id' => fake()->boolean(70) ? fake()->numerify('#########') : null,
            'date_of_birth' => fake()->dateTimeBetween('-85 years', '-1 year')->format('Y-m-d'),
            'gender' => fake()->randomElement([PatientGender::Male, PatientGender::Female]),
            'marital_status' => fake()->randomElement(PatientMaritalStatus::cases()),
            'occupation' => fake()->boolean(60) ? fake()->jobTitle() : null,
            'preferred_language' => fake()->randomElement(PreferredLanguage::cases()),
            'phone' => '+970-5'.fake()->numberBetween(0, 9).'-'.fake()->numerify('###-####'),
            'phone_alt' => fake()->boolean(20) ? '+970-5'.fake()->numberBetween(0, 9).'-'.fake()->numerify('###-####') : null,
            'email' => fake()->boolean(40) ? fake()->unique()->safeEmail() : null,
            'address' => fake()->boolean(70) ? fake()->streetAddress() : null,
            'city' => fake()->randomElement($cities),
            'emergency_name' => fake()->boolean(60) ? fake()->name() : null,
            'emergency_phone' => fake()->boolean(60) ? '+970-5'.fake()->numberBetween(0, 9).'-'.fake()->numerify('###-####') : null,
            'emergency_relation' => fake()->boolean(60) ? fake()->randomElement(['Spouse', 'Parent', 'Sibling', 'Child', 'Friend']) : null,
            'blood_type' => fake()->boolean(60) ? fake()->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']) : null,
            'allergies_summary' => fake()->boolean(25) ? fake()->randomElement(['Penicillin', 'Peanuts', 'Latex', 'Shellfish, dust mites']) : null,
            'chronic_summary' => fake()->boolean(20) ? fake()->randomElement(['Hypertension', 'Type 2 diabetes', 'Asthma', 'Hyperlipidemia']) : null,
            'medications_summary' => fake()->boolean(20) ? fake()->randomElement(['Metformin 500mg', 'Lisinopril 10mg', 'Salbutamol inhaler', 'Atorvastatin 20mg']) : null,
            'has_insurance' => false,
            'insurance_provider_id' => null,
            'insurance_policy_number' => null,
            'notes' => fake()->boolean(20) ? fake()->sentence() : null,
            'referred_by' => fake()->boolean(15) ? fake()->name() : null,
        ];
    }

    public function withInsurance(int $providerId): static
    {
        return $this->state(fn () => [
            'has_insurance' => true,
            'insurance_provider_id' => $providerId,
            'insurance_policy_number' => 'POL-'.fake()->unique()->numerify('########'),
        ]);
    }
}
