// WHOIS lookup functions for automatic company data population

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WhoisData {
  asNumber?: string;
  orgName?: string;
  country?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  nocEmail?: string;
  abuseEmail?: string;
}

/**
 * Parse WHOIS response to extract company information
 */
function parseWhoisResponse(whoisText: string): WhoisData {
  const data: WhoisData = {};
  
  // Extract AS Number
  const asMatch = whoisText.match(/aut-num:\s*(AS\d+)/i);
  if (asMatch) data.asNumber = asMatch[1];
  
  // Extract Organization Name
  const orgNameMatch = whoisText.match(/org-name:\s*(.+)/i);
  if (orgNameMatch) data.orgName = orgNameMatch[1].trim();
  
  // Extract Country
  const countryMatch = whoisText.match(/country:\s*([A-Z]{2})/i);
  if (countryMatch) data.country = countryMatch[1];
  
  // Extract Address (from org section)
  const addressLines: string[] = [];
  const addressMatches = whoisText.matchAll(/address:\s*(.+)/gi);
  for (const match of addressMatches) {
    const line = match[1].trim();
    if (line && !line.match(/^\d{4,5}$/)) { // Skip postal codes alone
      addressLines.push(line);
    }
  }
  
  // Parse address components
  if (addressLines.length > 0) {
    // Usually format is: Street, PostalCode, City, Country
    data.address = addressLines[0]; // First line is usually street
    
    // Try to find postal code and city
    for (const line of addressLines) {
      // Swiss/EU postal code pattern
      const postalMatch = line.match(/^(\d{4,5})\s+(.+)$/);
      if (postalMatch) {
        data.postalCode = postalMatch[1];
        data.city = postalMatch[2];
      }
      // Check if line contains country name
      if (line.match(/^(SWITZERLAND|ITALY|GERMANY|FRANCE|AUSTRIA)/i)) {
        // This is country line, previous might be city
        const prevIndex = addressLines.indexOf(line) - 1;
        if (prevIndex >= 0 && !data.city) {
          const prevLine = addressLines[prevIndex];
          if (prevLine.match(/^\d{4,5}\s+(.+)$/)) {
            const cityMatch = prevLine.match(/^\d{4,5}\s+(.+)$/);
            if (cityMatch) data.city = cityMatch[1];
          } else if (!prevLine.includes(',')) {
            data.city = prevLine;
          }
        }
      }
    }
  }
  
  // Extract Phone
  const phoneMatch = whoisText.match(/phone:\s*(.+)/i);
  if (phoneMatch) data.phone = phoneMatch[1].trim();
  
  // Extract emails from remarks
  const nocEmailMatch = whoisText.match(/noc@[\w.-]+/i);
  if (nocEmailMatch) data.nocEmail = nocEmailMatch[0];
  
  const abuseEmailMatch = whoisText.match(/abuse@[\w.-]+/i);
  if (abuseEmailMatch) data.abuseEmail = abuseEmailMatch[0];
  
  // General email
  const emailMatch = whoisText.match(/e-mail:\s*([\w.-]+@[\w.-]+)/i);
  if (emailMatch) data.email = emailMatch[1];
  
  return data;
}

/**
 * Lookup WHOIS information for an AS number
 */
export async function lookupAS(asNumber: string): Promise<WhoisData | null> {
  try {
    // Clean AS number (remove "AS" prefix if present)
    const cleanAS = asNumber.replace(/^AS/i, '');
    
    // Query RIPE database (covers European networks)
    const { stdout: ripeOutput } = await execAsync(`whois -h whois.ripe.net AS${cleanAS}`);
    
    if (ripeOutput.includes('aut-num:')) {
      return parseWhoisResponse(ripeOutput);
    }
    
    // Try ARIN (North American networks)
    const { stdout: arinOutput } = await execAsync(`whois -h whois.arin.net AS${cleanAS}`);
    if (arinOutput.includes('ASNumber:')) {
      return parseWhoisResponse(arinOutput);
    }
    
    // Try APNIC (Asia-Pacific networks)
    const { stdout: apnicOutput } = await execAsync(`whois -h whois.apnic.net AS${cleanAS}`);
    if (apnicOutput.includes('aut-num:')) {
      return parseWhoisResponse(apnicOutput);
    }
    
    return null;
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    return null;
  }
}

/**
 * Lookup WHOIS information for a company name from PeeringDB
 */
export async function lookupCompanyFromPeeringDB(networkId: number): Promise<WhoisData | null> {
  try {
    const response = await fetch(`https://www.peeringdb.com/api/net/${networkId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const net = data.data?.[0];
    
    if (!net) return null;
    
    const whoisData: WhoisData = {
      asNumber: net.asn ? `AS${net.asn}` : undefined,
      orgName: net.name || undefined,
      nocEmail: net.policy_email || net.tech_email || undefined,
      phone: net.policy_phone || net.tech_phone || undefined,
    };
    
    // If we have an ASN, do a proper WHOIS lookup for more details
    if (net.asn) {
      const asData = await lookupAS(`AS${net.asn}`);
      if (asData) {
        // Merge with priority to WHOIS data
        return { ...whoisData, ...asData };
      }
    }
    
    return whoisData;
  } catch (error) {
    console.error('PeeringDB lookup error:', error);
    return null;
  }
}

/**
 * Format address for display in form
 */
export function formatAddress(data: WhoisData): string {
  const parts: string[] = [];
  
  if (data.address) parts.push(data.address);
  if (data.postalCode && data.city) {
    parts.push(`${data.postalCode} ${data.city}`);
  } else if (data.city) {
    parts.push(data.city);
  }
  if (data.country) {
    const countryNames: { [key: string]: string } = {
      'CH': 'Switzerland',
      'IT': 'Italy',
      'DE': 'Germany',
      'FR': 'France',
      'AT': 'Austria',
      'US': 'United States',
      'GB': 'United Kingdom',
    };
    parts.push(countryNames[data.country] || data.country);
  }
  
  return parts.join(', ');
}