import { NextResponse } from 'next/server';

interface WhoisData {
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

async function lookupASViaRIPE(asNumber: string): Promise<WhoisData | null> {
  try {
    // Clean AS number
    const cleanAS = asNumber.replace(/^AS/i, '');
    
    // Step 1: Get AS information
    const asnResponse = await fetch(
      `https://rest.db.ripe.net/ripe/aut-num/AS${cleanAS}.json`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!asnResponse.ok) {
      // Try other registries if RIPE doesn't have it
      return lookupASViaOtherRegistries(cleanAS);
    }
    
    const asnData = await asnResponse.json();
    const whoisData: WhoisData = {
      asNumber: `AS${cleanAS}`
    };
    
    // Extract org-name and org reference
    let orgId = null;
    if (asnData.objects?.object?.[0]?.attributes?.attribute) {
      const attributes = asnData.objects.object[0].attributes.attribute;
      
      // Find org reference
      const orgAttr = attributes.find((attr: any) => attr.name === 'org');
      if (orgAttr) orgId = orgAttr.value;
      
      // Find as-name
      const asNameAttr = attributes.find((attr: any) => attr.name === 'as-name');
      if (asNameAttr && !whoisData.orgName) {
        whoisData.orgName = asNameAttr.value;
      }
      
      // Find remarks for NOC/abuse emails
      attributes.forEach((attr: any) => {
        if (attr.name === 'remarks' && attr.value) {
          const nocMatch = attr.value.match(/noc@[\w.-]+/i);
          if (nocMatch) whoisData.nocEmail = nocMatch[0];
          
          const abuseMatch = attr.value.match(/abuse@[\w.-]+/i);
          if (abuseMatch) whoisData.abuseEmail = abuseMatch[0];
        }
      });
    }
    
    // Step 2: Get organization details if we have an org ID
    if (orgId) {
      const orgResponse = await fetch(
        `https://rest.db.ripe.net/ripe/organisation/${orgId}.json`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        
        if (orgData.objects?.object?.[0]?.attributes?.attribute) {
          const orgAttributes = orgData.objects.object[0].attributes.attribute;
          
          // Extract organization details
          const orgNameAttr = orgAttributes.find((attr: any) => attr.name === 'org-name');
          if (orgNameAttr) whoisData.orgName = orgNameAttr.value;
          
          const countryAttr = orgAttributes.find((attr: any) => attr.name === 'country');
          if (countryAttr) whoisData.country = countryAttr.value;
          
          const phoneAttr = orgAttributes.find((attr: any) => attr.name === 'phone');
          if (phoneAttr) whoisData.phone = phoneAttr.value;
          
          // Extract address lines
          const addressLines = orgAttributes
            .filter((attr: any) => attr.name === 'address')
            .map((attr: any) => attr.value);
          
          if (addressLines.length > 0) {
            // Parse address components
            const streetAddress = [];
            let postalCode = null;
            let city = null;
            
            for (const line of addressLines) {
              // Check for postal code patterns (4-5 digits)
              const postalMatch = line.match(/^(\d{4,5})\s+(.+)$/);
              if (postalMatch) {
                postalCode = postalMatch[1];
                city = postalMatch[2];
              } else if (line.match(/^(SWITZERLAND|ITALY|GERMANY|FRANCE|AUSTRIA)/i)) {
                // This is the country line, skip it
                continue;
              } else if (!postalCode && !line.includes(',')) {
                // This might be city or street
                if (line.match(/^[A-Z][a-z]/)) {
                  city = line;
                } else {
                  streetAddress.push(line);
                }
              } else {
                streetAddress.push(line);
            }
            }
            
            if (streetAddress.length > 0) {
              whoisData.address = streetAddress.join(', ');
            }
            if (postalCode) whoisData.postalCode = postalCode;
            if (city) whoisData.city = city;
          }
        }
      }
    }
    
    return whoisData;
  } catch (error) {
    console.error('RIPE lookup error:', error);
    return null;
  }
}

async function lookupASViaOtherRegistries(asNumber: string): Promise<WhoisData | null> {
  // Try PeeringDB as an alternative source
  try {
    const pdbResponse = await fetch(
      `https://www.peeringdb.com/api/net?asn=${asNumber}`
    );
    
    if (pdbResponse.ok) {
      const pdbData = await pdbResponse.json();
      const net = pdbData.data?.[0];
      
      if (net) {
        return {
          asNumber: `AS${asNumber}`,
          orgName: net.name,
          nocEmail: net.policy_email || net.tech_email,
          phone: net.policy_phone || net.tech_phone,
        };
      }
    }
  } catch (error) {
    console.error('PeeringDB lookup error:', error);
  }
  
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asn = searchParams.get('asn');
  const netId = searchParams.get('netId');
  
  if (!asn && !netId) {
    return NextResponse.json({ error: 'Missing asn or netId parameter' }, { status: 400 });
  }
  
  try {
    let data = null;
    
    if (netId) {
      // Lookup by PeeringDB network ID
      const response = await fetch(`https://www.peeringdb.com/api/net/${netId}`);
      if (response.ok) {
        const pdbData = await response.json();
        const net = pdbData.data?.[0];
        
        if (net && net.asn) {
          // Get more details via WHOIS
          data = await lookupASViaRIPE(`AS${net.asn}`);
          if (!data) {
            // Fallback to basic PeeringDB data
            data = {
              asNumber: `AS${net.asn}`,
              orgName: net.name,
              nocEmail: net.policy_email || net.tech_email,
              phone: net.policy_phone || net.tech_phone,
            };
          }
        }
      }
    } else if (asn) {
      // Direct AS lookup
      data = await lookupASViaRIPE(asn);
    }
    
    if (!data) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('WHOIS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}