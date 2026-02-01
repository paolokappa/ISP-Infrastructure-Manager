# ISP Infrastructure Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-13.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb)](https://reactjs.org/)

<div align="center">
  <img src="https://www.peeringdb.com/static/peeringdb.svg" alt="PeeringDB" height="50"/>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://www.equinix.com/content/dam/eqxweb/Images/logos/logo-tagline-red-140.png" alt="Equinix" height="50"/>
</div>

## Professional Infrastructure Management Platform for ISPs

A comprehensive web application designed for Internet Service Providers (ISPs) and data center operators, featuring seamless integration with **PeeringDB** and **Equinix APIs**. Generate professional Letters of Authorization (LoA), manage port configurations, and streamline cross-connect operations with enterprise-grade security.

## 🎯 Overview

ISP Infrastructure Manager revolutionizes datacenter operations by providing a unified platform that automates document generation, visualizes port utilization, and integrates with industry-standard APIs. Built with Next.js 13.5 and TypeScript, it delivers a modern, responsive interface for managing critical infrastructure.

## ✨ Core Features

### 📄 **Professional LoA Generation**
- **Instant PDF Creation**: Generate industry-standard Letters of Authorization in seconds
- **Dynamic Data Population**: Automatically fill forms with company and facility information
- **Customizable Templates**: Configure company branding and signatory information
- **Professional Formatting**: Clean, business-ready PDF output with proper letterhead
- **Validation System**: Built-in form validation to ensure data accuracy
- **Export Functionality**: Download PDFs directly or email to recipients

### 🔌 **Visual Port Management**
- **Interactive Patch Panel View**: Real-time graphical representation of port status
- **Port Status Tracking**: Monitor available, occupied, and reserved ports
- **Port Assignment**: Easily assign and track cross-connect installations
- **Media Type Support**: Track fiber types (OS2, OM3, OM4, OM5) and connector specifications
- **Port History**: Maintain audit trail of assignments and changes
- **Search & Filter**: Find available ports quickly by multiple criteria

### 🌐 **PeeringDB Integration**
- **Real-time Facility Search**: Access the complete PeeringDB database
- **Network Operator Lookup**: Find carriers present at any facility
- **ASN Validation**: Automatic AS number and company verification
- **Facility Information**: Get detailed datacenter specifications
- **Network Presence**: Verify carrier availability at specific locations
- **Contact Discovery**: Access NOC and peering contact information

### 🏢 **Equinix API Integration** 
- **Direct Portal Sync**: Connect with your Equinix customer portal
- **Port Availability**: Real-time synchronization of patch panel status
- **IBX Facility Data**: Access detailed facility information
- **Cabinet Management**: Track cage and cabinet assignments
- **Automated Updates**: Keep local data synchronized with Equinix
- **Order Status**: Track cross-connect order progress

### 🔐 **Security & Configuration**
- **SSL/TLS Encryption**: Secure HTTPS communication
- **Environment Variables**: Protected storage of sensitive credentials
- **JSON Configuration**: Easy-to-manage settings files
- **API Key Management**: Secure handling of third-party credentials
- **Session Security**: Proper session handling and timeouts

### 🏗️ **Multi-Datacenter Support**
- **Centralized Management**: Handle multiple facilities from one interface
- **Custom Configurations**: Datacenter-specific settings and defaults
- **Location Templates**: Pre-configured settings per facility
- **Bulk Operations**: Manage multiple locations simultaneously

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- NPM 9.0.0 or higher
- Linux server (Ubuntu/Debian/RHEL/CentOS)
- SSL certificates (self-signed or CA-signed)

### Installation

```bash
# Clone the repository
git clone https://github.com/paolokappa/ISP-Infrastructure-Manager.git
cd ISP-Infrastructure-Manager

# Navigate to application directory
cd loa-generator

# Install dependencies
npm install

# Configure the application
cp config/company-settings.example.json config/company-settings.json
cp .env.example .env

# Edit configuration with your details
nano config/company-settings.json
nano .env

# Generate SSL certificates (for development)
mkdir certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes

# Build and start
npm run build
npm run start
```

Access the application at `https://localhost:8888`

## 🔧 Configuration

### Company Settings (config/company-settings.json)

```json
{
  "company": {
    "name": "Your Company Name",
    "legalName": "Your Legal Entity Name",
    "vatNumber": "VAT-123456",
    "address": "123 Main Street",
    "city": "Your City",
    "postalCode": "12345",
    "country": "Your Country",
    "asNumber": "AS12345"
  },
  "loaTemplate": {
    "authorizedSignatory": "John Doe",
    "signatoryTitle": "Network Manager",
    "defaultValidityDays": 365
  },
  "api": {
    "equinixEnabled": false,
    "peeringDbEnabled": true,
    "whoisEnabled": true
  }
}
```

### Environment Variables (.env)

```bash
# Application
NODE_ENV=production
PORT=8888

# API Keys (optional)
EQUINIX_CLIENT_ID=your_client_id_here
EQUINIX_CLIENT_SECRET=your_client_secret_here
PEERINGDB_API_KEY=your_api_key_here
```

### Datacenter Configuration

Edit `config/datacenter-db.ts` to add your facilities:

```typescript
{
  id: "dc1",
  name: "Your Datacenter",
  displayName: "DC1",
  address: "123 Data Center Way",
  ourInfo: {
    cabinet: "A01",
    patchPanel: "PP-01",
    maxPorts: 24
  }
}
```

## 📦 Project Structure

```
loa-generator/
├── app/
│   ├── components/      # React components
│   │   ├── LoaForm.tsx  # Main LoA generation form
│   │   └── Navigation.tsx
│   ├── lib/             # Core libraries
│   │   ├── pdf-template.tsx  # PDF generation
│   │   ├── peeringdb.ts     # PeeringDB API client
│   │   ├── equinix-api.ts   # Equinix integration
│   │   └── whois.ts         # WHOIS lookups
│   ├── api/             # API routes
│   └── (pages)/         # Next.js pages
├── config/              # Configuration files
├── public/              # Static assets
└── certs/              # SSL certificates
```

## 🛠️ Development

```bash
# Development mode with hot-reload
npm run dev

# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Production build
npm run build
```

## 🔌 API Endpoints

### LoA Generation
```http
POST /api/loa/generate
Content-Type: application/json

{
  "datacenter": "DC1",
  "requesterCompany": "Customer Corp",
  "portNumber": "1"
}
```

### PeeringDB Search
```http
GET /api/peeringdb/search?q=equinix
```

### Settings Management
```http
GET /api/settings
PUT /api/settings
```

## 🚢 Production Deployment

### Systemd Service

Create `/etc/systemd/system/isp-infrastructure-manager.service`:

```ini
[Unit]
Description=ISP Infrastructure Manager
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/loa-generator
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable isp-infrastructure-manager
sudo systemctl start isp-infrastructure-manager
```

### Process Manager (PM2)

```bash
pm2 start npm --name "isp-manager" -- run start
pm2 save
pm2 startup
```

## 🔒 Security Considerations

- Always use HTTPS in production
- Store API credentials in environment variables
- Regularly update dependencies
- Implement proper firewall rules
- Use strong SSL certificates
- Enable rate limiting for API endpoints
- Regular security audits

## 📋 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 10GB
- **OS**: Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+)

### Network Ports
- `8888`: HTTPS application access
- `443`: Outbound HTTPS for API calls

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Integrates with industry-standard APIs
- Designed for the ISP and datacenter community

## 📊 Technology Stack

- **Frontend**: React 18.x + Next.js 13.5
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS
- **PDF**: @react-pdf/renderer
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios
- **Node**: 18.x LTS

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/paolokappa/ISP-Infrastructure-Manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/paolokappa/ISP-Infrastructure-Manager/discussions)

---

## 👨‍💻 Credits

**Developed by [Paolo Caparrelli](https://github.com/paolokappa) - [GOLINE SA](https://www.goline.ch)**

*Copyright © 2026 Paolo Caparrelli / GOLINE SA. Released under MIT License.*