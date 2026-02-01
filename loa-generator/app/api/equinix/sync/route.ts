// Advanced Sync API for Equinix Patch Panel with Smart Merge
import { NextRequest, NextResponse } from 'next/server';
import { fetchPatchPanelDetails } from '@/app/lib/equinix-api';
import fs from 'fs/promises';
import path from 'path';

interface PortInfo {
  portNumber: number;
  status: 'available' | 'occupied' | 'reserved';
  zSideCustomer?: string;
  installationDate?: string;
  mediaType?: string;
  orderNumber?: string;
}

interface ExistingDatacenter {
  id: string;
  ourInfo: {
    patchPanel?: string;
    portDetails?: PortInfo[];
    availablePorts?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

// POST /api/equinix/sync - Smart sync with database merge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      patchPanelId = 'PP:0201:0102:1374601',
      datacenterId = 'equinix-zh2',
      preserveCustomerInfo = true 
    } = body;

    // Step 1: Fetch fresh data from Equinix API
    console.log(`[SYNC] Fetching data for patch panel: ${patchPanelId}`);
    const equinixData = await fetchPatchPanelDetails(patchPanelId);
    
    if (!equinixData) {
      return NextResponse.json(
        { error: 'Failed to fetch patch panel data from Equinix' },
        { status: 500 }
      );
    }

    // Step 2: Read current database
    const configPath = path.join(process.cwd(), 'config', 'datacenter-db.ts');
    const currentContent = await fs.readFile(configPath, 'utf-8');
    
    // Parse the datacenter array
    const startIndex = currentContent.indexOf('export const datacenterDatabase: DatacenterInfo[] = [');
    const endIndex = currentContent.indexOf('];', startIndex) + 1;
    
    if (startIndex === -1 || endIndex === -1) {
      return NextResponse.json(
        { error: 'Could not parse datacenter configuration file' },
        { status: 500 }
      );
    }
    
    const datacentersString = currentContent.substring(
      currentContent.indexOf('[', startIndex),
      endIndex
    );
    
    // Safely evaluate the datacenter array
    let datacenters: ExistingDatacenter[];
    try {
      datacenters = eval(`(${datacentersString})`);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse datacenter configuration' },
        { status: 500 }
      );
    }

    // Step 3: Find the target datacenter
    const dcIndex = datacenters.findIndex(dc => dc.id === datacenterId);
    if (dcIndex === -1) {
      return NextResponse.json(
        { error: `Datacenter ${datacenterId} not found` },
        { status: 404 }
      );
    }

    const datacenter = datacenters[dcIndex];
    const existingPortDetails = datacenter.ourInfo.portDetails || [];

    // Step 4: Smart merge - preserve customer info while updating availability
    const mergedPortDetails: PortInfo[] = [];
    
    // Process all 12 ports (or max ports from existing data)
    const maxPorts = existingPortDetails.length || 12;
    
    for (let portNum = 1; portNum <= maxPorts; portNum++) {
      const existingPort = existingPortDetails.find(p => p.portNumber === portNum);
      const isAvailable = equinixData.availablePorts.includes(portNum);
      
      if (isAvailable) {
        // Port is available - clear any customer info
        mergedPortDetails.push({
          portNumber: portNum,
          status: 'available'
        });
      } else if (existingPort && preserveCustomerInfo) {
        // Port is occupied - preserve existing customer info
        mergedPortDetails.push({
          ...existingPort,
          status: 'occupied' // Ensure status is set correctly
        });
      } else {
        // Port is occupied but no existing info
        mergedPortDetails.push({
          portNumber: portNum,
          status: 'occupied',
          mediaType: 'Fiber'
        });
      }
    }

    // Step 5: Update datacenter with merged data
    datacenter.ourInfo.portDetails = mergedPortDetails;
    datacenter.ourInfo.availablePorts = equinixData.availablePorts.map(String);
    
    // Add sync metadata
    datacenter.ourInfo.lastApiSync = new Date().toISOString();
    datacenter.ourInfo.syncSource = 'Equinix API';

    // Step 6: Write back to file
    const formattedDatacenters = JSON.stringify(datacenters, null, 2)
      .replace(/"([^"]+)":/g, '"$1":');
    
    const newDatacentersContent = `export const datacenterDatabase: DatacenterInfo[] = ${formattedDatacenters};`;
    
    const newContent = 
      currentContent.substring(0, startIndex) + 
      newDatacentersContent +
      currentContent.substring(endIndex + 1);
    
    await fs.writeFile(configPath, newContent);

    // Step 7: Prepare response with sync report
    const syncReport = {
      success: true,
      message: 'Database synchronized successfully',
      patchPanelId,
      datacenterId,
      timestamp: new Date().toISOString(),
      changes: {
        totalPorts: maxPorts,
        availablePorts: equinixData.availablePorts,
        occupiedPorts: maxPorts - equinixData.availablePorts.length,
        preservedCustomerRecords: existingPortDetails.filter(p => 
          p.status === 'occupied' && p.zSideCustomer
        ).length
      },
      portDetails: mergedPortDetails
    };

    console.log('[SYNC] Synchronization completed:', syncReport.changes);

    return NextResponse.json(syncReport);

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error during synchronization' },
      { status: 500 }
    );
  }
}

// GET /api/equinix/sync - Get sync status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const datacenterId = searchParams.get('datacenterId') || 'equinix-zh2';
    
    // Read current database to check last sync
    const configPath = path.join(process.cwd(), 'config', 'datacenter-db.ts');
    const content = await fs.readFile(configPath, 'utf-8');
    
    // Extract datacenter info
    const startIndex = content.indexOf('export const datacenterDatabase: DatacenterInfo[] = [');
    const endIndex = content.indexOf('];', startIndex) + 1;
    
    const datacentersString = content.substring(
      content.indexOf('[', startIndex),
      endIndex
    );
    
    const datacenters: ExistingDatacenter[] = eval(`(${datacentersString})`);
    const datacenter = datacenters.find(dc => dc.id === datacenterId);
    
    if (!datacenter) {
      return NextResponse.json(
        { error: 'Datacenter not found' },
        { status: 404 }
      );
    }

    const syncInfo = {
      datacenterId,
      patchPanel: datacenter.ourInfo.patchPanel,
      lastSync: datacenter.ourInfo.lastApiSync || null,
      syncSource: datacenter.ourInfo.syncSource || 'Static Database',
      portSummary: {
        total: datacenter.ourInfo.portDetails?.length || 0,
        available: datacenter.ourInfo.portDetails?.filter(p => p.status === 'available').length || 0,
        occupied: datacenter.ourInfo.portDetails?.filter(p => p.status === 'occupied').length || 0,
        withCustomerInfo: datacenter.ourInfo.portDetails?.filter(p => 
          p.status === 'occupied' && p.zSideCustomer
        ).length || 0
      }
    };

    return NextResponse.json(syncInfo);

  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}