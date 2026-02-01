import { NextRequest, NextResponse } from 'next/server';
import {
  searchFacilities,
  getFacility,
  getIXsInFacility,
  getNetworksInFacility,
  searchSwissDatacenters
} from '@/app/lib/peeringdb';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    const facilityId = searchParams.get('facilityId');
    
    // Search facilities by name
    if (type === 'facilities' && query) {
      const facilities = await searchFacilities(query);
      return NextResponse.json(facilities);
    }
    
    // Get all Swiss datacenters
    if (type === 'swiss') {
      const facilities = await searchSwissDatacenters();
      return NextResponse.json(facilities);
    }
    
    // Get facility details
    if (type === 'facility' && facilityId) {
      const facility = await getFacility(parseInt(facilityId));
      return NextResponse.json(facility);
    }
    
    // Get IXPs in a facility
    if (type === 'ixs' && facilityId) {
      const ixs = await getIXsInFacility(parseInt(facilityId));
      return NextResponse.json(ixs);
    }
    
    // Get networks/carriers in a facility
    if (type === 'networks' && facilityId) {
      const networks = await getNetworksInFacility(parseInt(facilityId));
      return NextResponse.json(networks);
    }
    
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (error) {
    console.error('PeeringDB API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from PeeringDB' },
      { status: 500 }
    );
  }
}