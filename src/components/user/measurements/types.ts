export interface MeasurementTemplate {
  _id: string
  title: string
  fields: Array<{ name: string }>
}

export interface MeasurementData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Address Information
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  shippingLocation: string
  
  // Template Selection (support multiple templates)
  templateId: string // Deprecated, kept for backward compatibility
  selectedTemplate: MeasurementTemplate | null // Deprecated, kept for backward compatibility
  selectedTemplates: MeasurementTemplate[]
  
  // Measurement Values (keyed by template ID, then by field name)
  measurements: Record<string, Record<string, number>>
  
  // Quantity for each template (keyed by template ID)
  quantities: Record<string, number>
  
  // Optional Image Samples (keyed by template ID, array of image URLs)
  sampleImageUrls: Record<string, string[]>
  
  // Deprecated: kept for backward compatibility
  sampleImageUrl: string
  
  // Additional Information
  notes: string
  preferredStyle: string

  // Category/Subcategory (deprecated, kept for backward compatibility with Step2CategorySelection)
  category?: string
  subcategory?: string
  needsTopMeasurements?: boolean
  needsBottomMeasurements?: boolean

  // Top / body measurements (kept for form convenience)
  neck?: number
  shoulder?: number
  sleeveLength?: number
  roundSleeve?: number
  chest?: number
  tummy?: number
  shirtLength?: number
  hip?: number
  laps?: number
  kneel?: number
  roundKneel?: number
  trouserLength?: number
  ankle?: number
}

export const initialFormData: MeasurementData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Nigeria',
  shippingLocation: '',
  templateId: '',
  selectedTemplate: null,
  selectedTemplates: [],
  measurements: {},
  quantities: {},
  sampleImageUrls: {},
  sampleImageUrl: '',
  notes: '',
  preferredStyle: '',
  category: '',
  subcategory: '',
  needsTopMeasurements: false,
  needsBottomMeasurements: false,
  neck: 0,
  shoulder: 0,
  sleeveLength: 0,
  roundSleeve: 0,
  chest: 0,
  tummy: 0,
  shirtLength: 0,
  hip: 0,
  laps: 0,
  kneel: 0,
  roundKneel: 0,
  trouserLength: 0,
  ankle: 0,
}
