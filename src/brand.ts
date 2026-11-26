export const BRAND_NAME = 'THARVEN';
export const BRAND_SLOGAN = 'WEAR YOUR CONFIDENCE. DEFINE YOUR STYLE.';
export const BRAND_LOGO = '/assets/aistudio/35176509-c1d2-4b99-b205-e4fe985c0b53_adb0f7e6.jpeg';

export const CONTACT_WHATSAPP_DISPLAY = '+234 803 988 1639';
export const CONTACT_WHATSAPP_URL = 'https://wa.me/2348039881639';
export const CONTACT_EMAIL = 'ephraimshintima567@gmail.com';

export const PAYMENT_DETAILS = {
  provider: 'Moniepoint',
  accountNumber: '9115966747',
  accountName: 'EPHRAIM SHINTIMA',
} as const;

export const AUTHORITATIVE_PRICES_NGN: Record<string, number> = {
  shirt: 50000,
  shorts: 60000,
  necklace: 30000,
  belt: 20000,
};

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
