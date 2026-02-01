// PeeringDB API Integration
// Documentation: https://www.peeringdb.com/apidocs/
// To generate a read-only API key: https://www.peeringdb.com/account/api_keys/

const PEERINGDB_API_BASE = 'https://www.peeringdb.com/api';
const API_DELAY = 150; // 150ms delay between API calls to avoid rate limiting
const BATCH_SIZE = 10; // Reduced batch size from 20 to 10 for gentler API usage

// Optional: Set your PeeringDB API key for better rate limits
// You can generate a read-only key at: https://www.peeringdb.com/account/api_keys/
const PEERINGDB_API_KEY = process.env.NEXT_PUBLIC_PEERINGDB_API_KEY || '';

// Helper function to get fetch headers with optional API key
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  
  if (PEERINGDB_API_KEY) {
    headers['Authorization'] = `Api-Key ${PEERINGDB_API_KEY}`;
  }
  
  return headers;
}

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface Facility {
  id: number;
  name: string;
  aka?: string;
  org_name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  country: string;
  zipcode: string;
  latitude: number;
  longitude: number;
  net_count: number;
  ix_count: number;
  carrier_count: number;
  website?: string;
}

export interface InternetExchange {
  id: number;
  name: string;
  name_long?: string;
  city: string;
  country: string;
  region_continent: string;
  media: string;
  policy_email?: string;
  tech_email?: string;
  website?: string;
}

export interface Network {
  id: number;
  asn: number;
  name: string;
  aka?: string;
  name_long?: string;
  website?: string;
  policy_general?: string;
  policy_ratio?: boolean;
  info_type?: string;
  info_prefixes4?: number;
  info_prefixes6?: number;
}

export interface Carrier {
  id: number;
  name: string;
  aka?: string;
  website?: string;
}

// Search facilities by name, city, or country
export async function searchFacilities(query: string): Promise<Facility[]> {
  try {
    // Check if query contains country code filter (e.g., "Equinix CH" or "Equinix Switzerland")
    const countryPatterns = [
      { pattern: /\s+(CH|ch)$/i, country: 'CH' },
      { pattern: /\s+(IT|it)$/i, country: 'IT' },
      { pattern: /\s+(DE|de)$/i, country: 'DE' },
      { pattern: /\s+(FR|fr)$/i, country: 'FR' },
      { pattern: /\s+(UK|GB|gb|uk)$/i, country: 'GB' },
      { pattern: /\s+(US|us)$/i, country: 'US' },
      { pattern: /\s+Switzerland$/i, country: 'CH' },
      { pattern: /\s+Italy$/i, country: 'IT' },
      { pattern: /\s+Germany$/i, country: 'DE' },
      { pattern: /\s+France$/i, country: 'FR' },
    ];
    
    let searchQuery = query;
    let countryFilter = '';
    
    for (const { pattern, country } of countryPatterns) {
      if (pattern.test(query)) {
        searchQuery = query.replace(pattern, '');
        countryFilter = `&country=${country}`;
        break;
      }
    }
    
    const response = await fetch(
      `${PEERINGDB_API_BASE}/fac?name_search=${encodeURIComponent(searchQuery)}${countryFilter}`,
      { headers: getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch facilities');
    }
    
    const data = await response.json();
    
    // Sort results: prioritize exact country matches if searching with country
    let results = data.data || [];
    if (countryFilter) {
      results.sort((a: Facility, b: Facility) => {
        // Prioritize facilities in the searched country
        const aCountryMatch = countryFilter.includes(a.country) ? 0 : 1;
        const bCountryMatch = countryFilter.includes(b.country) ? 0 : 1;
        return aCountryMatch - bCountryMatch;
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return [];
  }
}

// Get facility by ID
export async function getFacility(id: number): Promise<Facility | null> {
  try {
    const response = await fetch(`${PEERINGDB_API_BASE}/fac/${id}`, { headers: getHeaders() });
    
    if (!response.ok) {
      throw new Error('Failed to fetch facility');
    }
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching facility:', error);
    return null;
  }
}

// Simple cache for network addresses to avoid repeated WHOIS lookups
const addressCache = new Map<number, string>();

// Get network details by ID with WHOIS lookup for address
export async function getNetworkDetails(networkId: number): Promise<any> {
  try {
    console.log('Getting details for network ID:', networkId);
    
    const response = await fetch(
      `${PEERINGDB_API_BASE}/net/${networkId}`,
      { headers: getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch network details');
    }
    
    const data = await response.json();
    const network = data.data?.[0] || null;
    
    if (!network) {
      console.log('Network not found');
      return null;
    }
    
    console.log('Network basic info:', { id: network.id, name: network.name, asn: network.asn });
    
    // Check cache first
    if (addressCache.has(networkId)) {
      network.whois_address = addressCache.get(networkId);
      console.log('Using cached address for network', networkId, ':', network.whois_address);
      return network;
    }
    
    // Try multiple sources for address information
    
    // 1. Check if network object already has address fields
    if (network.address || network.org_address) {
      const address = network.address || network.org_address;
      network.whois_address = address;
      addressCache.set(networkId, address);
      console.log('Found address in network object:', address);
      return network;
    }
    
    // 2. Try to get address from PeeringDB org details
    if (network.org_id) {
      try {
        const orgResponse = await fetch(
          `${PEERINGDB_API_BASE}/org/${network.org_id}`,
          { headers: getHeaders() }
        );
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          const org = orgData.data?.[0];
          if (org) {
            const addressParts = [];
            if (org.address1) addressParts.push(org.address1);
            if (org.address2) addressParts.push(org.address2);
            if (org.city) addressParts.push(org.city);
            if (org.state) addressParts.push(org.state);
            if (org.zipcode) addressParts.push(org.zipcode);
            if (org.country) addressParts.push(org.country);
            
            if (addressParts.length > 0) {
              network.whois_address = addressParts.join(', ');
              addressCache.set(networkId, network.whois_address);
              console.log('Found address from org:', network.whois_address);
              return network;
            }
          }
        }
      } catch (e) {
        console.log('Org lookup failed:', e);
      }
    }
    
    // 3. Try to get address from PeeringDB pocset (Points of Contact)
    try {
      const pocResponse = await fetch(
        `${PEERINGDB_API_BASE}/poc?net_id=${networkId}`,
        { headers: getHeaders() }
      );
      
      if (pocResponse.ok) {
        const pocData = await pocResponse.json();
        if (pocData.data && pocData.data.length > 0) {
          // Look for NOC or general contact with address
          for (const poc of pocData.data) {
            if (poc.address1 || poc.address2) {
              const addressParts = [];
              if (poc.address1) addressParts.push(poc.address1);
              if (poc.address2) addressParts.push(poc.address2);
              if (poc.city) addressParts.push(poc.city);
              if (poc.state) addressParts.push(poc.state);
              if (poc.zipcode) addressParts.push(poc.zipcode);
              if (poc.country) addressParts.push(poc.country);
              
              if (addressParts.length > 0) {
                network.whois_address = addressParts.join(', ');
                addressCache.set(networkId, network.whois_address);
                console.log('Found address in PeeringDB POC:', network.whois_address);
                return network;
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('POC lookup failed, trying WHOIS');
    }
    
    // If we have a network with ASN, try to get address from WHOIS
    if (network && network.asn) {
      try {
        // Step 1: Get the ASN object to find the org reference
        const asnResponse = await fetch(
          `https://rest.db.ripe.net/ripe/aut-num/AS${network.asn}.json`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (asnResponse.ok) {
          const asnData = await asnResponse.json();
          let orgId = null;
          
          // Find the org reference in the ASN object
          if (asnData.objects && asnData.objects.object && asnData.objects.object[0]) {
            const attributes = asnData.objects.object[0].attributes?.attribute || [];
            const orgAttr = attributes.find((attr: any) => attr.name === 'org');
            if (orgAttr) {
              orgId = orgAttr.value;
              console.log('Found org ID:', orgId);
            }
          }
          
          // Step 2: If we have an org ID, get the organization details
          if (orgId) {
            const orgResponse = await fetch(
              `https://rest.db.ripe.net/ripe/organisation/${orgId}.json`,
              { headers: { 'Accept': 'application/json' } }
            );
            
            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              
              // Extract address from organization object
              if (orgData.objects && orgData.objects.object && orgData.objects.object[0]) {
                const orgAttributes = orgData.objects.object[0].attributes?.attribute || [];
                let addressParts = [];
                let orgName = '';
                
                for (const attr of orgAttributes) {
                  if (attr.name === 'address') {
                    addressParts.push(attr.value);
                  }
                  if (attr.name === 'org-name') {
                    orgName = attr.value;
                  }
                }
                
                // Build full address from parts
                if (addressParts.length > 0) {
                  network.whois_address = addressParts.join(', ');
                  network.whois_org = orgName;
                  addressCache.set(networkId, network.whois_address);
                  console.log('Found organization address:', network.whois_address);
                }
              }
            }
          }
        }
        
        // If RIPE lookup didn't work, try ARIN for US networks
        if (!network.whois_address && network.info_type === 'NSP') {
          try {
            const arinResponse = await fetch(
              `https://whois.arin.net/rest/asn/AS${network.asn}.json`,
              { headers: { 'Accept': 'application/json' } }
            );
            
            if (arinResponse.ok) {
              const arinData = await arinResponse.json();
              if (arinData.asn && arinData.asn.orgRef) {
                const orgHandle = arinData.asn.orgRef['@handle'];
                if (orgHandle) {
                  const orgResponse = await fetch(
                    `https://whois.arin.net/rest/org/${orgHandle}.json`,
                    { headers: { 'Accept': 'application/json' } }
                  );
                  
                  if (orgResponse.ok) {
                    const orgData = await orgResponse.json();
                    if (orgData.org && orgData.org.streetAddress) {
                      const addr = orgData.org.streetAddress;
                      const addressParts = [];
                      if (addr.line) {
                        const lines = Array.isArray(addr.line) ? addr.line : [addr.line];
                        addressParts.push(...lines.filter((l: any) => l && l['$']));
                      }
                      if (orgData.org.city && orgData.org.city['$']) addressParts.push(orgData.org.city['$']);
                      if (orgData.org.iso3166_1 && orgData.org.iso3166_1.code2 && orgData.org.iso3166_1.code2['$']) {
                        addressParts.push(orgData.org.iso3166_1.code2['$']);
                      }
                      if (orgData.org.postalCode && orgData.org.postalCode['$']) addressParts.push(orgData.org.postalCode['$']);
                      
                      if (addressParts.length > 0) {
                        network.whois_address = addressParts.join(', ');
                        addressCache.set(networkId, network.whois_address);
                        console.log('Found address in ARIN:', network.whois_address);
                      }
                    }
                  }
                }
              }
            }
          } catch (arinError) {
            console.log('ARIN lookup failed:', arinError);
          }
        }
        
        // If still no address, try fallback methods
        if (!network.whois_address) {
          try {
            // Try RIPEstat API as fallback
            const ripestatResponse = await fetch(
              `https://stat.ripe.net/data/whois/data.json?resource=AS${network.asn}`,
              { headers: { 'Accept': 'application/json' } }
            );
            
            if (ripestatResponse.ok) {
              const ripestatData = await ripestatResponse.json();
              // Try to extract any address info from remarks
              if (ripestatData.data && ripestatData.data.records) {
                const records = ripestatData.data.records[0] || [];
                let addressInfo = [];
                
                for (const record of records) {
                  if (record.key === 'remarks' && record.value) {
                    // Look for address patterns in remarks
                    const lines = record.value.split('\n');
                    for (const line of lines) {
                      if (line.match(/\d+.*[,]\s*\d{4,5}/) || // Street address pattern
                          line.match(/^[A-Z]{2}-\d{4,5}/) || // Postal code pattern
                          line.includes('Via ') || line.includes('Street') || 
                          line.includes('Avenue') || line.includes('Rue ')) {
                        addressInfo.push(line.trim());
                      }
                    }
                  }
                }
                
                if (addressInfo.length > 0) {
                  network.whois_address = addressInfo.join(', ');
                  addressCache.set(networkId, network.whois_address);
                  console.log('Found address in remarks:', network.whois_address);
                }
              }
            }
          } catch (ripestatError) {
            console.log('RIPEstat lookup failed:', ripestatError);
          }
        }
      } catch (whoisError) {
        console.log('WHOIS lookup failed:', whoisError);
      }
    }
    
    return network;
  } catch (error) {
    console.error('Error fetching network details:', error);
    return null;
  }
}

// Get IX details by ID
export async function getIXDetails(ixId: number): Promise<any> {
  try {
    const response = await fetch(
      `${PEERINGDB_API_BASE}/ix/${ixId}`,
      { headers: getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch IX details');
    }
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching IX details:', error);
    return null;
  }
}

// Get IXPs in a facility
export async function getIXsInFacility(facilityId: number): Promise<InternetExchange[]> {
  try {
    // Get IX-Facility relationships
    const ixFacResponse = await fetch(
      `${PEERINGDB_API_BASE}/ixfac?fac_id=${facilityId}`,
      { headers: getHeaders() }
    );
    
    if (!ixFacResponse.ok) {
      throw new Error('Failed to fetch IX-Facility relationships');
    }
    
    const ixFacData = await ixFacResponse.json();
    const ixIds = ixFacData.data?.map((item: any) => item.ix_id) || [];
    
    if (ixIds.length === 0) {
      return [];
    }
    
    // Fetch IX details with small delays to be gentle with API
    const uniqueIxIds = [...new Set(ixIds)];
    const ixs = [];
    
    // Fetch IXPs sequentially with delay to avoid rate limiting
    for (let i = 0; i < uniqueIxIds.length; i++) {
      try {
        const response = await fetch(`${PEERINGDB_API_BASE}/ix/${uniqueIxIds[i]}`, { headers: getHeaders() });
        const data = await response.json();
        if (data.data?.[0]) {
          ixs.push(data.data[0]);
        }
        
        // Add small delay between IX requests
        if (i < uniqueIxIds.length - 1) {
          await delay(API_DELAY);
        }
      } catch (err) {
        console.log(`Failed to fetch IX ${uniqueIxIds[i]}`);
      }
    }
    
    return ixs;
  } catch (error) {
    console.error('Error fetching IXs:', error);
    return [];
  }
}

// Get networks (carriers) in a facility - OPTIMIZED VERSION
export async function getNetworksInFacility(facilityId: number): Promise<Network[]> {
  try {
    console.log('Fetching networks for facility ID:', facilityId);
    
    // Get network-facility relationships
    const netFacResponse = await fetch(
      `${PEERINGDB_API_BASE}/netfac?fac_id=${facilityId}&limit=1000`,
      { headers: getHeaders() }
    );
    
    if (!netFacResponse.ok) {
      throw new Error('Failed to fetch Network-Facility relationships');
    }
    
    const netFacData = await netFacResponse.json();
    console.log('Found', netFacData.data?.length || 0, 'network relationships');
    
    // Extract unique network IDs
    const networkIds = new Set<number>();
    
    if (netFacData.data && Array.isArray(netFacData.data)) {
      for (const item of netFacData.data) {
        if (item.net_id) {
          networkIds.add(item.net_id);
        }
      }
    }
    
    if (networkIds.size === 0) {
      return [];
    }
    
    // Fetch network details in parallel batches
    const uniqueIds = Array.from(networkIds);
    const batchSize = BATCH_SIZE; // Use reduced batch size (10)
    const allNetworks = [];
    
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const batchPromises = batch.map(id =>
        fetch(`${PEERINGDB_API_BASE}/net/${id}`, { headers: getHeaders() })
          .then(res => res.json())
          .then(data => data.data?.[0])
          .catch(() => null)
      );
      
      const batchResults = await Promise.all(batchPromises);
      allNetworks.push(...batchResults.filter(net => net !== null));
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < uniqueIds.length) {
        await delay(API_DELAY * 2); // 300ms delay between batches
      }
    }
    
    if (allNetworks.length === 0) {
      console.log('No networks found for facility', facilityId);
      return [];
    }
    
    console.log('Found', allNetworks.length, 'networks');
    
    // Sort networks alphabetically
    const sortedNetworks = allNetworks
      .filter(net => net && net.name) // Only require name, not ASN
      .sort((a, b) => {
        // Sort alphabetically by name
        return a.name.localeCompare(b.name);
      }); // Show all networks
    
    console.log('Returning', sortedNetworks.length, 'sorted networks');
    return sortedNetworks;
  } catch (error) {
    console.error('Error fetching networks:', error);
    return [];
  }
}

// Get carriers in a facility
export async function getCarriersInFacility(facilityId: number): Promise<Carrier[]> {
  try {
    // First get Carrier-Facility relationships
    const carrierFacResponse = await fetch(
      `${PEERINGDB_API_BASE}/carrierfac?fac_id=${facilityId}`,
      { headers: getHeaders() }
    );
    
    if (!carrierFacResponse.ok) {
      throw new Error('Failed to fetch Carrier-Facility relationships');
    }
    
    const carrierFacData = await carrierFacResponse.json();
    const carrierIds = carrierFacData.data?.map((item: any) => item.carrier_id) || [];
    
    if (carrierIds.length === 0) {
      return [];
    }
    
    // Fetch carrier details with delays to be gentle with API
    const uniqueCarrierIds = [...new Set(carrierIds)];
    const carriers = [];
    
    // Fetch carriers sequentially with small delay
    for (let i = 0; i < uniqueCarrierIds.length; i++) {
      try {
        const response = await fetch(`${PEERINGDB_API_BASE}/carrier/${uniqueCarrierIds[i]}`, { headers: getHeaders() });
        const data = await response.json();
        if (data.data?.[0]) {
          carriers.push(data.data[0]);
        }
        
        // Add small delay between carrier requests
        if (i < uniqueCarrierIds.length - 1) {
          await delay(API_DELAY);
        }
      } catch (err) {
        console.log(`Failed to fetch carrier ${uniqueCarrierIds[i]}`);
      }
    }
    
    return carriers;
  } catch (error) {
    console.error('Error fetching carriers:', error);
    return [];
  }
}

// Format facility for display in dropdown
export function formatFacilityOption(facility: Facility): string {
  return `${facility.name} - ${facility.city}, ${facility.country}`;
}

// Format facility address
export function formatFacilityAddress(facility: Facility): string {
  const parts = [
    facility.address1,
    facility.address2,
    facility.city,
    facility.state,
    facility.zipcode,
    facility.country
  ].filter(Boolean);
  
  return parts.join(', ');
}

// Search Swiss datacenters specifically
export async function searchSwissDatacenters(): Promise<Facility[]> {
  try {
    const response = await fetch(
      `${PEERINGDB_API_BASE}/fac?country=CH`,
      { headers: getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Swiss facilities');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Swiss facilities:', error);
    return [];
  }
}

// Search by AS Number
export async function searchByASN(asn: number): Promise<Network | null> {
  try {
    const response = await fetch(
      `${PEERINGDB_API_BASE}/net?asn=${asn}`,
      { headers: getHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch network by ASN');
    }
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching network by ASN:', error);
    return null;
  }
}