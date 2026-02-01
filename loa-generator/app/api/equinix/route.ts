// API Route for Equinix Patch Panel Integration
import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchPatchPanelDetails, 
  fetchAvailablePatchPanels,
  syncEquinixPatchPanel 
} from '@/app/lib/equinix-api';

// GET /api/equinix - Fetch patch panel information
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'sync') {
      // Sync specific patch panel
      const patchPanelId = searchParams.get('patchPanelId');
      if (!patchPanelId) {
        return NextResponse.json(
          { error: 'patchPanelId is required' },
          { status: 400 }
        );
      }
      
      const result = await syncEquinixPatchPanel(patchPanelId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        data: result.data,
        message: 'Patch panel data synced successfully'
      });
      
    } else if (action === 'details') {
      // Get patch panel details
      const patchPanelId = searchParams.get('patchPanelId');
      if (!patchPanelId) {
        return NextResponse.json(
          { error: 'patchPanelId is required' },
          { status: 400 }
        );
      }
      
      const data = await fetchPatchPanelDetails(patchPanelId);
      if (!data) {
        return NextResponse.json(
          { error: 'Failed to fetch patch panel details' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        data 
      });
      
    } else if (action === 'list') {
      // List available patch panels
      const cabinetId = searchParams.get('cabinetId');
      const accountNumber = searchParams.get('accountNumber');
      
      if (!cabinetId || !accountNumber) {
        return NextResponse.json(
          { error: 'cabinetId and accountNumber are required' },
          { status: 400 }
        );
      }
      
      const panels = await fetchAvailablePatchPanels(cabinetId, accountNumber);
      return NextResponse.json({ 
        success: true,
        data: panels 
      });
      
    } else {
      // Default action: sync Equinix ZH2 patch panel
      const zh2PatchPanelId = 'PP:0201:0102:1374601';
      const result = await syncEquinixPatchPanel(zh2PatchPanelId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        data: result.data,
        message: 'Default Equinix ZH2 patch panel synced'
      });
    }
  } catch (error) {
    console.error('Equinix API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/equinix - Update local database with Equinix data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patchPanelId, updateDatabase } = body;
    
    if (!patchPanelId) {
      return NextResponse.json(
        { error: 'patchPanelId is required' },
        { status: 400 }
      );
    }
    
    // Fetch latest data from Equinix
    const data = await fetchPatchPanelDetails(patchPanelId);
    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch patch panel details' },
        { status: 500 }
      );
    }
    
    // If updateDatabase flag is set, update the local datacenter-db.ts
    if (updateDatabase) {
      // This would integrate with the existing datacenter-config API
      // to update the static database with fresh data
      const fs = require('fs').promises;
      const path = require('path');
      
      const configPath = path.join(process.cwd(), 'config', 'datacenter-db.ts');
      let content = await fs.readFile(configPath, 'utf-8');
      
      // Update port details for Equinix ZH2
      if (patchPanelId === 'PP:0201:0102:1374601') {
        // Parse available ports and update the portDetails array
        const portDetails = [];
        for (let i = 1; i <= 12; i++) {
          const isAvailable = data.availablePorts.includes(i);
          if (isAvailable) {
            portDetails.push({
              portNumber: i,
              status: 'available'
            });
          } else {
            // Keep existing occupied port data
            portDetails.push({
              portNumber: i,
              status: 'occupied'
              // Preserve existing customer info from static data
            });
          }
        }
        
        // Update availablePorts array in the config
        const availablePortsStr = JSON.stringify(data.availablePorts.map(String));
        content = content.replace(
          /"availablePorts":\s*\[[^\]]*\]/,
          `"availablePorts": ${availablePortsStr}`
        );
        
        await fs.writeFile(configPath, content);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      data,
      message: updateDatabase 
        ? 'Patch panel data synced and database updated' 
        : 'Patch panel data synced'
    });
  } catch (error) {
    console.error('Equinix API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}