'use client';

import { useState, useEffect, useRef } from 'react';
import { CompanySettings } from '@/config/company-settings';
import { Save, RefreshCw, Download, Upload, Settings, Building2, FileText, Key, ToggleLeft, ChevronRight, Check, X } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'company' | 'loa' | 'apis' | 'features'>('company');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
      if (data.company.logoUrl) {
        setLogoPreview(data.company.logoUrl);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        const response = await fetch('/api/settings', {
          method: 'PUT',
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
          setLogoPreview(data.settings.company.logoUrl || null);
          setMessage({ type: 'success', text: 'Settings reset to defaults' });
        } else {
          throw new Error('Failed to reset settings');
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to reset settings' });
      }
    }
  };

  const handleExport = () => {
    if (!settings) return;
    
    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Settings exported successfully' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (!imported.company || !imported.apis || !imported.loaTemplate) {
            throw new Error('Invalid settings file structure');
          }
          setSettings(imported);
          if (imported.company.logoUrl) {
            setLogoPreview(imported.company.logoUrl);
          }
          setMessage({ type: 'success', text: 'Settings imported successfully' });
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to import settings. Invalid file format.' });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setLogoPreview(dataUrl);
        setSettings(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            company: {
              ...prev.company,
              logoUrl: dataUrl
            }
          };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateNestedSetting = (category: keyof CompanySettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...(prev[category] as any),
          [field]: value
        }
      };
    });
  };

  const updateApiSetting = (api: 'equinix' | 'peeringDb' | 'whois', field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        apis: {
          ...prev.apis,
          [api]: {
            ...(prev.apis[api] as any),
            [field]: value
          }
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load settings</div>
      </div>
    );
  }

  const tabIcons = {
    company: <Building2 className="w-4 h-4" />,
    loa: <FileText className="w-4 h-4" />,
    apis: <Key className="w-4 h-4" />,
    features: <ToggleLeft className="w-4 h-4" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Animated gradient background overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ top: '64px' }}>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-700/20 to-transparent animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative z-10 pt-8 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-white/10 backdrop-blur-sm">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                System Settings
              </span>
            </h1>
            <p className="text-xl text-cyan-200">Configure your ISP Infrastructure Manager</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm animate-slideIn ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                : 'bg-red-500/20 text-red-100 border border-red-400/30'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {message.text}
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {/* Tab Navigation */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              {Object.entries(tabIcons).map(([key, icon]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                    activeTab === key 
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {icon}
                  <span>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'company' && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    Company Information
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={settings.company.name}
                        onChange={(e) => updateNestedSetting('company', 'name', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Legal Name
                      </label>
                      <input
                        type="text"
                        value={settings.company.legalName}
                        onChange={(e) => updateNestedSetting('company', 'legalName', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        VAT Number
                      </label>
                      <input
                        type="text"
                        value={settings.company.vatNumber}
                        onChange={(e) => updateNestedSetting('company', 'vatNumber', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        AS Number
                      </label>
                      <input
                        type="text"
                        value={settings.company.asNumber || ''}
                        onChange={(e) => updateNestedSetting('company', 'asNumber', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      value={settings.company.address}
                      onChange={(e) => updateNestedSetting('company', 'address', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        value={settings.company.city}
                        onChange={(e) => updateNestedSetting('company', 'city', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={settings.company.postalCode}
                        onChange={(e) => updateNestedSetting('company', 'postalCode', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        value={settings.company.country}
                        onChange={(e) => updateNestedSetting('company', 'country', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={settings.company.phone}
                        onChange={(e) => updateNestedSetting('company', 'phone', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.company.email}
                        onChange={(e) => updateNestedSetting('company', 'email', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Website
                      </label>
                      <input
                        type="url"
                        value={settings.company.website}
                        onChange={(e) => updateNestedSetting('company', 'website', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Logo</h3>
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-48 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-gray-400">No logo uploaded</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </button>
                        <p className="mt-2 text-sm text-gray-600">
                          Recommended size: 500x200px, PNG or JPG format
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'loa' && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    LoA Template Settings
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Authorized Signatory
                      </label>
                      <input
                        type="text"
                        value={settings.loaTemplate.authorizedSignatory}
                        onChange={(e) => updateNestedSetting('loaTemplate', 'authorizedSignatory', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Signatory Title
                      </label>
                      <input
                        type="text"
                        value={settings.loaTemplate.signatoryTitle}
                        onChange={(e) => updateNestedSetting('loaTemplate', 'signatoryTitle', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Signatory Email
                      </label>
                      <input
                        type="email"
                        value={settings.loaTemplate.signatoryEmail}
                        onChange={(e) => updateNestedSetting('loaTemplate', 'signatoryEmail', e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        Default Validity (days)
                      </label>
                      <input
                        type="number"
                        value={settings.loaTemplate.defaultValidityDays}
                        onChange={(e) => updateNestedSetting('loaTemplate', 'defaultValidityDays', parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      Custom Footer Text
                    </label>
                    <textarea
                      value={settings.loaTemplate.customFooterText || ''}
                      onChange={(e) => updateNestedSetting('loaTemplate', 'customFooterText', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.loaTemplate.includeVatNumber}
                        onChange={(e) => updateNestedSetting('loaTemplate', 'includeVatNumber', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Include VAT Number in LoA</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.loaTemplate.includeAsNumber}
                        onChange={(e) => updateNestedSetting('loaTemplate', 'includeAsNumber', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Include AS Number in LoA</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'apis' && (
                <div className="space-y-8 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Key className="w-6 h-6 text-blue-600" />
                    API Configuration
                  </h2>

                  {/* Equinix API */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Equinix API</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.apis.equinix.enabled}
                          onChange={(e) => updateApiSetting('equinix', 'enabled', e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enabled</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Client ID</label>
                        <input
                          type="text"
                          value={settings.apis.equinix.clientId}
                          onChange={(e) => updateApiSetting('equinix', 'clientId', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Client Secret</label>
                        <input
                          type="password"
                          value={settings.apis.equinix.clientSecret}
                          onChange={(e) => updateApiSetting('equinix', 'clientSecret', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">API URL</label>
                      <input
                        type="url"
                        value={settings.apis.equinix.apiUrl}
                        onChange={(e) => updateApiSetting('equinix', 'apiUrl', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* PeeringDB API */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">PeeringDB API</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.apis.peeringDb.enabled}
                          onChange={(e) => updateApiSetting('peeringDb', 'enabled', e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enabled</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">API Key (Optional)</label>
                        <input
                          type="text"
                          value={settings.apis.peeringDb.apiKey || ''}
                          onChange={(e) => updateApiSetting('peeringDb', 'apiKey', e.target.value)}
                          placeholder="Optional - for authenticated requests"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">API URL</label>
                        <input
                          type="url"
                          value={settings.apis.peeringDb.apiUrl}
                          onChange={(e) => updateApiSetting('peeringDb', 'apiUrl', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WHOIS */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">WHOIS</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.apis.whois.enabled}
                          onChange={(e) => updateApiSetting('whois', 'enabled', e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Enabled</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Default Server</label>
                      <input
                        type="text"
                        value={settings.apis.whois.defaultServer}
                        onChange={(e) => updateApiSetting('whois', 'defaultServer', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <ToggleLeft className="w-6 h-6 text-blue-600" />
                    Feature Flags
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Auto WHOIS Lookup</span>
                          <p className="text-sm text-gray-600">Automatically lookup AS information</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.features.autoWhoisLookup}
                        onChange={(e) => updateNestedSetting('features', 'autoWhoisLookup', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Equinix Sync</span>
                          <p className="text-sm text-gray-600">Enable Equinix API synchronization</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.features.equinixSync}
                        onChange={(e) => updateNestedSetting('features', 'equinixSync', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">PDF Generation</span>
                          <p className="text-sm text-gray-600">Enable LoA PDF generation</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.features.pdfGeneration}
                        onChange={(e) => updateNestedSetting('features', 'pdfGeneration', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Email Notifications</span>
                          <p className="text-sm text-gray-600">Send email notifications for events</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.features.emailNotifications}
                        onChange={(e) => updateNestedSetting('features', 'emailNotifications', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-8 py-6 flex items-center justify-between border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset to Defaults
                </button>
              </div>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}