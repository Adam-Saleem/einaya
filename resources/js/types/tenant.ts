import type { Paginated, ResourceCollection } from './central';

export type FormQuestionType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'file'
    | 'signature';

export type FormType = 'intake' | 'follow_up' | 'custom';

export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'arrived'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';

export type StaffRow = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar_path: string | null;
    is_active: boolean;
    last_login_at: string | null;
    roles?: string[];
};

export type DoctorProfile = {
    id: number;
    specialty: string;
    license_number: string | null;
    bio_en: string | null;
    bio_ar: string | null;
    consultation_duration_minutes: number;
    is_active: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        avatar_path: string | null;
        avatar_url: string | null;
    };
};

export type WorkingHourRow = {
    day_of_week: number;
    is_active: boolean;
    start_time: string | null;
    end_time: string | null;
};

export type DoctorBreakRow = {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    label: string | null;
};

export type DoctorTimeOffRow = {
    id: number;
    starts_at: string | null;
    ends_at: string | null;
    reason: string | null;
};

export type InsuranceProviderRow = {
    id: number;
    name: string;
    is_active: boolean;
    patient_count?: number;
    created_at: string | null;
};

export type ClinicSettings = {
    general?: {
        name?: string;
        address?: string;
        phone?: string;
        email?: string;
    };
    branding?: {
        primary_color?: string;
        logo_url?: string;
    };
    localization?: {
        default_language?: 'en' | 'ar';
    };
    receipt?: {
        header?: string;
        footer?: string;
        show_logo?: boolean;
    };
    notifications?: {
        appointment_reminders?: boolean;
    };
    pricing?: {
        first_visit_price?: number;
        review_visit_price?: number;
    };
};

export type FormQuestion = {
    id: number;
    form_section_id: number;
    key: string;
    label: string;
    help_text: string | null;
    type: FormQuestionType;
    type_label: string;
    has_options: boolean;
    is_required: boolean;
    validation_rules: Record<string, unknown> | null;
    order: number;
    options: { id?: number; value: string; label: string; order: number }[];
};

export type FormSection = {
    id: number;
    medical_form_id: number;
    title: string;
    description: string | null;
    order: number;
    questions: FormQuestion[];
};

export type MedicalForm = {
    id: number;
    doctor_id: number | null;
    title: string;
    description: string | null;
    type: FormType;
    type_label: string;
    is_active: boolean;
    sections_count?: number;
    submissions_count?: number;
    sections?: FormSection[];
    created_at: string | null;
    updated_at: string | null;
};

export type FormSubmission = {
    id: number;
    medical_form_id: number | null;
    consultation_id: number | null;
    patient_id: number;
    doctor_id: number;
    form_snapshot: FormSnapshot;
    answers: Record<string, unknown> | null;
    submitted_at: string | null;
    patient?: { id: number; name: string; patient_code: string };
    doctor?: { id: number; name: string };
};

export type FormSnapshot = {
    form_id: number;
    title: string;
    description: string | null;
    type: FormType;
    version_at: string;
    sections: {
        id: number;
        title: string;
        description: string | null;
        order: number;
        questions: {
            id: number;
            key: string;
            label: string;
            help_text: string | null;
            type: FormQuestionType;
            required: boolean;
            order: number;
            validation_rules: Record<string, unknown> | null;
            options: { value: string; label: string }[];
        }[];
    }[];
};

export type DashboardStats = {
    today_appointments: { total: number; by_status: Record<string, number> };
    patients_this_month: { new: number; returning: number; total: number };
    revenue_this_month: number;
    pending_followups: number;
};

export type DashboardProps = {
    stats: DashboardStats;
    upcomingToday: {
        id: number;
        starts_at: string | null;
        status: AppointmentStatus;
        patient: { id: number; name: string; patient_code: string } | null;
        doctor: string | null;
    }[];
    recentPatients: {
        id: number;
        name: string;
        patient_code: string;
        created_at: string | null;
    }[];
};

export type { Paginated, ResourceCollection };
