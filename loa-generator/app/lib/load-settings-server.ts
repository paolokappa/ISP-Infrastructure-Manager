import { CompanySettings, defaultSettings } from '@/config/company-settings';

/**
 * Server-side function to load company settings from JSON file
 */
export async function loadCompanySettingsServer(): Promise<CompanySettings> {
  try {
    // Only load from file in server context
    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      
      const settingsPath = path.join(process.cwd(), 'config', 'company-settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const fileContent = fs.readFileSync(settingsPath, 'utf-8');
        const settings = JSON.parse(fileContent) as CompanySettings;
        
        // Merge with defaults to ensure all fields exist
        return {
          ...defaultSettings,
          ...settings,
          company: { ...defaultSettings.company, ...settings.company },
          loaTemplate: { ...defaultSettings.loaTemplate, ...settings.loaTemplate },
          apis: {
            ...defaultSettings.apis,
            ...settings.apis,
            equinix: { ...defaultSettings.apis.equinix, ...(settings.apis?.equinix || {}) },
            peeringDb: { ...defaultSettings.apis.peeringDb, ...(settings.apis?.peeringDb || {}) },
            whois: { ...defaultSettings.apis.whois, ...(settings.apis?.whois || {}) }
          },
          features: { ...defaultSettings.features, ...settings.features }
        };
      }
    }
  } catch (error) {
    console.error('Error loading company settings:', error);
  }
  
  return defaultSettings;
}