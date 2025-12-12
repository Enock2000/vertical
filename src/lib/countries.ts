// Countries data with flags and phone validation patterns
export type Country = {
    code: string;
    name: string;
    flag: string;
    dialCode: string;
    phonePattern: RegExp;
    phonePlaceholder: string;
};

export const countries: Country[] = [
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260', phonePattern: /^\+260[0-9]{9}$/, phonePlaceholder: '+260977123456' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263', phonePattern: /^\+263[0-9]{9}$/, phonePlaceholder: '+263771234567' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', phonePattern: /^\+27[0-9]{9}$/, phonePlaceholder: '+27821234567' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267', phonePattern: /^\+267[0-9]{7,8}$/, phonePlaceholder: '+26771234567' },
    { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264', phonePattern: /^\+264[0-9]{7,9}$/, phonePlaceholder: '+264811234567' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258', phonePattern: /^\+258[0-9]{8,9}$/, phonePlaceholder: '+258841234567' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265', phonePattern: /^\+265[0-9]{7,9}$/, phonePlaceholder: '+265991234567' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255', phonePattern: /^\+255[0-9]{9}$/, phonePlaceholder: '+255712345678' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', phonePattern: /^\+254[0-9]{9}$/, phonePlaceholder: '+254712345678' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256', phonePattern: /^\+256[0-9]{9}$/, phonePlaceholder: '+256712345678' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250', phonePattern: /^\+250[0-9]{9}$/, phonePlaceholder: '+250781234567' },
    { code: 'CD', name: 'DR Congo', flag: '🇨🇩', dialCode: '+243', phonePattern: /^\+243[0-9]{9}$/, phonePlaceholder: '+243812345678' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244', phonePattern: /^\+244[0-9]{9}$/, phonePlaceholder: '+244912345678' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', phonePattern: /^\+234[0-9]{10}$/, phonePlaceholder: '+2348012345678' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', phonePattern: /^\+233[0-9]{9}$/, phonePlaceholder: '+233241234567' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251', phonePattern: /^\+251[0-9]{9}$/, phonePlaceholder: '+251911234567' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', phonePattern: /^\+20[0-9]{10}$/, phonePlaceholder: '+201012345678' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212', phonePattern: /^\+212[0-9]{9}$/, phonePlaceholder: '+212612345678' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221', phonePattern: /^\+221[0-9]{9}$/, phonePlaceholder: '+221771234567' },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225', phonePattern: /^\+225[0-9]{10}$/, phonePlaceholder: '+2250712345678' },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237', phonePattern: /^\+237[0-9]{9}$/, phonePlaceholder: '+237671234567' },
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', phonePattern: /^\+1[0-9]{10}$/, phonePlaceholder: '+12025551234' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', phonePattern: /^\+44[0-9]{10}$/, phonePlaceholder: '+447911123456' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', phonePattern: /^\+1[0-9]{10}$/, phonePlaceholder: '+14165551234' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', phonePattern: /^\+61[0-9]{9}$/, phonePlaceholder: '+61412345678' },
    { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', phonePattern: /^\+91[0-9]{10}$/, phonePlaceholder: '+919876543210' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', phonePattern: /^\+49[0-9]{10,11}$/, phonePlaceholder: '+491512345678' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', phonePattern: /^\+33[0-9]{9}$/, phonePlaceholder: '+33612345678' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', phonePattern: /^\+39[0-9]{9,10}$/, phonePlaceholder: '+393123456789' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', phonePattern: /^\+34[0-9]{9}$/, phonePlaceholder: '+34612345678' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', phonePattern: /^\+31[0-9]{9}$/, phonePlaceholder: '+31612345678' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32', phonePattern: /^\+32[0-9]{8,9}$/, phonePlaceholder: '+32470123456' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', phonePattern: /^\+351[0-9]{9}$/, phonePlaceholder: '+351912345678' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', phonePattern: /^\+41[0-9]{9}$/, phonePlaceholder: '+41791234567' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', phonePattern: /^\+43[0-9]{10,11}$/, phonePlaceholder: '+436641234567' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', phonePattern: /^\+46[0-9]{9}$/, phonePlaceholder: '+46701234567' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47', phonePattern: /^\+47[0-9]{8}$/, phonePlaceholder: '+4712345678' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45', phonePattern: /^\+45[0-9]{8}$/, phonePlaceholder: '+4512345678' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358', phonePattern: /^\+358[0-9]{9,10}$/, phonePlaceholder: '+358401234567' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', phonePattern: /^\+48[0-9]{9}$/, phonePlaceholder: '+48501234567' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420', phonePattern: /^\+420[0-9]{9}$/, phonePlaceholder: '+420601234567' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', phonePattern: /^\+7[0-9]{10}$/, phonePlaceholder: '+79161234567' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380', phonePattern: /^\+380[0-9]{9}$/, phonePlaceholder: '+380501234567' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', phonePattern: /^\+90[0-9]{10}$/, phonePlaceholder: '+905301234567' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', phonePattern: /^\+966[0-9]{9}$/, phonePlaceholder: '+966501234567' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', phonePattern: /^\+971[0-9]{9}$/, phonePlaceholder: '+971501234567' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972', phonePattern: /^\+972[0-9]{9}$/, phonePlaceholder: '+972501234567' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', phonePattern: /^\+81[0-9]{10}$/, phonePlaceholder: '+819012345678' },
    { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', phonePattern: /^\+86[0-9]{11}$/, phonePlaceholder: '+8613812345678' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', phonePattern: /^\+82[0-9]{9,10}$/, phonePlaceholder: '+821012345678' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', phonePattern: /^\+65[0-9]{8}$/, phonePlaceholder: '+6591234567' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', phonePattern: /^\+60[0-9]{9,10}$/, phonePlaceholder: '+60123456789' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', phonePattern: /^\+66[0-9]{9}$/, phonePlaceholder: '+66812345678' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', phonePattern: /^\+63[0-9]{10}$/, phonePlaceholder: '+639171234567' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', phonePattern: /^\+62[0-9]{9,12}$/, phonePlaceholder: '+62812345678' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', phonePattern: /^\+84[0-9]{9}$/, phonePlaceholder: '+84912345678' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', phonePattern: /^\+55[0-9]{10,11}$/, phonePlaceholder: '+5511987654321' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', phonePattern: /^\+52[0-9]{10}$/, phonePlaceholder: '+525512345678' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', phonePattern: /^\+54[0-9]{10}$/, phonePlaceholder: '+541123456789' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', phonePattern: /^\+56[0-9]{9}$/, phonePlaceholder: '+56912345678' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', phonePattern: /^\+57[0-9]{10}$/, phonePlaceholder: '+573012345678' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51', phonePattern: /^\+51[0-9]{9}$/, phonePlaceholder: '+51912345678' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', phonePattern: /^\+64[0-9]{8,9}$/, phonePlaceholder: '+6421123456' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353', phonePattern: /^\+353[0-9]{9}$/, phonePlaceholder: '+353871234567' },
];

// Industry list
export const industries = [
    'Agriculture',
    'Automotive',
    'Banking & Finance',
    'Construction',
    'Consulting',
    'Education',
    'Energy & Utilities',
    'Entertainment & Media',
    'Food & Beverage',
    'Government',
    'Healthcare',
    'Hospitality & Tourism',
    'Information Technology',
    'Insurance',
    'Legal Services',
    'Manufacturing',
    'Mining',
    'Non-Profit',
    'Real Estate',
    'Retail',
    'Telecommunications',
    'Transportation & Logistics',
    'Other',
];

// Company size options
export const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-100', label: '11-100 employees' },
    { value: '100+', label: '100+ employees' },
] as const;

// Helper function to validate phone number by country
export function validatePhoneForCountry(phone: string, countryCode: string): { valid: boolean; message: string } {
    const country = countries.find(c => c.code === countryCode);
    if (!country) {
        return { valid: false, message: 'Please select a country' };
    }

    if (!phone.startsWith(country.dialCode)) {
        return { valid: false, message: `Phone number must start with ${country.dialCode} for ${country.name}` };
    }

    if (!country.phonePattern.test(phone)) {
        return { valid: false, message: `Invalid phone number format for ${country.name}. Example: ${country.phonePlaceholder}` };
    }

    return { valid: true, message: '' };
}

// Get country by code
export function getCountryByCode(code: string): Country | undefined {
    return countries.find(c => c.code === code);
}
