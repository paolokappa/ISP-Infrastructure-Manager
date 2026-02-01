'use client'

import React, { useState, useEffect } from 'react'

interface PortInfo {
  portNumber: number;
  status: 'available' | 'occupied' | 'reserved';
  mediaType?: string;
  speed?: string;
  connectorType?: string;
}

interface PatchPanelData {
  patchPanelId: string;
  ibx: string;
  cabinetId: string;
  accountName: string;
  availablePorts: number[];
  ports?: PortInfo[];
  lastUpdated?: string;
}

interface EquinixPatchPanelSyncProps {
  datacenterId?: string;
  patchPanelId?: string;
  cabinetId?: string;
  accountNumber?: string;
  onDataUpdate?: (data: PatchPanelData) => void;
}

export default function EquinixPatchPanelSync({ 
  datacenterId = 'equinix-zh2',
  patchPanelId = 'PP:0201:0102:1374601',
  cabinetId = 'ZH2:03:0ROOM2:0201:0102',
  accountNumber = '715400',
  onDataUpdate
}: EquinixPatchPanelSyncProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [patchPanelData, setPatchPanelData] = useState<PatchPanelData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const syncPatchPanel = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/equinix?action=sync&patchPanelId=${patchPanelId}`)
      const result = await response.json()
      
      if (result.success) {
        setPatchPanelData(result.data)
        setLastSync(new Date())
        if (onDataUpdate) {
          onDataUpdate(result.data)
        }
      } else {
        setError(result.error || 'Failed to sync patch panel')
      }
    } catch (err) {
      setError('Network error: Unable to sync with Equinix API')
      console.error('Sync error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateDatabase = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/equinix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patchPanelId,
          updateDatabase: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setPatchPanelData(result.data)
        setLastSync(new Date())
        setError(null)
        // Show success message
        setTimeout(() => {
          window.location.reload() // Reload to show updated data
        }, 2000)
      } else {
        setError(result.error || 'Failed to update database')
      }
    } catch (err) {
      setError('Network error: Unable to update database')
      console.error('Update error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial sync on component mount
    syncPatchPanel()
  }, [])

  useEffect(() => {
    // Auto-refresh every 5 minutes if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        syncPatchPanel()
      }, 5 * 60 * 1000) // 5 minutes
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getPortStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'occupied':
        return 'bg-red-100 text-red-800'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Equinix Patch Panel Status
          </h3>
          {patchPanelData && (
            <p className="text-sm text-gray-600">
              {patchPanelData.patchPanelId} • {patchPanelData.ibx}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-sm rounded-md ${
              autoRefresh 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
          </button>
          
          <button
            onClick={syncPatchPanel}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Syncing...
              </>
            ) : (
              <>
                🔄 Sync Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Last Sync Info */}
      {lastSync && (
        <div className="mb-4 text-sm text-gray-600">
          Last synced: {lastSync.toLocaleString()}
        </div>
      )}

      {/* Patch Panel Data */}
      {patchPanelData && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">Account</p>
              <p className="font-semibold">{patchPanelData.accountName}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">Cabinet</p>
              <p className="font-semibold text-sm">{patchPanelData.cabinetId}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">Available Ports</p>
              <p className="font-semibold text-green-600">
                {patchPanelData.availablePorts.length}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">Total Ports</p>
              <p className="font-semibold">
                {patchPanelData.ports?.length || 12}
              </p>
            </div>
          </div>

          {/* Port Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {showDetails ? '▼ Hide' : '▶ Show'} Port Details
          </button>

          {/* Port Grid */}
          {showDetails && patchPanelData.ports && (
            <div className="grid grid-cols-6 gap-2 mb-4">
              {patchPanelData.ports.map((port) => (
                <div
                  key={port.portNumber}
                  className={`p-2 rounded-md text-center ${getPortStatusColor(port.status)}`}
                  title={`Port ${port.portNumber}: ${port.status}`}
                >
                  <div className="font-semibold">{port.portNumber}</div>
                  <div className="text-xs">{port.status}</div>
                </div>
              ))}
            </div>
          )}

          {/* Available Ports List */}
          {patchPanelData.availablePorts.length > 0 && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm font-semibold text-green-800 mb-1">
                Available Ports:
              </p>
              <p className="text-sm text-green-700">
                {patchPanelData.availablePorts.join(', ')}
              </p>
            </div>
          )}

          {/* Update Database Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={updateDatabase}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : '💾 Update Local Database'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              This will update the static database with the latest Equinix data
            </p>
          </div>
        </>
      )}

      {/* Loading State */}
      {isLoading && !patchPanelData && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin text-2xl">⏳</div>
          <p className="ml-2 text-gray-600">Loading patch panel data...</p>
        </div>
      )}
    </div>
  )
}