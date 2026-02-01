import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { LoaFormData } from './schemas'
import { v4 as uuidv4 } from 'uuid'
import { CompanySettings } from '@/config/company-settings'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // Professional header with company info
  professionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '1px solid #ccc',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 200,
    alignItems: 'flex-end',
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 9,
    color: '#333',
    lineHeight: 1.3,
  },
  companyContact: {
    fontSize: 8,
    color: '#666',
    marginTop: 3,
  },
  // Recipient section
  recipientSection: {
    marginBottom: 20,
  },
  recipientTitle: {
    fontSize: 10,
    color: '#333',
    marginBottom: 3,
  },
  // Document metadata
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Main title
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 5,
    fontFamily: 'Helvetica-Bold',
  },
  // Body content
  bodyText: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 10,
    textAlign: 'justify',
  },
  // Sections
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  // Info rows
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 120,
    fontSize: 9,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: '#000',
  },
  // Special formatting
  highlightBox: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginVertical: 10,
    borderLeft: '3px solid #0066cc',
  },
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTop: '1px solid #ccc',
  },
  signature: {
    marginTop: 20,
    marginBottom: 5,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 9,
    color: '#666',
  },
  // Note text
  noteText: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 1.3,
  }
})

interface PdfTemplateProps {
  data: LoaFormData
  settings?: CompanySettings
}

export const PdfTemplate: React.FC<PdfTemplateProps> = ({ data, settings }) => {
  if (!data) {
    console.error('PdfTemplate: data is undefined');
    return null;
  }
  
  // Use provided settings or defaults
  const companyInfo = settings?.company || {
    name: 'Your Company Name',
    address: 'Your Street Address',
    postalCode: '00000',
    city: 'Your City',
    country: 'Switzerland',
    phone: '+00 00 000 00 00',
    email: 'noc@example.com',
    vatNumber: 'VAT-000000'
  };
  
  const loaInfo = settings?.loaTemplate || {
    authorizedSignatory: '',
    signatoryTitle: ''
  };
  
  const loaId = `LOA-${format(new Date(), 'yyyyMMdd')}-${uuidv4().slice(0, 8).toUpperCase()}`
  const verificationCode = uuidv4().slice(0, 12).toUpperCase()
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Professional Company Header */}
        <View style={styles.professionalHeader}>
          <View style={styles.headerLeft}>
            {/* Logo from settings */}
            <Image 
              src="/assets/logo.png" 
              style={{ width: 100, height: 33, marginBottom: 5 }}
            />
            <View style={styles.companyAddress}>
              <Text>{companyInfo.address}</Text>
              <Text>{companyInfo.postalCode} {companyInfo.city}</Text>
              <Text>{companyInfo.country}</Text>
              {companyInfo.vatNumber && (
                <Text style={{ marginTop: 3, fontSize: 8, color: '#666' }}>
                  VAT: {companyInfo.vatNumber}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 10, color: '#666', marginBottom: 5 }}>Letter of Authorization</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data?.issueDate ? format(new Date(data.issueDate), 'dd.MM.yyyy') : format(new Date(), 'dd.MM.yyyy')}</Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>Reference: {loaId}</Text>
          </View>
        </View>

        {/* Recipient Information */}
        <View style={styles.recipientSection}>
          <Text style={styles.recipientTitle}>{data?.requestingCompany || 'Requesting Party'}</Text>
          {data?.requestingAddress && (
            <View style={{ marginTop: 2 }}>
              {(() => {
                const lines = data.requestingAddress.split(',').map(line => line.trim());
                const formattedLines = [];
                
                // Process address lines
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i];
                  // Check if this line looks like a postal code (starts with numbers)
                  if (/^\d/.test(line) && i + 1 < lines.length) {
                    // Combine postal code with city on same line
                    formattedLines.push(`${line} ${lines[i + 1]}`);
                    i++; // Skip next line as we've already included it
                  } else {
                    formattedLines.push(line);
                  }
                }
                
                return formattedLines.map((line, index) => (
                  <Text key={index} style={{ fontSize: 9, color: '#666', lineHeight: 1.3 }}>
                    {line}
                  </Text>
                ));
              })()}
            </View>
          )}
        </View>

        {/* Main Title */}
        <Text style={styles.mainTitle}>LETTER OF AUTHORIZATION</Text>

        {/* Main Authorization Text - All in One */}
        <Text style={styles.bodyText}>
          {companyInfo.name} hereby authorizes {data?.requestingCompany || '[REQUESTING COMPANY]'}, and/or its designated agents, to request, order, coordinate and manage a cross-connect on our behalf with {data?.datacenterName || '[DATACENTER]'}, including the submission of service orders and work authorizations. All costs and charges related to the above-mentioned cross-connect, including installation, recurring fees and any associated services, shall be paid in full by {data?.requestingCompany || '[REQUESTING COMPANY]'} and/or its agents. This authorization does not transfer ownership, liability, or operational responsibility of the infrastructure to {data?.requestingCompany || '[REQUESTING COMPANY]'}.
        </Text>

        {/* Site Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site location</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{data?.datacenterName || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{data?.datacenterAddress || '-'}</Text>
          </View>
          {data?.siteCode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>Site Code: {data.siteCode}</Text>
            </View>
          )}
        </View>

        {/* Demarcation Points */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demarcation points</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Datacenter:</Text>
            <Text style={styles.infoValue}>{data?.datacenterName || '-'}</Text>
          </View>
          {data?.ourRoom && data.ourRoom !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Room:</Text>
              <Text style={styles.infoValue}>{data.ourRoom}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cage/Suite:</Text>
            <Text style={styles.infoValue}>{data?.ourCage || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rack:</Text>
            <Text style={styles.infoValue}>{data?.ourCabinet || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patchpanel:</Text>
            <Text style={styles.infoValue}>{data?.ourPatchPanel || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Port:</Text>
            <Text style={styles.infoValue}>{data?.ourPort || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Connection Type:</Text>
            <Text style={styles.infoValue}>
              {data?.connectionType ? data.connectionType.replace('-', ' ').charAt(0).toUpperCase() + data.connectionType.replace('-', ' ').slice(1) : '-'}
            </Text>
          </View>
          {data?.connectorType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Connector Type:</Text>
              <Text style={styles.infoValue}>{data.connectorType}</Text>
            </View>
          )}
        </View>

        {/* Special Instructions */}
        {data?.specialInstructions && data.specialInstructions.trim() !== '' && (
          <View style={styles.highlightBox}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Special Instructions:</Text>
            <Text style={{ fontSize: 10 }}>{data.specialInstructions}</Text>
          </View>
        )}

        {/* Note and Contact Information */}
        <Text style={styles.noteText}>
          This Letter of Authorization does not create any billing obligation for {companyInfo.name},{"\n"}
          nor does it imply any financial responsibility for the services described herein.{"\n"}
          {"\n"}
          For any questions, clarifications or additional requirements related to this{"\n"}
          authorization, please contact us using the details below.{"\n"}
          {"\n"}
          Operational contact (NOC):{"\n"}
          Email: {companyInfo.email}{"\n"}
          Tel: {companyInfo.phone}
        </Text>

        {/* Validity */}
        <Text style={[styles.noteText, { fontWeight: 'bold', fontStyle: 'normal', marginTop: 10 }]}>
          {data?.expiryDate && data.expiryDate !== '' ? (
            `This Letter of Authorization is valid from ${format(new Date(data?.issueDate || new Date()), 'd MMMM yyyy')} and remains valid until ${format(new Date(data.expiryDate), 'd MMMM yyyy')}, unless revoked in writing.`
          ) : (
            `This LOA remains valid until explicitly revoked in writing by ${companyInfo.name}.`
          )}
        </Text>

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={{ fontSize: 10, marginBottom: 15 }}>Sincerely,</Text>
          <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{companyInfo.name}</Text>
          {loaInfo.authorizedSignatory && (
            <>
              <Text style={{ fontSize: 10, marginTop: 5 }}>{loaInfo.authorizedSignatory}</Text>
              <Text style={{ fontSize: 9, color: '#666' }}>{loaInfo.signatoryTitle}</Text>
            </>
          )}
        </View>

        {/* Page number */}
        <Text style={styles.pageNumber}>1/1</Text>

        {/* Footer with verification */}
        <View style={{ position: 'absolute', bottom: 30, left: 40, right: 40 }}>
          <Text style={{ fontSize: 8, color: '#999' }}>
            Verification Code: {verificationCode} | Generated: {format(new Date(), 'dd.MM.yyyy HH:mm:ss')}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default PdfTemplate