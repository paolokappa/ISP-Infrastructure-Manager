'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loaFormSchema, LoaFormData } from '@/app/lib/schemas'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { companyConfig } from '@/config/company.config'
import { datacenterDatabase, getDatacenterByName, type DatacenterInfo } from '@/config/datacenter-db'
import DatacenterAutocomplete from './DatacenterAutocomplete'
import { formatFacilityAddress, type Facility, getIXsInFacility, getNetworksInFacility, getCarriersInFacility, searchFacilities, getNetworkDetails, getIXDetails } from '@/app/lib/peeringdb'

export default function LoaForm() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [ixList, setIxList] = useState<any[]>([])
  const [networkList, setNetworkList] = useState<any[]>([])
  const [loadingIxs, setLoadingIxs] = useState(false)
  // Filter only datacenters with Our Equipment Information configured
  const [knownDatacenters, setKnownDatacenters] = useState<DatacenterInfo[]>(
    datacenterDatabase.filter(dc => 
      dc.ourInfo && (dc.ourInfo.cabinet || dc.ourInfo.cage || dc.ourInfo.patchPanel)
    )
  )
  const [selectedKnownDc, setSelectedKnownDc] = useState<DatacenterInfo | null>(null)
  const [datacenterNameDisplay, setDatacenterNameDisplay] = useState('')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    watch
  } = useForm<LoaFormData>({
    resolver: zodResolver(loaFormSchema),
    defaultValues: {
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      // Company defaults from config
      companyName: companyConfig.companyName,
      vatNumber: companyConfig.vatNumber,
      companyRegistration: companyConfig.companyRegistration,
      // Port default
      ourPort: 'Next available port',
    },
  })

  // Handle facility selection
  // Handle requesting company selection - fetch address in background
  const handleRequestingCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log('Requesting company selected:', value);
    
    // Only fetch if user actually selected something (not empty or custom options)
    if (value && value !== '' && value !== '__custom__' && value !== 'InternetONE') {
      console.log('Fetching address for:', value);
      
      // Don't block the UI - fetch address in background
      setTimeout(async () => {
        try {
        // Try to find the selected item in the lists
        const selectedNetwork = networkList.find(net => net.name === value);
        const selectedIX = ixList.find(ix => ix.name === value);
        
        if (selectedNetwork) {
          // Get full network details including address from WHOIS
          const details = await getNetworkDetails(selectedNetwork.id);
          console.log('Network details with WHOIS:', details);
          if (details) {
            let address = '';
            
            // First try to use WHOIS address if available
            if (details.whois_address) {
              address = details.whois_address;
              console.log('Using WHOIS address:', address);
            } else {
              // Fallback to any address fields in the response
              console.log('No WHOIS address found, checking other fields...');
              if (details.address) address = details.address;
              else if (details.org_address) address = details.org_address;
              else if (details.name_long) {
                // Use long name as a fallback if no address
                address = details.name_long;
              }
            }
            
            console.log('Formatted address:', address);
            if (address && address.trim() !== '') {
              setValue('requestingAddress', address);
              console.log('Address set in form:', address);
            } else {
              console.log('No address found for network');
            }
          }
        } else if (selectedIX) {
          // Get full IX details including address
          const details = await getIXDetails(selectedIX.id);
          console.log('IX details:', details);
          if (details) {
            // Format address from IX details
            let address = '';
            if (details.address1) address += details.address1;
            if (details.address2) address += (address ? ', ' : '') + details.address2;
            if (details.city) address += (address ? ', ' : '') + details.city;
            if (details.state) address += ', ' + details.state;
            if (details.zipcode) address += ' ' + details.zipcode;
            if (details.country) address += ', ' + details.country;
            
            console.log('Formatted IX address:', address);
            if (address && address.trim() !== '') {
              setValue('requestingAddress', address);
              console.log('IX Address set in form:', address);
            } else {
              console.log('No address found for IX');
            }
          }
        }
        } catch (error) {
          console.error('Error fetching operator details:', error);
          // Don't block the form, just skip address
        }
      }, 0); // Execute immediately but in next tick
    } else {
      // Clear address for custom or empty selection
      setValue('requestingAddress', '');
    }
  };

  const handleFacilitySelect = async (facility: Facility) => {
    setSelectedFacility(facility)
    
    // Auto-populate datacenter fields
    setValue('datacenterName', facility.name)
    setDatacenterNameDisplay(facility.name) // Update autocomplete display
    setValue('datacenterAddress', formatFacilityAddress(facility))
    
    // Check if this is one of our known datacenters and auto-fill Our Equipment Location
    const knownDc = getDatacenterByName(facility.name)
    if (knownDc) {
      setSelectedKnownDc(knownDc)
      // Auto-populate Our Equipment Location fields
      if (knownDc.ourInfo.cage) setValue('ourCage', knownDc.ourInfo.cage)
      if (knownDc.ourInfo.cabinet) setValue('ourCabinet', knownDc.ourInfo.cabinet)
      if (knownDc.ourInfo.room) setValue('ourRoom', knownDc.ourInfo.room)
      if (knownDc.ourInfo.patchPanel) setValue('ourPatchPanel', knownDc.ourInfo.patchPanel)
      if (knownDc.ourInfo.defaultPort) setValue('ourPort', knownDc.ourInfo.defaultPort)
    } else {
      setSelectedKnownDc(null)
    }
    
    // Extract site code intelligently
    let siteCode = '';
    
    // First check if there's an explicit AKA field
    if (facility.aka) {
      siteCode = facility.aka;
    } else if (facility.name) {
      // For Equinix, extract patterns like "ZH2", "ZH4", "ZH5"
      if (facility.name.toLowerCase().includes('equinix')) {
        const equinixMatch = facility.name.match(/\b([A-Z]{2,4}\d+)\b/);
        if (equinixMatch) {
          siteCode = equinixMatch[1]; // e.g., "ZH4" from "Equinix ZH4 - Zurich"
        }
      }
      // For Interxion, extract patterns like "ZUR1", "MIL1", "MIL2"
      else if (facility.name.toLowerCase().includes('interxion')) {
        const interxionMatch = facility.name.match(/\b([A-Z]{3,4}\d+)\b/);
        if (interxionMatch) {
          siteCode = interxionMatch[1]; // e.g., "ZUR1" from "Interxion ZUR1"
        }
      }
      // For other datacenters, try common patterns
      else {
        const patterns = [
          /\b([A-Z]{2,4}\d+[A-Z]*)\b/, // Generic pattern like MIL2, FRA1A
          /(?:DC|dc)\s*([A-Z0-9]+)/,   // DC followed by code
          /-\s*([A-Z0-9]+)$/,           // Code after hyphen at end
        ];
        
        for (const pattern of patterns) {
          const match = facility.name.match(pattern);
          if (match) {
            siteCode = match[1];
            break;
          }
        }
      }
      
      // If still no match and name has multiple words, check if last word is a code
      if (!siteCode) {
        const parts = facility.name.split(/[\s-]+/);
        const lastPart = parts[parts.length - 1];
        // Only use last part if it looks like a code and isn't the city name
        if (lastPart && 
            /^[A-Z0-9]{2,10}$/.test(lastPart) && 
            lastPart !== facility.city &&
            !['DATACENTER', 'CENTER', 'CENTRE', 'DC'].includes(lastPart.toUpperCase())) {
          siteCode = lastPart;
        }
      }
    }
    
    setValue('siteCode', siteCode)
    
    // Load IXs and Networks for this facility
    setLoadingIxs(true)
    
    // Preserve the current port value before async operations
    const currentPortValue = getValues('ourPort') || 'Next available port';
    
    try {
      const [ixs, networks, carriers] = await Promise.all([
        getIXsInFacility(facility.id),
        getNetworksInFacility(facility.id),
        getCarriersInFacility(facility.id)
      ])
      setIxList(ixs)
      // Combine networks and carriers into one list
      const combinedList = [...networks, ...carriers]
      setNetworkList(combinedList)
      
      // Restore the port value after async operations
      setValue('ourPort', currentPortValue);
    } catch (error) {
      console.error('Failed to load IXs/Networks:', error)
      setIxList([])
      setNetworkList([])
      
      // Restore port value even if there's an error
      setValue('ourPort', currentPortValue);
    } finally {
      setLoadingIxs(false)
    }
  }

  const onSubmit = async (data: LoaFormData) => {
    setIsGenerating(true)
    try {
      // Add fixed company data
      // Filter out empty strings to avoid PDF rendering errors
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value
        }
        return acc
      }, {} as any)
      
      const formDataWithCompany = {
        ...cleanData,
        companyName: companyConfig.companyName,
        vatNumber: companyConfig.vatNumber,
        companyRegistration: companyConfig.companyRegistration,
      }
      
      console.log('Starting PDF generation with data:', formDataWithCompany)
      console.log('Requesting Address in PDF data:', formDataWithCompany.requestingAddress)
      
      // Importa dinamicamente le librerie PDF solo quando necessario (client-side)
      const { pdf } = await import('@react-pdf/renderer')
      const { default: PdfTemplate } = await import('@/app/lib/pdf-template')
      
      // Load settings from API
      let companySettings = null;
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          companySettings = await response.json();
        }
      } catch (error) {
        console.error('Failed to load company settings:', error);
      }
      
      console.log('Libraries imported, creating document...')
      
      // Verifica che i dati esistano
      if (!data) {
        throw new Error('No data provided for PDF generation')
      }
      
      const doc = <PdfTemplate data={formDataWithCompany} settings={companySettings} />
      console.log('Document created, generating PDF...')
      
      const asPdf = pdf(doc)
      const blob = await asPdf.toBlob()
      
      console.log('PDF blob created, size:', blob.size)
      
      const fileName = `LOA_${data.companyName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
      saveAs(blob, fileName)
      
      console.log('PDF saved as:', fileName)
    } catch (error) {
      console.error('Error generating PDF:', error)
      console.error('Error stack:', (error as any).stack)
      alert('Error generating PDF: ' + (error as any).message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto p-6 animate-fadeIn">
      <div className="card">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">📋</span>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LoA Generator
          </h2>
          <p className="text-gray-600 mt-2">Letter of Authorization for Cross-Connect</p>
        </div>
        
        {/* LoA Details */}
        <div className="mb-8">
          <h3 className="section-title">
            <span className="mr-2">📋</span>
            LoA Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Issue Date *
              </label>
              <input
                type="date"
                {...register('issueDate')}
                className="form-input"
              />
              {errors.issueDate && (
                <p className="form-error">{errors.issueDate.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                Expiry Date (optional)
              </label>
              <input
                type="date"
                {...register('expiryDate')}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Datacenter Information */}
        <div className="mb-8">
          <h3 className="section-title flex items-center justify-between">
            <span>
              <span className="mr-2">🏭</span>
              Datacenter Information
            </span>
            <a
              href="/datacenter-config"
              target="_blank"
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Edit Datacenter Configuration"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </h3>
          
          {/* Quick Select for Known Datacenters */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Quick Select Datacenters:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {knownDatacenters.map((dc) => (
                <button
                  key={dc.id}
                  type="button"
                  onClick={async () => {
                    // Immediately set the selected datacenter to show disabled field
                    setSelectedKnownDc(dc)
                    
                    // Set the search term in the autocomplete field (simplified name for search)
                    const searchTerm = dc.displayName.split(' - ')[0] // Gets "Equinix ZH2" from "Equinix ZH2 - Zürich"
                    setDatacenterNameDisplay(searchTerm)
                    
                    // Auto-populate Our Equipment Location (treat all fields the same)
                    setValue('ourCage', dc.ourInfo.cage || '')
                    setValue('ourCabinet', dc.ourInfo.cabinet || '')
                    setValue('ourRoom', dc.ourInfo.room || '')
                    setValue('ourPatchPanel', dc.ourInfo.patchPanel || '')
                    setValue('ourPort', dc.ourInfo.defaultPort || 'Next available port')
                    
                    // Search for the datacenter in PeeringDB and load operators in parallel
                    setLoadingIxs(true)
                    
                    try {
                      // Always search via API, don't use cached facility ID
                      const facilities = await searchFacilities(searchTerm)
                      
                      if (facilities && facilities.length > 0) {
                        // Use the first matching facility from PeeringDB
                        const facility = facilities[0]
                        
                        // Update form values with PeeringDB data
                        setValue('datacenterName', facility.name)
                        setValue('datacenterAddress', formatFacilityAddress(facility))
                        
                        // Don't call handleFacilitySelect here, just set the facility
                        // to avoid overwriting our datacenter values
                        setSelectedFacility(facility)
                        
                        // Keep the search term visible in the autocomplete
                        setDatacenterNameDisplay(searchTerm)
                        
                        // Extract and set site code
                        setValue('siteCode', dc.siteCode)
                        
                        // Always load IXs and Networks from API
                        try {
                          const [ixs, networks, carriers] = await Promise.all([
                            getIXsInFacility(facility.id),
                            getNetworksInFacility(facility.id),
                            getCarriersInFacility(facility.id)
                          ])
                          setIxList(ixs)
                          // Combine networks and carriers into one list
                          const combinedList = [...networks, ...carriers]
                          setNetworkList(combinedList)
                          console.log('Loaded networks:', networks.length, 'carriers:', carriers.length, 'total:', combinedList.length)
                        } catch (error) {
                          console.error('Error loading IXs/Networks:', error)
                        }
                      } else {
                        // No results from PeeringDB
                        setValue('datacenterName', searchTerm)
                      }
                    } catch (error) {
                      console.error('Error fetching datacenter from PeeringDB:', error)
                      setValue('datacenterName', searchTerm)
                    } finally {
                      setLoadingIxs(false)
                    }
                  }}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    selectedKnownDc?.id === dc.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {dc.displayName}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Datacenter Name * (PeeringDB)
              </label>
              {selectedKnownDc ? (
                <div className="relative">
                  <input
                    type="text"
                    value={selectedKnownDc.displayName}
                    disabled
                    className="form-input bg-gray-100 cursor-not-allowed pr-10"
                    placeholder="Selected from Quick Select"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKnownDc(null)
                      setDatacenterNameDisplay('')
                      setValue('datacenterName', '')
                      setValue('datacenterAddress', '')
                      setSelectedFacility(null)
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-500"
                    title="Clear selection and search manually"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <DatacenterAutocomplete
                  onSelect={handleFacilitySelect}
                  placeholder="e.g. Equinix CH, Interxion IT, Green..."
                  value={datacenterNameDisplay}
                />
              )}
              <input
                type="hidden"
                {...register('datacenterName')}
              />
              {errors.datacenterName && (
                <p className="form-error">{errors.datacenterName.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                Site Code *
              </label>
              <input
                {...register('siteCode')}
                className="form-input"
                placeholder="e.g. ZH4"
              />
              {errors.siteCode && (
                <p className="form-error">{errors.siteCode.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label">
                Datacenter Address *
              </label>
              <input
                {...register('datacenterAddress')}
                className="form-input"
                placeholder="e.g. Josefstrasse 225, 8005 Zürich"
              />
              {errors.datacenterAddress && (
                <p className="form-error">{errors.datacenterAddress.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Requesting Party */}
        <div className="mb-8">
          <h3 className="section-title">
            <span className="mr-2">🤝</span>
            Requesting Party
          </h3>
          {selectedFacility && (ixList.length > 0 || networkList.length > 0) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                📍 Available at <strong>{selectedFacility.name}</strong>: 
                {ixList.length > 0 && <span className="ml-2">🔄 {ixList.length} IXPs</span>}
                {networkList.length > 0 && (
                  <span className="ml-2">
                    🌐 {networkList.length} Networks
                    {selectedFacility.net_count > networkList.length && 
                      <span className="text-xs text-gray-600 ml-1">
                        (of {selectedFacility.net_count} total)
                      </span>
                    }
                  </span>
                )}
              </p>
            </div>
          )}
          <div>
            <label className="form-label">
              Requesting Company *
            </label>
            {selectedFacility && (ixList.length > 0 || networkList.length > 0) ? (
              <select
                {...register('requestingCompany')}
                className="form-select"
                onChange={async (e) => {
                  // Handle the address fetching
                  await handleRequestingCompanyChange(e);
                }}
              >
                <option value="">Select company...</option>
                {ixList.length > 0 && (
                  <optgroup label="🔄 Internet Exchanges">
                    {ixList.map((ix) => (
                      <option key={`ix-${ix.id}`} value={ix.name}>
                        {ix.name} {ix.name_long && `(${ix.name_long})`}
                      </option>
                    ))}
                  </optgroup>
                )}
                {networkList.length > 0 && (
                  <optgroup label="🌐 Networks/Carriers">
                    {networkList.map((net) => (
                      <option key={`net-${net.id}`} value={net.name}>
                        {net.name} {net.asn ? `(AS${net.asn})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="✍️ Custom / Not in PeeringDB">
                  <option value="InternetONE">InternetONE (AS44160)</option>
                  <option value="__custom__">Other company (enter manually)...</option>
                </optgroup>
              </select>
            ) : (
              <input
                {...register('requestingCompany')}
                className="form-input"
                placeholder={loadingIxs ? "Loading..." : "e.g. SwissIX, MIX Milano, Init7"}
                disabled={loadingIxs}
              />
            )}
            {errors.requestingCompany && (
              <p className="form-error">{errors.requestingCompany.message}</p>
            )}
            {/* Hidden field for requesting party address */}
            <input
              type="hidden"
              {...register('requestingAddress')}
            />
          </div>
        </div>

        {/* Our Equipment Location */}
        <div className="mb-8">
          <h3 className="section-title">
            <span className="mr-2">🔌</span>
            Our Equipment Location
          </h3>
          {selectedKnownDc && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ <strong>Auto-filled:</strong> Your Company equipment location at {selectedKnownDc.displayName} has been populated.
                {selectedKnownDc.ourInfo.accountNumber && (
                  <span className="ml-2">Account #: {selectedKnownDc.ourInfo.accountNumber}</span>
                )}
              </p>
            </div>
          )}
          {selectedFacility && !selectedKnownDc && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                💡 <strong>Tip:</strong> For {selectedFacility.name}, common formats:
                {selectedFacility.name.includes('Equinix') && 
                  <span className="ml-2">Cage format: "3A05", Rack: "3A05.02"</span>
                }
                {selectedFacility.name.includes('Interxion') && 
                  <span className="ml-2">Suite format: "S1.01", Rack: "R10"</span>
                }
                {!selectedFacility.name.includes('Equinix') && !selectedFacility.name.includes('Interxion') &&
                  <span className="ml-2">Check your colocation contract for exact location</span>
                }
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Cage/Suite *
              </label>
              <input
                {...register('ourCage')}
                className="form-input"
                placeholder="e.g. 3A05"
              />
              {errors.ourCage && (
                <p className="form-error">{errors.ourCage.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                Room/Hall
              </label>
              <input
                {...register('ourRoom')}
                className="form-input"
                placeholder="e.g. SMMIX2"
              />
            </div>
            
            <div>
              <label className="form-label">
                Cabinet/Rack *
              </label>
              <input
                {...register('ourCabinet')}
                className="form-input"
                placeholder="e.g. 3A05.02 or Rack 10"
              />
              {errors.ourCabinet && (
                <p className="form-error">{errors.ourCabinet.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                Patch Panel *
              </label>
              <input
                {...register('ourPatchPanel')}
                className="form-input"
                placeholder="e.g. PP-02"
              />
              {errors.ourPatchPanel && (
                <p className="form-error">{errors.ourPatchPanel.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                Port *
              </label>
              <select
                {...register('ourPort')}
                className="form-select"
              >
                <option value="Next available port">Next available port</option>
                {(() => {
                  // If a datacenter is selected, show only available ports from its patch panel
                  if (selectedKnownDc && selectedKnownDc.ourInfo?.portDetails) {
                    const availablePorts = selectedKnownDc.ourInfo.portDetails
                      .filter(port => port.status === 'available')
                      .map(port => port.portNumber);
                    
                    if (availablePorts.length > 0) {
                      return availablePorts.map(portNum => (
                        <option key={portNum} value={portNum.toString()}>
                          Port {portNum} (Available)
                        </option>
                      ));
                    } else {
                      return <option disabled>No ports available</option>;
                    }
                  }
                  
                  // Default fallback: show ports 1-48 if no datacenter selected
                  return Array.from({ length: 48 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num.toString()}>{num}</option>
                  ));
                })()}
              </select>
              {errors.ourPort && (
                <p className="form-error">{errors.ourPort.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mb-8">
          <h3 className="section-title">
            <span className="mr-2">⚙️</span>
            Technical Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Connection Type *
              </label>
              <select
                {...register('connectionType')}
                className="form-select"
              >
                <option value="">Select...</option>
                <option value="single-mode">Single-Mode Fiber</option>
                <option value="multi-mode">Multi-Mode Fiber</option>
                <option value="copper">Copper</option>
              </select>
              {errors.connectionType && (
                <p className="form-error">{errors.connectionType.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label">
                Connector Type *
              </label>
              <select
                {...register('connectorType')}
                className="form-select"
              >
                <option value="">Select...</option>
                <option value="LC">LC</option>
                <option value="LC/UPC">LC/UPC</option>
                <option value="LC/APC">LC/APC</option>
                <option value="SC">SC</option>
                <option value="SC/UPC">SC/UPC</option>
                <option value="SC/APC">SC/APC</option>
                <option value="RJ45">RJ45</option>
                <option value="MPO">MPO</option>
              </select>
              {errors.connectorType && (
                <p className="form-error">{errors.connectorType.message}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="form-label">
              Special Instructions
            </label>
            <textarea
              {...register('specialInstructions')}
              rows={3}
              className="form-input"
              placeholder="Any special instructions for installation..."
            />
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-secondary"
          >
            <span className="mr-2">🔄</span>
            Reset Form
          </button>
          <button
            type="submit"
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <span className="mr-2 animate-spin inline-block">⏳</span>
                Generating PDF...
              </>
            ) : (
              <>
                <span className="mr-2">📄</span>
                Generate LoA PDF
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}