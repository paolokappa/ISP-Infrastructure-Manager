# ISP Infrastructure Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-13.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb)](https://reactjs.org/)

A comprehensive, enterprise-grade infrastructure management platform designed specifically for Internet Service Providers (ISPs), telecommunications companies, and data center operators. This powerful web application streamlines cross-connect operations, automates Letter of Authorization (LoA) generation, and provides intelligent port management capabilities.

## 🎯 Overview

The ISP Infrastructure Manager revolutionizes how network operators handle their data center infrastructure by providing a unified platform that combines document generation, port visualization, and third-party API integrations into a seamless workflow. Built with modern web technologies and security-first principles, it scales from small ISPs to large telecommunications enterprises.

## ✨ Key Features

### 📄 **Professional LoA Generation**
- **Dynamic PDF Creation**: Generate industry-standard Letters of Authorization in seconds
- **Smart Template Engine**: Customizable templates with automatic data population
- **Multi-Format Support**: Export to PDF with professional formatting and branding
- **Batch Processing**: Generate multiple LoAs simultaneously for bulk operations
- **Version Control**: Track document revisions and maintain audit trails
- **Digital Signatures**: Support for electronic signature workflows
- **QR Code Integration**: Embed verification QR codes for document authenticity

### 🔌 **Visual Port Management System**
- **Interactive Patch Panel Visualization**: Real-time graphical representation of port status
- **Drag-and-Drop Interface**: Intuitive port assignment and management
- **Port Status Tracking**: Monitor availability, reservations, and active connections
- **Capacity Planning**: Visual heat maps showing utilization trends
- **Port History**: Complete audit trail of port assignments and changes
- **Media Type Management**: Track fiber types, connector specifications, and speeds
- **Smart Search**: Find available ports based on multiple criteria

### 🌐 **Third-Party Integrations**

#### **PeeringDB Integration**
- Real-time facility and network operator data
- Automatic ASN validation and company information retrieval
- Peering location discovery
- Network presence verification at facilities
- Contact information synchronization

#### **Equinix API Integration** (Optional)
- Direct synchronization with Equinix portal
- Automatic port availability updates
- Cross-connect order status tracking
- IBX facility information retrieval
- Cabinet and cage management
- Real-time pricing information

#### **WHOIS Lookup Service**
- Automatic company information retrieval
- AS number validation
- Network block verification
- Technical contact discovery
- Abuse contact identification

### 🏢 **Multi-Datacenter Support**
- **Centralized Management**: Control multiple facilities from a single dashboard
- **Location-Specific Configurations**: Custom settings per datacenter
- **Cross-Facility Reporting**: Unified analytics across all locations
- **Hierarchical Organization**: Support for regions, zones, and facilities
- **Custom Metadata**: Flexible tagging and categorization system
- **Bulk Operations**: Manage multiple datacenters simultaneously

### 🔐 **Security & Compliance**
- **SSL/TLS Encryption**: Secure all communications with HTTPS
- **Role-Based Access Control**: Granular permission management
- **API Key Management**: Secure storage and rotation of credentials
- **Audit Logging**: Comprehensive activity tracking
- **GDPR Compliance**: Built-in data privacy controls
- **Session Management**: Secure session handling with timeouts
- **Environment Variable Protection**: Sensitive data isolation

### 📊 **Advanced Features**
- **Real-Time Notifications**: WebSocket-based status updates
- **Advanced Search**: Full-text search across all resources
- **Custom Workflows**: Configurable approval processes
- **Reporting Engine**: Generate operational and financial reports
- **API Documentation**: Interactive API explorer for integrations
- **Mobile Responsive**: Fully functional on tablets and smartphones
- **Dark Mode**: Eye-friendly interface for 24/7 operations

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **NPM**: Version 9.0.0 or higher
- **Operating System**: Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+, CentOS 8+)
- **SSL Certificates**: Self-signed or CA-signed certificates
- **Memory**: Minimum 2GB RAM
- **Storage**: 10GB free disk space

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/isp-infrastructure-manager.git
cd isp-infrastructure-manager

# Navigate to the application directory
cd loa-generator

# Install dependencies
npm install

# Configure the application
cp config/company-settings.example.json config/company-settings.json
cp .env.example .env

# Edit configuration files with your details
nano config/company-settings.json
nano .env

# Generate SSL certificates (for development)
mkdir certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes

# Build the application
npm run build

# Start the production server
npm run start
```

The application will be available at `https://localhost:8888`

## 🔧 Configuration

### Company Settings Configuration

```json
{
  "company": {
    "name": "Your Company Name",
    "legalName": "Your Company Legal Name",
    "vatNumber": "VAT-123456",
    "address": "123 Main Street",
    "city": "Your City",
    "postalCode": "12345",
    "country": "Your Country",
    "asNumber": "AS12345",
    "logoUrl": "/assets/logo.png"
  },
  "loaTemplate": {
    "authorizedSignatory": "John Doe",
    "signatoryTitle": "Network Manager",
    "defaultValidityDays": 365,
    "templateVersion": "2.0"
  },
  "api": {
    "equinixEnabled": false,
    "peeringDbEnabled": true,
    "whoisEnabled": true
  }
}
```

### Environment Variables

```bash
# Application Settings
NODE_ENV=production
PORT=8888
NEXT_TELEMETRY_DISABLED=1

# Optional API Integrations
EQUINIX_CLIENT_ID=your_client_id
EQUINIX_CLIENT_SECRET=your_client_secret
PEERINGDB_API_KEY=your_api_key
```

## 📦 Architecture

### Technology Stack

- **Frontend**: React 18.x with Next.js 13.5 App Router
- **Styling**: Tailwind CSS with custom animations
- **PDF Generation**: @react-pdf/renderer
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors
- **TypeScript**: Full type safety and IntelliSense

### Project Structure

```
isp-infrastructure-manager/
├── app/                    # Next.js app directory
│   ├── components/        # Reusable React components
│   │   ├── LoaForm.tsx   # LoA generation form
│   │   ├── PortManager.tsx # Port visualization
│   │   └── ...
│   ├── lib/              # Core libraries and utilities
│   │   ├── pdf-template.tsx # PDF generation logic
│   │   ├── equinix-api.ts  # Equinix integration
│   │   ├── peeringdb.ts    # PeeringDB integration
│   │   └── whois.ts        # WHOIS lookup service
│   ├── api/              # API routes
│   │   ├── settings/     # Settings management
│   │   ├── loa/          # LoA generation endpoints
│   │   └── ports/        # Port management APIs
│   └── (routes)/         # Page components
├── config/               # Configuration files
│   ├── company-settings.json
│   └── datacenter-db.ts
├── public/              # Static assets
├── styles/              # Global styles
└── certs/               # SSL certificates
```

## 🛠️ Development

### Development Mode

```bash
# Run with hot-reload
npm run dev

# Run with debugging
npm run debug

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm run start

# Or use PM2 for process management
pm2 start npm --name "isp-manager" -- run start
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 🔌 API Documentation

### RESTful API Endpoints

#### LoA Generation
```http
POST /api/loa/generate
Content-Type: application/json

{
  "datacenter": "DC1",
  "requesterCompany": "Customer Corp",
  "portNumber": "PP-01",
  "connectionType": "single-mode",
  "speed": "10G"
}
```

#### Port Management
```http
GET /api/ports/{datacenter}
GET /api/ports/{datacenter}/{port_id}
PUT /api/ports/{datacenter}/{port_id}/status
POST /api/ports/{datacenter}/reserve
```

#### Settings Management
```http
GET /api/settings
PUT /api/settings
POST /api/settings/logo
```

## 🚢 Deployment

### Production Deployment with Systemd

```bash
# Create systemd service
sudo nano /etc/systemd/system/isp-infrastructure-manager.service

# Enable and start service
sudo systemctl enable isp-infrastructure-manager
sudo systemctl start isp-infrastructure-manager

# Check status
sudo systemctl status isp-infrastructure-manager
```

### Docker Deployment

```bash
# Build Docker image
docker build -t isp-manager .

# Run container
docker run -d \
  -p 8888:8888 \
  -v /path/to/config:/app/config \
  -v /path/to/certs:/app/certs \
  --name isp-manager \
  isp-manager
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: isp-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: isp-manager
  template:
    metadata:
      labels:
        app: isp-manager
    spec:
      containers:
      - name: isp-manager
        image: isp-manager:latest
        ports:
        - containerPort: 8888
```

## 🔒 Security Best Practices

1. **Always use HTTPS** in production environments
2. **Rotate API keys** regularly
3. **Enable firewall rules** to restrict access
4. **Use environment variables** for sensitive configuration
5. **Implement rate limiting** for API endpoints
6. **Regular security audits** and dependency updates
7. **Enable CORS** only for trusted domains
8. **Implement CSP headers** for XSS protection

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Submitting pull requests
- Reporting issues
- Feature requests

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/isp-infrastructure-manager.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a pull request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Q1 2024
- [ ] Multi-language support (i18n)
- [ ] Advanced reporting dashboard
- [ ] Webhook integrations
- [ ] Mobile applications (iOS/Android)

### Q2 2024
- [ ] AI-powered capacity planning
- [ ] Blockchain-based LoA verification
- [ ] GraphQL API support
- [ ] Real-time collaboration features

### Q3 2024
- [ ] Machine learning for anomaly detection
- [ ] Advanced automation workflows
- [ ] Plugin architecture
- [ ] White-label support

## 💬 Support

- **Documentation**: [https://docs.example.com](https://docs.example.com)
- **Issue Tracker**: [GitHub Issues](https://github.com/yourusername/isp-infrastructure-manager/issues)
- **Community Forum**: [https://forum.example.com](https://forum.example.com)
- **Email Support**: support@example.com

## 🙏 Acknowledgments

- Built with ❤️ for the ISP and datacenter community
- Special thanks to all contributors and early adopters
- Powered by open-source technologies

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/isp-infrastructure-manager)
![GitHub forks](https://img.shields.io/github/forks/yourusername/isp-infrastructure-manager)
![GitHub issues](https://img.shields.io/github/issues/yourusername/isp-infrastructure-manager)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/isp-infrastructure-manager)

---

**ISP Infrastructure Manager** - Enterprise-grade infrastructure management for the modern ISP

*Copyright © 2026 ISP Infrastructure Manager Contributors. All rights reserved.*