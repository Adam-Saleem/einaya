/**
 * Static catalogue of Palestinian governorates / cities / villages used by
 * the patient registration form. Stored client-side so the form's village
 * selector doesn't have to round-trip per city.
 *
 * The patient row keeps `city` and `village` as plain strings (the EN names
 * — `id` here) so reporting by region stays language-agnostic. The UI shows
 * the localised label via `name.en` / `name.ar`.
 *
 * To add a city/village just append to this array — no migration needed.
 */

export type Localised = { en: string; ar: string };

export type Village = {
    id: string;
    name: Localised;
};

export type City = {
    id: string;
    name: Localised;
    villages: Village[];
};

export const CITIES: City[] = [
    {
        id: 'hebron',
        name: { en: 'Hebron', ar: 'الخليل' },
        villages: [
            { id: 'halhul', name: { en: 'Halhul', ar: 'حلحول' } },
            { id: 'dura', name: { en: 'Dura', ar: 'دورا' } },
            { id: 'yatta', name: { en: 'Yatta', ar: 'يطا' } },
            { id: 'sair', name: { en: "Sa'ir", ar: 'سعير' } },
            { id: 'bani-naim', name: { en: "Bani Na'im", ar: 'بني نعيم' } },
            { id: 'idhna', name: { en: 'Idhna', ar: 'إذنا' } },
            { id: 'taffuh', name: { en: 'Taffuh', ar: 'تفوح' } },
            { id: 'samu', name: { en: "As-Samu'", ar: 'السموع' } },
            { id: 'tarqumiya', name: { en: 'Tarqumiya', ar: 'ترقوميا' } },
        ],
    },
    {
        id: 'bethlehem',
        name: { en: 'Bethlehem', ar: 'بيت لحم' },
        villages: [
            { id: 'beit-jala', name: { en: 'Beit Jala', ar: 'بيت جالا' } },
            { id: 'beit-sahour', name: { en: 'Beit Sahour', ar: 'بيت ساحور' } },
            { id: 'doha', name: { en: 'Ad-Doha', ar: 'الدوحة' } },
            { id: 'al-khader', name: { en: 'Al-Khader', ar: 'الخضر' } },
            { id: 'tuqu', name: { en: "Tuqu'", ar: 'تقوع' } },
            { id: 'husan', name: { en: 'Husan', ar: 'حوسان' } },
            { id: 'battir', name: { en: 'Battir', ar: 'بتير' } },
            { id: 'nahalin', name: { en: "Nahhalin", ar: 'نحالين' } },
        ],
    },
    {
        id: 'jerusalem',
        name: { en: 'Jerusalem', ar: 'القدس' },
        villages: [
            { id: 'abu-dis', name: { en: 'Abu Dis', ar: 'أبو ديس' } },
            { id: 'al-eizariya', name: { en: 'Al-Eizariya', ar: 'العيزرية' } },
            { id: 'beit-hanina', name: { en: 'Beit Hanina', ar: 'بيت حنينا' } },
            { id: 'shuafat', name: { en: "Shu'fat", ar: 'شعفاط' } },
            { id: 'silwan', name: { en: 'Silwan', ar: 'سلوان' } },
            { id: 'ar-ram', name: { en: 'Ar-Ram', ar: 'الرام' } },
            { id: 'hizma', name: { en: 'Hizma', ar: 'حزما' } },
        ],
    },
    {
        id: 'ramallah',
        name: { en: 'Ramallah', ar: 'رام الله' },
        villages: [
            { id: 'al-bireh', name: { en: 'Al-Bireh', ar: 'البيرة' } },
            { id: 'beitunia', name: { en: 'Beitunia', ar: 'بيتونيا' } },
            { id: 'birzeit', name: { en: 'Birzeit', ar: 'بيرزيت' } },
            { id: 'silwad', name: { en: 'Silwad', ar: 'سلواد' } },
            { id: 'beit-rima', name: { en: 'Beit Rima', ar: 'بيت ريما' } },
            { id: 'kobar', name: { en: 'Kobar', ar: 'كوبر' } },
            { id: 'taybeh', name: { en: 'Taybeh', ar: 'الطيبة' } },
            { id: 'deir-dibwan', name: { en: 'Deir Dibwan', ar: 'دير دبوان' } },
        ],
    },
    {
        id: 'nablus',
        name: { en: 'Nablus', ar: 'نابلس' },
        villages: [
            { id: 'huwwara', name: { en: 'Huwwara', ar: 'حوارة' } },
            { id: 'sebastia', name: { en: 'Sebastia', ar: 'سبسطية' } },
            { id: 'beita', name: { en: 'Beita', ar: 'بيتا' } },
            { id: 'aqraba', name: { en: 'Aqraba', ar: 'عقربا' } },
            { id: 'asira', name: { en: 'Asira ash-Shamaliya', ar: 'عصيرة الشمالية' } },
            { id: 'salim', name: { en: 'Salim', ar: 'سالم' } },
            { id: 'qabalan', name: { en: 'Qabalan', ar: 'قبلان' } },
        ],
    },
    {
        id: 'jenin',
        name: { en: 'Jenin', ar: 'جنين' },
        villages: [
            { id: 'qabatiya', name: { en: 'Qabatiya', ar: 'قباطية' } },
            { id: 'yabad', name: { en: "Ya'bad", ar: 'يعبد' } },
            { id: 'arraba', name: { en: 'Arraba', ar: 'عرابة' } },
            { id: 'siris', name: { en: 'Siris', ar: 'سيريس' } },
            { id: 'silat-al-harithiya', name: { en: 'Silat al-Harithiya', ar: 'سيلة الحارثية' } },
            { id: 'kafr-dan', name: { en: 'Kafr Dan', ar: 'كفر دان' } },
        ],
    },
    {
        id: 'tulkarm',
        name: { en: 'Tulkarm', ar: 'طولكرم' },
        villages: [
            { id: 'anabta', name: { en: 'Anabta', ar: 'عنبتا' } },
            { id: 'illar', name: { en: 'Illar', ar: 'علار' } },
            { id: 'attil', name: { en: 'Attil', ar: 'عتيل' } },
            { id: 'shweika', name: { en: 'Shweika', ar: 'شويكة' } },
            { id: 'bal-a', name: { en: "Bal'a", ar: 'بلعا' } },
        ],
    },
    {
        id: 'qalqilya',
        name: { en: 'Qalqilya', ar: 'قلقيلية' },
        villages: [
            { id: 'azzun', name: { en: 'Azzun', ar: 'عزون' } },
            { id: 'jayyus', name: { en: 'Jayyous', ar: 'جيوس' } },
            { id: 'kafr-thulth', name: { en: 'Kafr Thulth', ar: 'كفر ثلث' } },
            { id: 'hableh', name: { en: 'Hableh', ar: 'حبلة' } },
        ],
    },
    {
        id: 'salfit',
        name: { en: 'Salfit', ar: 'سلفيت' },
        villages: [
            { id: 'biddya', name: { en: 'Biddya', ar: 'بديا' } },
            { id: 'kafr-al-deek', name: { en: 'Kafr ad-Dik', ar: 'كفر الديك' } },
            { id: 'deir-istiya', name: { en: 'Deir Istiya', ar: 'دير استيا' } },
            { id: 'qarawat-bani-hassan', name: { en: 'Qarawat Bani Hassan', ar: 'قراوة بني حسان' } },
        ],
    },
    {
        id: 'tubas',
        name: { en: 'Tubas', ar: 'طوباس' },
        villages: [
            { id: 'tammun', name: { en: 'Tammun', ar: 'طمون' } },
            { id: 'aqaba', name: { en: 'Aqaba', ar: 'العقبة' } },
            { id: 'tayasir', name: { en: 'Tayasir', ar: 'طياسير' } },
        ],
    },
    {
        id: 'jericho',
        name: { en: 'Jericho', ar: 'أريحا' },
        villages: [
            { id: 'al-auja', name: { en: 'Al-Auja', ar: 'العوجا' } },
            { id: 'fasayil', name: { en: 'Fasayil', ar: 'فصايل' } },
            { id: 'an-nuwaima', name: { en: "An-Nuwei'ma", ar: 'النويعمة' } },
        ],
    },
    {
        id: 'gaza',
        name: { en: 'Gaza', ar: 'غزة' },
        villages: [
            { id: 'jabaliya', name: { en: 'Jabaliya', ar: 'جباليا' } },
            { id: 'beit-lahia', name: { en: 'Beit Lahia', ar: 'بيت لاهيا' } },
            { id: 'beit-hanoun', name: { en: 'Beit Hanoun', ar: 'بيت حانون' } },
            { id: 'deir-al-balah', name: { en: 'Deir al-Balah', ar: 'دير البلح' } },
            { id: 'khan-younis', name: { en: 'Khan Younis', ar: 'خان يونس' } },
            { id: 'rafah', name: { en: 'Rafah', ar: 'رفح' } },
        ],
    },
];

export function findCity(id: string | null | undefined): City | null {
    if (!id) return null;
    return CITIES.find((c) => c.id === id) ?? null;
}

export function localisedCityName(city: City | null, locale: 'en' | 'ar'): string {
    if (!city) return '';
    return city.name[locale];
}

export function localisedVillageName(village: Village | null, locale: 'en' | 'ar'): string {
    if (!village) return '';
    return village.name[locale];
}
