export interface VoiceCommand {
  keywords: string[];
  hindiKeywords?: string[];
  // Returns null if the command is not valid for the given role
  route: (role: 'buyer' | 'farmer') => string | null;
  label: string;
  labelHi: string;
}

const COMMANDS: VoiceCommand[] = [
  {
    keywords: ['dashboard', 'home', 'overview', 'main'],
    hindiKeywords: ['डैशबोर्ड', 'होम', 'मुख्य', 'ओवरव्यू'],
    route: (role) => `/dashboard/${role}/overview`,
    label: 'Dashboard',
    labelHi: 'डैशबोर्ड',
  },
  {
    keywords: ['orders', 'my orders', 'order'],
    hindiKeywords: ['ऑर्डर', 'मेरे ऑर्डर', 'आर्डर'],
    route: (role) => role === 'buyer' ? '/dashboard/buyer/my-orders' : '/dashboard/farmer/orders',
    label: 'My Orders',
    labelHi: 'मेरे ऑर्डर',
  },
  {
    keywords: ['profile', 'account', 'settings'],
    hindiKeywords: ['प्रोफाइल', 'खाता', 'सेटिंग'],
    route: (role) => `/dashboard/${role}/profile`,
    label: 'Profile',
    labelHi: 'प्रोफाइल',
  },
  {
    keywords: ['order requests', 'requests', 'bulk order'],
    hindiKeywords: ['ऑर्डर अनुरोध', 'अनुरोध', 'बल्क ऑर्डर'],
    route: (role) => `/dashboard/${role}/order-requests`,
    label: 'Order Requests',
    labelHi: 'ऑर्डर अनुरोध',
  },

  // ── Buyer-only ────────────────────────────────────────────────────────────
  {
    keywords: ['browse', 'products', 'shop', 'buy', 'market'],
    hindiKeywords: ['उत्पाद', 'खरीदें', 'बाजार', 'ब्राउज़'],
    route: (role) => role === 'buyer' ? '/dashboard/buyer/browse' : null,
    label: 'Browse Products',
    labelHi: 'उत्पाद देखें',
  },
  {
    keywords: ['cart', 'basket', 'checkout'],
    hindiKeywords: ['कार्ट', 'टोकरी', 'चेकआउट'],
    route: (role) => role === 'buyer' ? '/dashboard/buyer/cart' : null,
    label: 'Cart',
    labelHi: 'कार्ट',
  },
  {
    keywords: ['suppliers', 'seller'],
    hindiKeywords: ['आपूर्तिकर्ता', 'विक्रेता'],
    route: (role) => role === 'buyer' ? '/dashboard/buyer/suppliers' : null,
    label: 'Suppliers',
    labelHi: 'आपूर्तिकर्ता',
  },

  // ── Farmer-only ───────────────────────────────────────────────────────────
  {
    keywords: ['jobs', 'work', 'labour', 'labor'],
    hindiKeywords: ['नौकरी', 'काम', 'मजदूर', 'रोजगार'],
    route: (role) => role === 'farmer' ? '/dashboard/farmer/jobs' : null,
    label: 'Jobs',
    labelHi: 'नौकरी',
  },
  {
    keywords: ['crops', 'my crops', 'listings'],
    hindiKeywords: ['फसल', 'मेरी फसल', 'लिस्टिंग'],
    route: (role) => role === 'farmer' ? '/dashboard/farmer/my-crops' : null,
    label: 'My Crops',
    labelHi: 'मेरी फसल',
  },
  {
    keywords: ['add product', 'add crop', 'new product', 'list product'],
    hindiKeywords: ['उत्पाद जोड़ें', 'फसल जोड़ें', 'नया उत्पाद'],
    route: (role) => role === 'farmer' ? '/dashboard/farmer/add-product' : null,
    label: 'Add Product',
    labelHi: 'उत्पाद जोड़ें',
  },
  {
    keywords: ['subsidies', 'schemes', 'government', 'support'],
    hindiKeywords: ['सब्सिडी', 'योजना', 'सरकार', 'सहायता'],
    route: (role) => role === 'farmer' ? '/dashboard/farmer/subsidies' : null,
    label: 'Subsidies',
    labelHi: 'सब्सिडी',
  },
  {
    keywords: ['skills', 'training', 'learn', 'education'],
    hindiKeywords: ['कौशल', 'प्रशिक्षण', 'सीखें', 'शिक्षा'],
    route: (role) => role === 'farmer' ? '/dashboard/farmer/skill-development' : null,
    label: 'Skill Development',
    labelHi: 'कौशल विकास',
  },
  {
    keywords: ['reviews', 'ratings', 'feedback'],
    hindiKeywords: ['समीक्षा', 'रेटिंग', 'प्रतिक्रिया'],
    route: (role) => role === 'farmer' ? '/dashboard/farmer/reviews' : null,
    label: 'Reviews',
    labelHi: 'समीक्षाएं',
  },
  {
    keywords: ['farmers', 'find farmers'],
    hindiKeywords: ['किसान', 'किसान खोजें'],
    route: (role) => role === 'buyer' ? '/dashboard/buyer/suppliers' : null,
    label: 'Find Farmers',
    labelHi: 'किसान खोजें',
  },
];

export function parseVoiceCommand(
  transcript: string,
  role: 'buyer' | 'farmer'
): { route: string; label: string } | null {
  const lower = transcript.toLowerCase();

  for (const cmd of COMMANDS) {
    const matchEn = cmd.keywords.some((kw) => lower.includes(kw));
    const matchHi = cmd.hindiKeywords?.some((kw) => transcript.includes(kw));

    if (matchEn || matchHi) {
      const route = cmd.route(role);
      // null means this command is not available for this role — skip it
      if (!route) return null;
      return { route, label: cmd.label };
    }
  }

  return null;
}

export function speak(text: string, locale = 'en') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === 'hi' ? 'hi-IN'
    : locale === 'mr' ? 'mr-IN'
    : locale === 'te' ? 'te-IN'
    : 'en-IN';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
