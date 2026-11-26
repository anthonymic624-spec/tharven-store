import type { DeliveryConfig, Product, SocialLinks } from '../types.ts';

export const THARVEN_CATALOGUE: Product[] = [
  {
    id: 'heritage-polo',
    name: 'THARVEN Heritage Polo',
    category: 'Apparel',
    priceNgn: 50000,
    description:
      'Architectural boxy-fit knit polo finished with contrast collar, embroidered crest, gothic THARVEN front typography, and tonal 03 back numbering.',
    images: [
      '/assets/aistudio/100a3c98-029e-47b2-ba00-deef67422e4e_f2b80a8a.jpeg',
      '/assets/aistudio/f174dc1c-0dfb-413f-88f6-e3a273eb35b9_28f937c9.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
    isFeatured: true,
    isNewArrival: true,
  },
  {
    id: 'signature-leather-shorts',
    name: 'THARVEN Signature Leather Shorts',
    category: 'Apparel',
    priceNgn: 60000,
    description:
      'Structured knee-length leather shorts featuring twin-snap waist hardware and ornate gold THARVEN front crest detailing.',
    images: [
      '/assets/aistudio/748666a7-eb13-4d73-b369-e7cd7f9836d0_9ef2d481.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
    isFeatured: true,
    isNewArrival: true,
  },
  {
    id: 'tharven-t-shirt',
    name: 'THARVEN T-Shirt',
    category: 'Apparel',
    priceNgn: 50000,
    description:
      'Heavyweight paneled tee accented with sculpted contrast piping, gold-embroidered rider crest, and "Beyond Fashion, Beyond Time." chest mark.',
    images: [
      '/assets/aistudio/96072b58-3de1-4b86-bb7d-fae424a4d344_c1521d26.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
    isFeatured: true,
    isNewArrival: true,
  },
  {
    id: 'identity-necklace',
    name: 'THARVEN Identity Necklace',
    category: 'Accessories',
    priceNgn: 30000,
    description:
      'High-polish silver-tone box chain paired with a sculpted architectural THARVEN wordmark pendant.',
    images: [
      '/assets/aistudio/0f4ec4e4-9e90-49f4-b107-fb08a17f8c19_1f93ad75.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
    isFeatured: true,
    isNewArrival: false,
  },
  {
    id: 'classic-black-leather-belt',
    name: 'THARVEN CLASSIC Black leather belt',
    category: 'Accessories',
    priceNgn: 80000,
    description: 'Black leather belt with a silver-tone THARVEN wordmark buckle.',
    images: [
      '/assets/aistudio/a653a846-fc1b-45f7-9aba-1d325e3f66ab_07239357.jpeg',
    ],
    sizes: [],
    colors: [],
    stock: null,
    active: true,
    isFeatured: true,
    isNewArrival: false,
  },
];

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  configured: false,
  generalNotes: '',
  rules: [],
};

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: '',
  tiktok: '',
  x: '',
};
