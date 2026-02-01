import { z } from 'zod'

export const loaFormSchema = z.object({
  // Company Information
  companyName: z.string().min(1, "Nome azienda richiesto"),
  companyLogo: z.string().optional(),
  vatNumber: z.string().optional(),
  companyRegistration: z.string().optional(),
  
  // Authorization Details
  issueDate: z.string().min(1, "Data emissione richiesta"),
  expiryDate: z.string().optional(),
  
  // Datacenter Information
  datacenterName: z.string().min(1, "Nome datacenter richiesto"),
  datacenterAddress: z.string().min(1, "Indirizzo datacenter richiesto"),
  siteCode: z.string().min(1, "Codice sito richiesto"),
  
  // Requesting Party Information (Who is connecting to us)
  requestingCompany: z.string().min(1, "Nome azienda richiedente richiesto"),
  requestingAddress: z.string().optional(),
  
  // Our Equipment Location (Where to connect in our infrastructure)
  ourCage: z.string().min(1, "Cage/Suite richiesto"),
  ourRoom: z.string().optional(),
  ourCabinet: z.string().min(1, "Cabinet/Rack richiesto"),
  ourPatchPanel: z.string().min(1, "Patch Panel richiesto"),
  ourPort: z.string().min(1, "Port required"),
  
  // Technical Specifications
  connectionType: z.enum(['single-mode', 'multi-mode', 'copper'], {
    required_error: "Connection type required",
  }),
  connectorType: z.enum(['LC', 'LC/UPC', 'LC/APC', 'SC', 'SC/UPC', 'SC/APC', 'RJ45', 'MPO'], {
    required_error: "Connector type required",
  }),
  
  // Special Instructions
  specialInstructions: z.string().optional(),
})

export type LoaFormData = z.infer<typeof loaFormSchema>