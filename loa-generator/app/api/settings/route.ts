import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'config', 'company-settings.json');

// GET /api/settings - Get current settings
export async function GET() {
  try {
    const fileContent = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    const settings = JSON.parse(fileContent);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error reading settings:', error);
    
    // If file doesn't exist, return default settings
    if ((error as any).code === 'ENOENT') {
      const defaultSettings = {
        company: {
          name: "Your Company Name",
          legalName: "Your Company Name",
          vatNumber: "VAT-000000",
          address: "Your Street Address",
          city: "Your City",
          postalCode: "00000",
          country: "Switzerland",
          phone: "+00 00 000 00 00",
          email: "noc@example.com",
          website: "https://www.example.com",
          asNumber: "AS00000",
          logoUrl: "/logo.png"
        },
        loaTemplate: {
          authorizedSignatory: "Authorized Person Name",
          signatoryTitle: "Network Manager",
          signatoryEmail: "signatory@example.com",
          defaultValidityDays: 365,
          includeVatNumber: true,
          includeAsNumber: true,
          customFooterText: "This Letter of Authorization is valid only for the specific cross-connect detailed above."
        },
        apis: {
          equinix: {
            enabled: true,
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
          equinixSync: true,
          pdfGeneration: true,
          emailNotifications: false
        }
      };
      
      // Create the file with default settings
      await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(defaultSettings, null, 2));
      return NextResponse.json(defaultSettings);
    }
    
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Save settings
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    // Validate settings structure
    if (!settings.company || !settings.apis || !settings.loaTemplate || !settings.features) {
      return NextResponse.json(
        { error: 'Invalid settings structure' },
        { status: 400 }
      );
    }
    
    // Save to file
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully' 
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Reset to defaults
export async function PUT() {
  try {
    const defaultSettings = {
      company: {
        name: "Your Company Name",
        legalName: "Your Company Name",
        vatNumber: "VAT-000000",
        address: "Your Street Address",
        city: "Your City",
        postalCode: "00000",
        country: "Switzerland",
        phone: "+00 00 000 00 00",
        email: "noc@example.com",
        website: "https://www.example.com",
        asNumber: "AS00000",
        logoUrl: "/logo.png"
      },
      loaTemplate: {
        authorizedSignatory: "Authorized Person Name",
        signatoryTitle: "Network Manager",
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
        equinixSync: true,
        pdfGeneration: true,
        emailNotifications: false
      }
    };
    
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(defaultSettings, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings reset to defaults',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    );
  }
}