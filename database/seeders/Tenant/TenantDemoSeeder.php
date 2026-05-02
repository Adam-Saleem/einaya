<?php

declare(strict_types=1);

namespace Database\Seeders\Tenant;

use App\Enums\Tenant\AppointmentStatus;
use App\Enums\Tenant\FormQuestionType;
use App\Enums\Tenant\FormType;
use App\Enums\Tenant\PaymentMethod;
use App\Enums\Tenant\PaymentStatus;
use App\Enums\Tenant\Role as RoleEnum;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Diagnosis;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\DoctorBreak;
use App\Models\Tenant\DoctorWorkingHour;
use App\Models\Tenant\FormQuestion;
use App\Models\Tenant\FormQuestionOption;
use App\Models\Tenant\FormSection;
use App\Models\Tenant\FormSubmission;
use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Payment;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\PrescriptionItem;
use App\Models\Tenant\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Builds a realistic single-clinic dataset inside the current tenant DB.
 *
 * Runs inside a tenant context (tenancy already initialized) — every Eloquent
 * call below targets the per-clinic database connection.
 */
class TenantDemoSeeder extends Seeder
{
    public function run(): void
    {
        $clinicSlug = $this->resolveClinicSlug();
        $rootDomain = config('app.env') === 'production' ? 'einaya.ps' : 'einaya.test';

        [$adminUser, $secretaryUser] = $this->seedUsers($clinicSlug, $rootDomain);
        $doctor = $this->seedDoctor($adminUser);
        $providers = $this->seedInsuranceProviders();
        $patients = $this->seedPatients($secretaryUser, $providers);
        $appointments = $this->seedAppointments($patients, $doctor, $secretaryUser);
        $form = $this->seedMedicalForm($doctor);
        $this->seedConsultationData($form, $appointments, $secretaryUser);
    }

    /** @return array{0: User, 1: User} */
    private function seedUsers(string $slug, string $rootDomain): array
    {
        $admin = User::firstOrCreate(
            ['email' => "doctor@{$slug}.{$rootDomain}"],
            [
                'name' => 'Dr. Demo Owner',
                'password' => Hash::make('Einaya@2025'),
                'phone' => '+970-59-000-0001',
                'preferred_language' => 'ar',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $secretary = User::firstOrCreate(
            ['email' => "secretary@{$slug}.{$rootDomain}"],
            [
                'name' => 'Reception Secretary',
                'password' => Hash::make('Einaya@2025'),
                'phone' => '+970-59-000-0002',
                'preferred_language' => 'ar',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        // Assign roles. syncRoles() is idempotent so re-runs don't pile up
        // duplicate role pivots.
        $admin->syncRoles([RoleEnum::ClinicAdmin->value, RoleEnum::Doctor->value]);
        $secretary->syncRoles([RoleEnum::Secretary->value]);

        return [$admin, $secretary];
    }

    private function seedDoctor(User $adminUser): Doctor
    {
        $doctor = Doctor::firstOrCreate(
            ['user_id' => $adminUser->id],
            [
                'specialty' => 'General Medicine',
                'license_number' => 'LIC-001234',
                'bio_en' => 'Board-certified general practitioner with 12 years of community clinic experience.',
                'bio_ar' => 'طبيب ممارس عام معتمد، يتمتع بخبرة 12 عامًا في عيادات المجتمع.',
                'consultation_duration_minutes' => 30,
                'is_active' => true,
            ],
        );

        if ($doctor->workingHours()->count() === 0) {
            // Sunday (0) – Thursday (4): 09:00–17:00
            foreach ([0, 1, 2, 3, 4] as $day) {
                DoctorWorkingHour::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                    'is_active' => true,
                ]);
                DoctorBreak::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '13:00:00',
                    'end_time' => '14:00:00',
                    'label' => 'Lunch',
                ]);
            }
        }

        return $doctor;
    }

    /** @return array<int, InsuranceProvider> */
    private function seedInsuranceProviders(): array
    {
        $names = [
            'National Health Insurance',
            'Palestinian Medical Relief Society',
            'Al-Ahli Insurance',
            'Trust International',
            'GlobeMed Palestine',
        ];

        return collect($names)
            ->map(fn (string $name) => InsuranceProvider::firstOrCreate(
                ['name' => $name],
                ['is_active' => true],
            ))
            ->all();
    }

    /**
     * @param  array<int, InsuranceProvider>  $providers
     * @return array<int, Patient>
     */
    private function seedPatients(User $secretary, array $providers): array
    {
        if (Patient::count() >= 20) {
            return Patient::orderBy('id')->get()->all();
        }

        $patients = [];
        for ($i = 1; $i <= 20; $i++) {
            $withInsurance = $i <= 12; // ~60%

            $factory = Patient::factory()->state([
                'registered_by' => $secretary->id,
            ]);

            if ($withInsurance) {
                $provider = $providers[array_rand($providers)];
                $factory = $factory->withInsurance($provider->id);
            }

            $patients[] = $factory->create();
        }

        return $patients;
    }

    /**
     * @param  array<int, Patient>  $patients
     * @return array<int, Appointment>
     */
    private function seedAppointments(array $patients, Doctor $doctor, User $secretary): array
    {
        if (Appointment::count() >= 30) {
            return Appointment::orderBy('id')->get()->all();
        }

        $appointments = [];

        // 18 past appointments (30..1 days ago): mostly completed, a few cancelled / no_show.
        for ($i = 0; $i < 18; $i++) {
            $patient = $patients[array_rand($patients)];
            $scheduledFor = now()->subDays(random_int(1, 60))->setTime(random_int(9, 16), [0, 30][random_int(0, 1)]);

            $statusRoll = random_int(1, 100);
            $status = match (true) {
                $statusRoll <= 80 => AppointmentStatus::Completed,
                $statusRoll <= 90 => AppointmentStatus::Cancelled,
                default => AppointmentStatus::NoShow,
            };

            $appointments[] = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'scheduled_for' => $scheduledFor,
                'duration_minutes' => 30,
                'status' => $status,
                'reason' => 'Routine visit',
                'arrived_at' => $status === AppointmentStatus::Completed ? $scheduledFor : null,
                'cancelled_at' => $status === AppointmentStatus::Cancelled ? $scheduledFor : null,
                'cancellation_reason' => $status === AppointmentStatus::Cancelled ? 'Patient rescheduled' : null,
                'created_by' => $secretary->id,
            ]);
        }

        // 12 upcoming appointments (next 30 days): mix of pending/confirmed.
        for ($i = 0; $i < 12; $i++) {
            $patient = $patients[array_rand($patients)];
            $scheduledFor = now()->addDays(random_int(1, 30))->setTime(random_int(9, 16), [0, 30][random_int(0, 1)]);

            $appointments[] = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'scheduled_for' => $scheduledFor,
                'duration_minutes' => 30,
                'status' => random_int(0, 1) === 0 ? AppointmentStatus::Pending : AppointmentStatus::Confirmed,
                'reason' => 'Routine visit',
                'created_by' => $secretary->id,
            ]);
        }

        return $appointments;
    }

    private function seedMedicalForm(Doctor $doctor): MedicalForm
    {
        $existing = MedicalForm::where('doctor_id', $doctor->id)
            ->where('title', 'General Intake Form')
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        $form = MedicalForm::create([
            'doctor_id' => $doctor->id,
            'title' => 'General Intake Form',
            'description' => 'Standard intake collected at first visit.',
            'type' => FormType::Intake,
            'is_active' => true,
        ]);

        // Section 1: Personal History (3 questions)
        $personal = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'Personal History',
            'description' => 'Background and ongoing conditions.',
            'order' => 1,
        ]);
        $this->createQuestion($personal->id, 'occupation_history', 'What is your current occupation?', FormQuestionType::Text, 1);
        $this->createQuestion($personal->id, 'smoker_status', 'Do you smoke?', FormQuestionType::Radio, 2, options: [
            ['value' => 'never', 'label' => 'Never'],
            ['value' => 'former', 'label' => 'Former smoker'],
            ['value' => 'current', 'label' => 'Current smoker'],
        ]);
        $this->createQuestion($personal->id, 'chronic_conditions', 'Do you have any chronic conditions?', FormQuestionType::Checkbox, 3, options: [
            ['value' => 'hypertension', 'label' => 'Hypertension'],
            ['value' => 'diabetes', 'label' => 'Diabetes'],
            ['value' => 'asthma', 'label' => 'Asthma'],
            ['value' => 'heart_disease', 'label' => 'Heart disease'],
            ['value' => 'none', 'label' => 'None'],
        ]);

        // Section 2: Current Symptoms (4 questions)
        $current = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'Current Symptoms',
            'description' => 'Tell us what you are experiencing today.',
            'order' => 2,
        ]);
        $this->createQuestion($current->id, 'chief_complaint_text', 'Describe your main complaint', FormQuestionType::Textarea, 1, isRequired: true);
        $this->createQuestion($current->id, 'pain_level', 'Pain level (0-10)', FormQuestionType::Select, 2, options: [
            ['value' => '0', 'label' => '0 - None'],
            ['value' => '3', 'label' => '3 - Mild'],
            ['value' => '6', 'label' => '6 - Moderate'],
            ['value' => '9', 'label' => '9 - Severe'],
        ]);
        $this->createQuestion($current->id, 'symptoms_started_on', 'When did symptoms start?', FormQuestionType::Date, 3);
        $this->createQuestion($current->id, 'fever_temperature', 'Highest measured temperature (°C)', FormQuestionType::Number, 4);

        // Section 3: Lifestyle (3 questions)
        $lifestyle = FormSection::create([
            'medical_form_id' => $form->id,
            'title' => 'Lifestyle',
            'description' => 'Daily habits and routines.',
            'order' => 3,
        ]);
        $this->createQuestion($lifestyle->id, 'exercise_frequency', 'How often do you exercise?', FormQuestionType::Radio, 1, options: [
            ['value' => 'never', 'label' => 'Never'],
            ['value' => 'sometimes', 'label' => '1-2x per week'],
            ['value' => 'often', 'label' => '3-5x per week'],
            ['value' => 'daily', 'label' => 'Daily'],
        ]);
        $this->createQuestion($lifestyle->id, 'sleep_hours', 'Average hours of sleep per night', FormQuestionType::Number, 2);
        $this->createQuestion($lifestyle->id, 'diet_preferences', 'Any dietary preferences or restrictions?', FormQuestionType::Text, 3);

        return $form->refresh();
    }

    /**
     * @param  list<array{value: string, label: string}>  $options
     */
    private function createQuestion(
        int $sectionId,
        string $key,
        string $label,
        FormQuestionType $type,
        int $order,
        bool $isRequired = false,
        array $options = [],
    ): FormQuestion {
        $question = FormQuestion::create([
            'form_section_id' => $sectionId,
            'key' => $key,
            'label' => $label,
            'type' => $type,
            'is_required' => $isRequired,
            'order' => $order,
        ]);

        foreach ($options as $i => $opt) {
            FormQuestionOption::create([
                'form_question_id' => $question->id,
                'value' => $opt['value'],
                'label' => $opt['label'],
                'order' => $i + 1,
            ]);
        }

        return $question;
    }

    /**
     * @param  array<int, Appointment>  $appointments
     */
    private function seedConsultationData(MedicalForm $form, array $appointments, User $secretary): void
    {
        $completed = collect($appointments)
            ->filter(fn (Appointment $a) => $a->status === AppointmentStatus::Completed)
            ->values();

        if ($completed->isEmpty()) {
            return;
        }

        $snapshot = $this->buildFormSnapshot($form);
        $receiptCounter = (int) (Payment::max('id') ?? 0) + 1;

        foreach ($completed as $i => $appointment) {
            if (Consultation::where('appointment_id', $appointment->id)->exists()) {
                continue;
            }

            $consultation = Consultation::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $appointment->doctor_id,
                'started_at' => $appointment->scheduled_for,
                'ended_at' => $appointment->scheduled_for->copy()->addMinutes(25),
                'chief_complaint' => 'See submitted intake form.',
                'notes' => null,
                'follow_up_in_days' => $i % 3 === 0 ? 30 : null,
            ]);

            // 5 form submissions on the first 5 completed consultations
            if ($i < 5) {
                FormSubmission::create([
                    'medical_form_id' => $form->id,
                    'consultation_id' => $consultation->id,
                    'patient_id' => $consultation->patient_id,
                    'doctor_id' => $consultation->doctor_id,
                    'form_snapshot' => $snapshot,
                    'answers_snapshot' => $this->fakeAnswers($snapshot),
                    'submitted_at' => $consultation->started_at->copy()->addMinutes(5),
                ]);
            }

            // ~3 prescriptions and ~3 diagnoses across the completed consultations
            if ($i < 3) {
                $prescription = Prescription::create([
                    'consultation_id' => $consultation->id,
                    'patient_id' => $consultation->patient_id,
                    'doctor_id' => $consultation->doctor_id,
                    'notes' => 'Take with food.',
                ]);
                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'medication_name' => 'Amoxicillin',
                    'dosage' => '500 mg',
                    'frequency' => '3 times daily',
                    'duration' => '7 days',
                    'order' => 1,
                ]);
                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'medication_name' => 'Paracetamol',
                    'dosage' => '500 mg',
                    'frequency' => 'as needed',
                    'duration' => '5 days',
                    'order' => 2,
                ]);

                Diagnosis::create([
                    'consultation_id' => $consultation->id,
                    'patient_id' => $consultation->patient_id,
                    'description' => 'Acute upper respiratory infection',
                    'notes' => 'Likely viral; antibiotics for secondary bacterial concern.',
                ]);
            }

            // Payment on every completed visit, mixed methods
            $methodRoll = $i % 4;
            $method = match ($methodRoll) {
                0 => PaymentMethod::Cash,
                1 => PaymentMethod::Card,
                2 => PaymentMethod::Insurance,
                default => PaymentMethod::Mixed,
            };

            $amount = 50.00;
            $cash = $method === PaymentMethod::Cash ? $amount : ($method === PaymentMethod::Mixed ? 20.00 : 0);
            $card = $method === PaymentMethod::Card ? $amount : ($method === PaymentMethod::Mixed ? 30.00 : 0);
            $ins = $method === PaymentMethod::Insurance ? $amount : 0;

            Payment::create([
                'patient_id' => $consultation->patient_id,
                'appointment_id' => $appointment->id,
                'consultation_id' => $consultation->id,
                'amount' => $amount,
                'currency' => 'USD',
                'method' => $method,
                'cash_amount' => $cash,
                'card_amount' => $card,
                'insurance_amount' => $ins,
                'status' => PaymentStatus::Paid,
                'receipt_number' => 'R-'.str_pad((string) $receiptCounter++, 6, '0', STR_PAD_LEFT),
                'collected_by' => $secretary->id,
                'paid_at' => $appointment->scheduled_for->copy()->addMinutes(35),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildFormSnapshot(MedicalForm $form): array
    {
        $form->loadMissing('sections.questions.options');

        return [
            'id' => $form->id,
            'title' => $form->title,
            'description' => $form->description,
            'type' => $form->type->value,
            'sections' => $form->sections->map(fn (FormSection $s) => [
                'id' => $s->id,
                'title' => $s->title,
                'description' => $s->description,
                'order' => $s->order,
                'questions' => $s->questions->map(fn (FormQuestion $q) => [
                    'id' => $q->id,
                    'key' => $q->key,
                    'label' => $q->label,
                    'help_text' => $q->help_text,
                    'type' => $q->type->value,
                    'is_required' => $q->is_required,
                    'order' => $q->order,
                    'options' => $q->options->map(fn (FormQuestionOption $o) => [
                        'value' => $o->value,
                        'label' => $o->label,
                        'order' => $o->order,
                    ])->all(),
                ])->all(),
            ])->all(),
            'snapshotted_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array<string, mixed>
     */
    private function fakeAnswers(array $snapshot): array
    {
        $answers = [];

        foreach ($snapshot['sections'] as $section) {
            foreach ($section['questions'] as $question) {
                $answers[$question['key']] = match ($question['type']) {
                    'text' => 'Sample answer',
                    'textarea' => 'Patient reports a 4-day history of cough with mild fever.',
                    'number' => (string) random_int(0, 12),
                    'date' => now()->subDays(random_int(1, 14))->toDateString(),
                    'radio', 'select' => $question['options'][0]['value'] ?? null,
                    'checkbox' => array_slice(array_column($question['options'], 'value'), 0, 1),
                    default => null,
                };
            }
        }

        return $answers;
    }

    private function resolveClinicSlug(): string
    {
        if (function_exists('tenant')) {
            $tenant = tenant();
            if ($tenant !== null && isset($tenant->slug) && is_string($tenant->slug) && $tenant->slug !== '') {
                return $tenant->slug;
            }
            if ($tenant !== null && isset($tenant->id) && is_string($tenant->id) && $tenant->id !== '') {
                return $tenant->id;
            }
        }

        return 'clinic-'.Str::lower(Str::random(6));
    }
}
