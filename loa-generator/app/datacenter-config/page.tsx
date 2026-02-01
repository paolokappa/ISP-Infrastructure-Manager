'use client'

import React, { useState, useEffect } from 'react'
import { datacenterDatabase } from '@/config/datacenter-db'
import Link from 'next/link'
import { searchFacilities, formatFacilityAddress } from '@/app/lib/peeringdb'

export default function DatacenterConfig() {
  // Filter only datacenters with Our Equipment Information
  const [datacenters, setDatacenters] = useState(
    datacenterDatabase.filter(dc => 
      dc.ourInfo && (dc.ourInfo.cabinet || dc.ourInfo.cage || dc.ourInfo.patchPanel)
    )
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [portEditLocked, setPortEditLocked] = useState(true)
  const [syncingDatacenterId, setSyncingDatacenterId] = useState<string | null>(null)

  const handleEdit = (dc: any) => {
    setEditingId(dc.id)
    setEditingData(JSON.parse(JSON.stringify(dc)))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/datacenter-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datacenters })
      })
      
      if (response.ok) {
        setMessage('✅ Configuration saved successfully! The application will reload to apply changes.')
        // Force reload after a short delay to apply the changes
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setMessage('❌ Error saving configuration')
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleUpdate = () => {
    const updatedDatacenters = datacenters.map(dc => 
      dc.id === editingId ? editingData : dc
    )
    setDatacenters(updatedDatacenters)
    setEditingId(null)
    setEditingData(null)
  }

  const handleFieldChange = (path: string, value: any) => {
    const keys = path.split('.')
    const newData = { ...editingData }
    let current = newData
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    
    setEditingData(newData)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await searchFacilities(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setMessage('Error searching datacenters')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddDatacenter = (facility: any) => {
    const newDatacenter = {
      id: `custom-${Date.now()}`,
      name: facility.name,
      displayName: facility.name,
      address: formatFacilityAddress(facility),
      siteCode: facility.name.match(/[A-Z]{2,4}\d+/)?.[0] || 'CUSTOM',
      facilityId: facility.id,
      ourInfo: {
        customer: 'Your Company Name',
        ibx: '',
        cabinet: '',
        cage: '',
        patchPanel: '',
        room: '',
        defaultPort: 'Next available port',
      }
    }
    
    setDatacenters([...datacenters, newDatacenter])
    setSearchResults([])
    setSearchQuery('')
    setShowAddForm(false)
    setEditingId(newDatacenter.id)
    setEditingData(newDatacenter)
  }

  const handleRemoveDatacenter = (id: string) => {
    if (confirm('Are you sure you want to remove this datacenter configuration?')) {
      setDatacenters(datacenters.filter(dc => dc.id !== id))
    }
  }

  const handleSyncDatacenter = async (datacenterId: string, patchPanelId: string, silent: boolean = false) => {
    setSyncingDatacenterId(datacenterId)
    try {
      const response = await fetch('/api/equinix/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          datacenterId, 
          patchPanelId, 
          preserveCustomerInfo: true 
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (!silent) {
          setMessage(`✅ Synced successfully! ${result.changes.availablePorts.length} available ports, ${result.changes.occupiedPorts} occupied ports`)
        }
        
        // Update local state with the new data
        const updatedDatacenters = datacenters.map(dc => {
          if (dc.id === datacenterId) {
            return {
              ...dc,
              ourInfo: {
                ...dc.ourInfo,
                portDetails: result.portDetails,
                availablePorts: result.changes.availablePorts.map(String),
                lastApiSync: result.timestamp,
                syncSource: 'Equinix API'
              }
            }
          }
          return dc
        })
        setDatacenters(updatedDatacenters)
      } else {
        if (!silent) {
          setMessage('❌ Sync failed - check Equinix API connection')
        }
      }
    } catch (error) {
      console.error('Sync error:', error)
      if (!silent) {
        setMessage('❌ Error syncing with Equinix API')
      }
    } finally {
      setSyncingDatacenterId(null)
      if (!silent) {
        setTimeout(() => setMessage(''), 5000)
      }
    }
  }
  
  // Auto-sync Equinix ZH2 on first page load only
  useEffect(() => {
    const equinixZH2 = datacenters.find(dc => dc.id === 'equinix-zh2')
    if (equinixZH2 && equinixZH2.ourInfo.patchPanel) {
      // Check if last sync was more than 5 minutes ago or never synced
      const lastSync = equinixZH2.ourInfo.lastApiSync
      const shouldSync = !lastSync || 
        (new Date().getTime() - new Date(lastSync).getTime()) > 5 * 60 * 1000
      
      if (shouldSync) {
        console.log('Auto-syncing Equinix ZH2 patch panel on page load...')
        handleSyncDatacenter('equinix-zh2', equinixZH2.ourInfo.patchPanel, true)
      }
    }
  }, []) // Empty dependency array ensures this only runs once on mount


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              ⚙️ Datacenter Configuration Editor
            </h1>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                💾 Save All Changes
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                ← Back to Form
              </Link>
            </div>
          </div>

          {message && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          {/* Add New Datacenter Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-800">
                🏢 Add New Datacenter from PeeringDB
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showAddForm ? 'Cancel' : '+ Add Datacenter'}
              </button>
            </div>
            
            {showAddForm && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search datacenter name (e.g., Equinix, Interxion, MIX)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    {searchResults.map(facility => (
                      <div
                        key={facility.id}
                        className="p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddDatacenter(facility)}
                      >
                        <div>
                          <div className="font-medium">{facility.name}</div>
                          <div className="text-sm text-gray-600">
                            {facility.city}, {facility.country}
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {datacenters.map(dc => (
              <div key={dc.id} className="border border-gray-200 rounded-lg p-4">
                {editingId === dc.id ? (
                  <div className="space-y-4">
                    {/* Read-only datacenter information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Datacenter Information (Read-Only)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Display Name</label>
                          <p className="mt-1 text-sm text-gray-800 font-medium">{editingData.displayName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Site Code</label>
                          <p className="mt-1 text-sm text-gray-800 font-medium">{editingData.siteCode}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-600">Address</label>
                        <p className="mt-1 text-sm text-gray-800">{editingData.address}</p>
                      </div>
                    </div>

                    {/* Editable our equipment information */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-green-700 mb-2">✏️ Our Equipment Information (Editable)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cabinet</label>
                          <input
                            type="text"
                            value={editingData.ourInfo.cabinet}
                            onChange={(e) => handleFieldChange('ourInfo.cabinet', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cage/Suite</label>
                          <input
                            type="text"
                            value={editingData.ourInfo.cage || ''}
                            onChange={(e) => handleFieldChange('ourInfo.cage', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Patch Panel</label>
                          <input
                            type="text"
                            value={editingData.ourInfo.patchPanel}
                            onChange={(e) => handleFieldChange('ourInfo.patchPanel', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Room</label>
                          <input
                            type="text"
                            value={editingData.ourInfo.room || ''}
                            onChange={(e) => handleFieldChange('ourInfo.room', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">IBX/Location</label>
                          <input
                            type="text"
                            value={editingData.ourInfo.ibx || ''}
                            onChange={(e) => handleFieldChange('ourInfo.ibx', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Default Port</label>
                          <input
                            type="text"
                            value={editingData.ourInfo.defaultPort || 'Next available port'}
                            onChange={(e) => handleFieldChange('ourInfo.defaultPort', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      
                      {editingData.ourInfo.accountNumber && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">Account Number</label>
                          <input
                            type="text"
                            value={editingData.ourInfo.accountNumber || ''}
                            onChange={(e) => handleFieldChange('ourInfo.accountNumber', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Port Management Section */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-orange-700">🔌 Port Management</h4>
                        <button
                          onClick={() => setPortEditLocked(!portEditLocked)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            portEditLocked 
                              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                          title={portEditLocked ? 'Click to unlock port editing' : 'Click to lock port editing'}
                        >
                          {portEditLocked ? '🔒 Locked' : '🔓 Unlocked'}
                        </button>
                      </div>
                      
                      {editingData.ourInfo.portDetails && editingData.ourInfo.portDetails.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600 mb-2">
                            Total Ports: {editingData.ourInfo.portDetails.length} | 
                            Occupied: {editingData.ourInfo.portDetails.filter((p: any) => p.status === 'occupied').length} | 
                            Available: {editingData.ourInfo.portDetails.filter((p: any) => p.status === 'available').length}
                          </div>
                          
                          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded p-2">
                            <table className="w-full text-xs">
                              <thead className="sticky top-0 bg-gray-50">
                                <tr className="border-b">
                                  <th className="p-1 text-left">Port</th>
                                  <th className="p-1 text-left">Status</th>
                                  <th className="p-1 text-left">Customer</th>
                                  <th className="p-1 text-left">Installation Date</th>
                                  <th className="p-1 text-left">Media Type</th>
                                  <th className="p-1 text-left">Order Number</th>
                                  <th className="p-1 text-left">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {editingData.ourInfo.portDetails.map((port: any, index: number) => (
                                  <tr key={port.portNumber} className="border-b hover:bg-gray-50">
                                    <td className="p-1 font-medium">{port.portNumber}</td>
                                    <td className="p-1">
                                      {portEditLocked ? (
                                        <span className={`text-xs px-1 py-0.5 rounded ${
                                          port.status === 'occupied' ? 'bg-red-100 text-red-700' :
                                          port.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-green-100 text-green-700'
                                        }`}>
                                          {port.status === 'occupied' ? 'Occupied' :
                                           port.status === 'reserved' ? 'Reserved' :
                                           'Available'}
                                        </span>
                                      ) : (
                                        <select
                                          value={port.status || 'available'}
                                          onChange={(e) => {
                                            const newPorts = [...editingData.ourInfo.portDetails]
                                            newPorts[index].status = e.target.value as 'available' | 'occupied' | 'reserved'
                                            handleFieldChange('ourInfo.portDetails', newPorts)
                                          }}
                                          className="w-full text-xs p-1 rounded border border-gray-300 focus:border-blue-500"
                                        >
                                          <option value="available">Available</option>
                                          <option value="occupied">Occupied</option>
                                          <option value="reserved">Reserved</option>
                                        </select>
                                      )}
                                    </td>
                                    <td className="p-1">
                                      {(port.status === 'occupied' || port.status === 'reserved') ? (
                                        portEditLocked ? (
                                          <span className="text-xs text-gray-700">{port.zSideCustomer || '-'}</span>
                                        ) : (
                                          <input
                                            type="text"
                                            value={port.zSideCustomer || ''}
                                            onChange={(e) => {
                                              const newPorts = [...editingData.ourInfo.portDetails]
                                              newPorts[index].zSideCustomer = e.target.value
                                              handleFieldChange('ourInfo.portDetails', newPorts)
                                            }}
                                            className="w-48 text-xs p-1 rounded border border-gray-300 focus:border-blue-500"
                                            placeholder="Customer Name"
                                          />
                                        )
                                      ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="p-1">
                                      {(port.status === 'occupied' || port.status === 'reserved') ? (
                                        portEditLocked ? (
                                          <span className="text-xs text-gray-600">{port.installationDate || '-'}</span>
                                        ) : (
                                          <input
                                            type="text"
                                            value={port.installationDate || ''}
                                            onChange={(e) => {
                                              const newPorts = [...editingData.ourInfo.portDetails]
                                              newPorts[index].installationDate = e.target.value
                                              handleFieldChange('ourInfo.portDetails', newPorts)
                                            }}
                                            className="w-24 text-xs p-1 rounded border border-gray-300 focus:border-blue-500"
                                            placeholder="DD-MMM-YY"
                                          />
                                        )
                                      ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="p-1">
                                      {(port.status === 'occupied' || port.status === 'reserved') ? (
                                        portEditLocked ? (
                                          <span className="text-xs text-gray-600">{port.mediaType || '-'}</span>
                                        ) : (
                                          <select
                                            value={port.mediaType || 'Fiber'}
                                            onChange={(e) => {
                                              const newPorts = [...editingData.ourInfo.portDetails]
                                              newPorts[index].mediaType = e.target.value
                                              handleFieldChange('ourInfo.portDetails', newPorts)
                                            }}
                                            className="w-20 text-xs p-1 rounded border border-gray-300 focus:border-blue-500"
                                          >
                                            <option value="Fiber">Fiber</option>
                                            <option value="Copper">Copper</option>
                                            <option value="DAC">DAC</option>
                                          </select>
                                        )
                                      ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="p-1">
                                      {(port.status === 'occupied' || port.status === 'reserved') ? (
                                        portEditLocked ? (
                                          <span className="text-xs text-gray-600">{port.orderNumber || '-'}</span>
                                        ) : (
                                          <input
                                            type="text"
                                            value={port.orderNumber || ''}
                                            onChange={(e) => {
                                              const newPorts = [...editingData.ourInfo.portDetails]
                                              newPorts[index].orderNumber = e.target.value
                                              handleFieldChange('ourInfo.portDetails', newPorts)
                                            }}
                                            className="w-28 text-xs p-1 rounded border border-gray-300 focus:border-blue-500"
                                            placeholder="Order Number"
                                          />
                                        )
                                      ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="p-1">
                                      {(port.status === 'occupied' || port.status === 'reserved') && !portEditLocked && (
                                        <button
                                          onClick={() => {
                                            const confirmMessage = `⚠️ WARNING: This will clear ALL data from Port ${port.portNumber}\n\n` +
                                              `The following information will be permanently deleted:\n` +
                                              `• Customer: ${port.zSideCustomer || 'N/A'}\n` +
                                              `• Installation Date: ${port.installationDate || 'N/A'}\n` +
                                              `• Media Type: ${port.mediaType || 'N/A'}\n` +
                                              `• Order Number: ${port.orderNumber || 'N/A'}\n\n` +
                                              `Are you absolutely sure you want to clear this port?`;
                                            
                                            if (confirm(confirmMessage)) {
                                              const newPorts = [...editingData.ourInfo.portDetails]
                                              newPorts[index] = {
                                                portNumber: port.portNumber,
                                                status: 'available'
                                              }
                                              handleFieldChange('ourInfo.portDetails', newPorts)
                                            }
                                          }}
                                          className="px-2 py-1 text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded text-xs font-medium transition-colors"
                                        >
                                          Clear Port
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const maxPorts = parseInt(prompt('Enter total number of ports:', '24') || '24')
                                const newPorts = []
                                for (let i = 1; i <= maxPorts; i++) {
                                  const existing = editingData.ourInfo.portDetails?.find((p: any) => p.portNumber === i)
                                  newPorts.push(existing || { portNumber: i, status: 'available' })
                                }
                                handleFieldChange('ourInfo.portDetails', newPorts)
                                handleFieldChange('ourInfo.maxPorts', maxPorts)
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Set Port Count
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <p>No port configuration found.</p>
                          <button
                            onClick={() => {
                              const maxPorts = parseInt(prompt('Enter total number of ports:', '24') || '24')
                              const newPorts = []
                              for (let i = 1; i <= maxPorts; i++) {
                                newPorts.push({ portNumber: i, status: 'available' })
                              }
                              handleFieldChange('ourInfo.portDetails', newPorts)
                              handleFieldChange('ourInfo.maxPorts', maxPorts)
                            }}
                            className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Initialize Port Configuration
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleUpdate}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        ✓ Update
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{dc.displayName}</h3>
                        <p className="text-sm text-gray-600">{dc.address}</p>
                      
                      {/* Datacenter Info */}
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">📍 Datacenter Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="font-medium text-gray-600">Facility Name:</span> <span className="text-gray-800">{dc.displayName}</span></div>
                          <div><span className="font-medium text-gray-600">Facility ID:</span> <span className="text-gray-800">{dc.facilityId || 'N/A'}</span></div>
                        </div>
                      </div>
                      
                      {/* Our Equipment Info */}
                      <div className="mt-3 p-3 bg-green-50 rounded">
                        <h4 className="text-xs font-semibold text-green-700 mb-2">🔧 Our Equipment Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="font-medium text-gray-600">Customer:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.customer}</span></div>
                          <div><span className="font-medium text-gray-600">Account #:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.accountNumber}</span></div>
                          <div><span className="font-medium text-gray-600">IBX:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.ibx || 'Not configured'}</span></div>
                          {dc.ourInfo.cage && dc.ourInfo.cage.split(':').length > 1 && (
                            <div><span className="font-medium text-gray-600">Floor:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.cage.split(':')[1]}</span></div>
                          )}
                          <div><span className="font-medium text-gray-600">Cage ID:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.cage || 'Not configured'}</span></div>
                          <div><span className="font-medium text-gray-600">Cabinet ID:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.cabinet || 'Not configured'}</span></div>
                          <div><span className="font-medium text-gray-600">Patch Panel:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.patchPanel || 'Not configured'}</span></div>
                          <div><span className="font-medium text-gray-600">Default Port:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.defaultPort || 'Not configured'}</span></div>
                          {dc.ourInfo.room && (
                            <div><span className="font-medium text-gray-600">Room:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.room}</span></div>
                          )}
                          {dc.ourInfo.dedicatedMediaType && (
                            <div><span className="font-medium text-gray-600">Media Type:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.dedicatedMediaType}</span></div>
                          )}
                          {dc.ourInfo.panelType && (
                            <div><span className="font-medium text-gray-600">Panel Type:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.panelType}</span></div>
                          )}
                          {dc.ourInfo.rackLocation && (
                            <div><span className="font-medium text-gray-600">Rack Location:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.rackLocation}</span></div>
                          )}
                          {dc.ourInfo.provisioningType && (
                            <div><span className="font-medium text-gray-600">Provisioning:</span> <span className="text-gray-800 font-medium">{dc.ourInfo.provisioningType}</span></div>
                          )}
                          {dc.ourInfo.circuitAvailable !== undefined && (
                            <div><span className="font-medium text-gray-600">Circuit Available:</span> <span className={`font-medium ${dc.ourInfo.circuitAvailable ? 'text-green-700' : 'text-red-700'}`}>{dc.ourInfo.circuitAvailable ? 'Yes' : 'No'}</span></div>
                          )}
                          {dc.ourInfo.preWired !== undefined && (
                            <div><span className="font-medium text-gray-600">Pre-Wired:</span> <span className={`font-medium ${dc.ourInfo.preWired ? 'text-green-700' : 'text-gray-700'}`}>{dc.ourInfo.preWired ? 'Yes' : 'No'}</span></div>
                          )}
                          {dc.ourInfo.lastApiSync && (
                            <div className="col-span-2 pt-2 border-t border-green-200">
                              <span className="font-medium text-gray-600">Last API Sync:</span> 
                              <span className="text-gray-800 text-xs ml-2">{new Date(dc.ourInfo.lastApiSync).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Technical Defaults if available */}
                      {dc.technicalDefaults && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <h4 className="text-xs font-semibold text-blue-700 mb-2">⚡ Technical Defaults</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="font-medium text-gray-600">Connection:</span> <span className="text-gray-800">{dc.technicalDefaults.connectionType}</span></div>
                            <div><span className="font-medium text-gray-600">Connector:</span> <span className="text-gray-800">{dc.technicalDefaults.connectorType}</span></div>
                            <div><span className="font-medium text-gray-600">Speed:</span> <span className="text-gray-800">{dc.technicalDefaults.speed}</span></div>
                            <div><span className="font-medium text-gray-600">Media:</span> <span className="text-gray-800">{dc.technicalDefaults.mediaType}</span></div>
                          </div>
                        </div>
                      )}
                      
                      {(!dc.ourInfo.cabinet && !dc.ourInfo.cage && !dc.ourInfo.patchPanel) && (
                        <div className="mt-3 text-xs text-orange-600 font-medium">
                          ⚠️ No equipment information configured - Please edit to add details
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(dc)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      {dc.id === 'equinix-zh2' && dc.ourInfo.patchPanel && (
                        <button
                          onClick={() => handleSyncDatacenter(dc.id, dc.ourInfo.patchPanel)}
                          disabled={syncingDatacenterId === dc.id}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                          title="Sync with Equinix API"
                        >
                          {syncingDatacenterId === dc.id ? '⌛ Syncing...' : '🔄 Equinix Sync'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveDatacenter(dc.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Remove this datacenter"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                    {/* Patch Panel Port Status - Full Width */}
                    {dc.ourInfo.portDetails && dc.ourInfo.portDetails.length > 0 && (
                      <div className="mt-3 p-3 bg-orange-50 rounded">
                        <h4 className="text-xs font-semibold text-orange-700 mb-2">
                          🔌 Patch Panel Port Status - {dc.ourInfo.patchPanel || 'Panel'}
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            const occupied = dc.ourInfo.portDetails.filter(p => p.status === 'occupied').length;
                            const available = dc.ourInfo.portDetails.filter(p => p.status === 'available').length;
                            const total = dc.ourInfo.portDetails.length;
                            return (
                              <div className="text-xs">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">
                                    Total: {total} ports | Occupied: <span className="text-red-600">{occupied}</span> | Available: <span className="text-green-600">{available}</span>
                                  </span>
                                  <span className="text-gray-600">
                                    {Math.round((occupied / total) * 100)}% utilized
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {dc.ourInfo.portDetails.map(port => (
                                    <div 
                                      key={port.portNumber}
                                      className={`p-3 text-center rounded text-xs font-medium ${
                                        port.status === 'occupied' ? 'bg-red-100 text-red-700' : 
                                        port.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' : 
                                        'bg-green-100 text-green-700'
                                      }`}
                                      title={port.status === 'occupied' ? `Port ${port.portNumber}: ${port.zSideCustomer}` : `Port ${port.portNumber}: ${port.status}`}
                                    >
                                      <div className="font-bold text-sm">Port {port.portNumber}</div>
                                      <div className="text-xs mt-1">
                                        {port.status === 'occupied' && port.zSideCustomer ? 
                                          port.zSideCustomer : 
                                          port.status === 'available' ? 'Available' : 
                                          'Reserved'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                  <div className="font-medium">Recent connections:</div>
                                  {dc.ourInfo.portDetails
                                    .filter(p => p.status === 'occupied' && p.installationDate)
                                    .sort((a, b) => {
                                      // Convert date format DD-MMM-YY to sortable format
                                      const parseDate = (dateStr: string) => {
                                        const months: {[key: string]: number} = {
                                          'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
                                          'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
                                        };
                                        const parts = dateStr.split('-');
                                        if (parts.length === 3) {
                                          const day = parseInt(parts[0]);
                                          const month = months[parts[1]];
                                          const year = 2000 + parseInt(parts[2]);
                                          return new Date(year, month, day).getTime();
                                        }
                                        return 0;
                                      };
                                      return parseDate(b.installationDate || '') - parseDate(a.installationDate || '');
                                    })
                                    .slice(0, 3)
                                    .map(port => (
                                      <div key={port.portNumber} className="text-xs">
                                        Port {port.portNumber}: {port.zSideCustomer} ({port.installationDate})
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}