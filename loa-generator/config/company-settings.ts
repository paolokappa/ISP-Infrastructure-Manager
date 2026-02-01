// Company Settings Configuration
export interface CompanySettings {
  // Company Information
  company: {
    name: string;
    legalName: string;
    vatNumber: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    asNumber?: string;
    logoUrl?: string;
  };
  
  // LoA Template Settings
  loaTemplate: {
    authorizedSignatory: string;
    signatoryTitle: string;
    signatoryEmail: string;
    defaultValidityDays: number;
    includeVatNumber: boolean;
    includeAsNumber: boolean;
    customFooterText?: string;
  };
  
  // API Configurations
  apis: {
    equinix: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      apiUrl: string;
    };
    peeringDb: {
      enabled: boolean;
      apiKey?: string;
      apiUrl: string;
    };
    whois: {
      enabled: boolean;
      defaultServer: string;
    };
  };
  
  // Feature Flags
  features: {
    autoWhoisLookup: boolean;
    equinixSync: boolean;
    pdfGeneration: boolean;
    emailNotifications: boolean;
  };
}

// Default settings - replace with your company information
export const defaultSettings: CompanySettings = {
  company: {
    name: "Your Company Name",
    legalName: "Your Company Legal Name",
    vatNumber: "VAT-000000",
    address: "Your Street Address",
    city: "Your City",
    postalCode: "00000",
    country: "Your Country",
    phone: "+00 00 000 00 00",
    email: "noc@example.com",
    website: "https://www.example.com",
    asNumber: "AS00000",
    logoUrl: "/assets/logo.png"
  },
  
  loaTemplate: {
    authorizedSignatory: "Authorized Person Name",
    signatoryTitle: "Title/Position",
    signatoryEmail: "signatory@example.com",
    defaultValidityDays: 365,
    includeVatNumber: true,
    includeAsNumber: true,
    customFooterText: "This Letter of Authorization is valid only for the specific cross-connect detailed above."
  },
  
  apis: {
    equinix: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      apiUrl: "https://api.equinix.com"
    },
    peeringDb: {
      enabled: true,
      apiKey: "",
      apiUrl: "https://www.peeringdb.com/api"
    },
    whois: {
      enabled: true,
      defaultServer: "whois.ripe.net"
    }
  },
  
  features: {
    autoWhoisLookup: true,
    equinixSync: false,
    pdfGeneration: true,
    emailNotifications: false
  }
};

// Get settings from localStorage or use defaults
export function getSettings(): CompanySettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  
  const stored = localStorage.getItem('companySettings');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored settings:', e);
      return defaultSettings;
    }
  }
  
  return defaultSettings;
}

// Save settings to localStorage
export function saveSettings(settings: CompanySettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('companySettings', JSON.stringify(settings));
  }
}

// Reset to default settings
export function resetSettings(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('companySettings');
  }
}

// Export settings as JSON
export function exportSettings(settings: CompanySettings): string {
  return JSON.stringify(settings, null, 2);
}

// Import settings from JSON
export function importSettings(json: string): CompanySettings {
  try {
    const settings = JSON.parse(json);
    // Validate structure
    if (!settings.company || !settings.apis || !settings.loaTemplate) {
      throw new Error('Invalid settings structure');
    }
    return settings;
  } catch (e) {
    throw new Error('Failed to import settings: ' + (e as Error).message);
  }
}