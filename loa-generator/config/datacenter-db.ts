// Datacenter Database - Example configuration
// Replace with your actual datacenter information

export interface PortInfo {
  portNumber: number;
  status: 'available' | 'occupied' | 'reserved';
  zSideCustomer?: string;
  installationDate?: string;
  mediaType?: string;
  orderNumber?: string;
}

export interface DatacenterInfo {
  id: string;
  name: string;
  displayName: string;
  address: string;
  siteCode: string;
  facilityId?: number;
  ourInfo: {
    customer: string;
    accountNumber?: string;
    ibx: string;
    cage?: string;
    cabinet: string;
    cabinetType?: string;
    cabinetUniqueSpaceId?: string;
    location?: string;
    systemName?: string;
    patchPanel: string;
    room?: string;
    defaultPort?: string;
    availablePorts?: string[];
    maxPorts?: number;
    portDetails?: PortInfo[];
    dedicatedMediaType?: string;
    panelType?: string;
    preWired?: boolean;
    ifcEnabled?: boolean;
    rackLocation?: string;
    installLocation?: string;
    installationRequired?: boolean;
    circuitAvailable?: boolean;
    provisioningType?: string;
    device?: string;
    devicePort?: string;
    odfInfo?: string;
    lastApiSync?: string;
    syncSource?: string;
  };
  commonRequesters?: {
    name: string;
    displayName: string;
  }[];
  technicalDefaults?: {
    connectionType?: string;
    connectorType?: string;
    speed?: string;
    mediaType?: string;
  };
}

// Example datacenter configuration
// Replace these with your actual datacenter information
export const datacenterDatabase: DatacenterInfo[] = [
  {
    id: "example-dc1",
    name: "Example Datacenter 1",
    displayName: "Example DC1",
    address: "123 Example Street, City, Country",
    siteCode: "DC1",
    facilityId: 1,
    ourInfo: {
      customer: "Your Company",
      ibx: "DC1",
      cabinet: "A01",
      patchPanel: "PP-A01",
      defaultPort: "1",
      availablePorts: ["1", "2", "3", "4"],
      maxPorts: 24
    },
    technicalDefaults: {
      connectionType: "single-mode",
      connectorType: "LC",
      speed: "10G",
      mediaType: "OS2"
    }
  }
];

// Helper functions
export function getDatacenterById(id: string): DatacenterInfo | undefined {
  return datacenterDatabase.find(dc => dc.id === id);
}

export function getDatacenterByName(name: string): DatacenterInfo | undefined {
  const normalized = name.toLowerCase().trim();
  return datacenterDatabase.find(dc => 
    dc.name.toLowerCase() === normalized ||
    dc.displayName.toLowerCase().includes(normalized) ||
    dc.siteCode.toLowerCase() === normalized
  );
}

export function searchDatacenters(query: string): DatacenterInfo[] {
  const normalized = query.toLowerCase().trim();
  return datacenterDatabase.filter(dc =>
    dc.name.toLowerCase().includes(normalized) ||
    dc.displayName.toLowerCase().includes(normalized) ||
    dc.siteCode.toLowerCase().includes(normalized) ||
    dc.address.toLowerCase().includes(normalized)
  );
}

export function getAllDatacenterNames(): { value: string; label: string }[] {
  return datacenterDatabase.map(dc => ({
    value: dc.id,
    label: dc.displayName,
  }));
}

export function getCommonRequesters(datacenterId: string): { value: string; label: string }[] {
  const dc = getDatacenterById(datacenterId);
  if (!dc || !dc.commonRequesters) return [];
  
  return dc.commonRequesters.map(req => ({
    value: req.name,
    label: req.displayName,
  }));
}

export default datacenterDatabase;