export interface VoiceCommand {
  keywords: string[];
  route: (role: 'buyer' | 'farmer') => string;
  label: string;
}

const COMMANDS: VoiceCommand[] = [
  {
    keywords: ['dashboard', 'home', 'overview', 'main'],
    route: (role) => `/dashboard/${role}/overview`,
    label: 'Dashboard',
  },
  {
    keywords: ['orders', 'my orders', 'order'],
    route: (role) => role === 'buyer' ? '/dashboard/buyer/my-orders' : '/dashboard/farmer/orders',
    label: 'My Orders',
  },
  {
    keywords: ['browse', 'products', 'shop', 'buy', 'market'],
    route: () => '/dashboard/buyer/browse',
    label: 'Browse Products',
  },
  {
    keywords: ['cart', 'basket', 'checkout'],
    route: () => '/dashboard/buyer/cart',
    label: 'Cart',
  },
  {
    keywords: ['suppliers', 'farmers', 'seller'],
    route: () => '/dashboard/buyer/suppliers',
    label: 'Suppliers',
  },
  {
    keywords: ['profile', 'account', 'settings', 'my profile'],
    route: (role) => `/dashboard/${role}/profile`,
    label: 'Profile',
  },
  {
    keywords: ['jobs', 'work', 'labour', 'labor'],
    route: () => '/dashboard/farmer/jobs',
    label: 'Jobs',
  },
  {
    keywords: ['crops', 'my crops', 'listings', 'my products'],
    route: () => '/dashboard/farmer/my-crops',
    label: 'My Crops',
  },
  {
    keywords: ['add product', 'add crop', 'new product', 'list product'],
    route: () => '/dashboard/farmer/add-product',
    label: 'Add Product',
  },
  {
    keywords: ['subsidies', 'schemes', 'government', 'support'],
    route: () => '/dashboard/farmer/subsidies',
    label: 'Subsidies',
  },
  {
    keywords: ['skills', 'training', 'learn', 'education'],
    route: () => '/dashboard/farmer/skill-development',
    label: 'Skill Development',
  },
  {
    keywords: ['order requests', 'requests', 'bulk order'],
    route: (role) => `/dashboard/${role}/order-requests`,
    label: 'Order Requests',
  },
];

export function parseVoiceCommand(
  transcript: string,
  role: 'buyer' | 'farmer'
): { route: string; label: string } | null {
  const lower = transcript.toLowerCase();

  for (const cmd of COMMANDS) {
    if (cmd.keywords.some((kw) => lower.includes(kw))) {
      return { route: cmd.route(role), label: cmd.label };
    }
  }

  return null;
}

export function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
