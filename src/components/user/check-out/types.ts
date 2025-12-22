export interface CheckoutFormData {
  // Shipping Information
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  shippingLocation: string

  // Billing
  sameAsShipping: boolean
  billingAddress: string
  billingCity: string
  billingState: string
  billingZipCode: string
  billingCountry: string
  
  // Account creation (for guest checkout)
  createAccount: boolean
  password: string
  confirmPassword: string
}

export const initialCheckoutFormData: CheckoutFormData = {
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
  sameAsShipping: true,
  billingAddress: '',
  billingCity: '',
  billingState: '',
  billingZipCode: '',
  billingCountry: 'Nigeria',
  createAccount: false,
  password: '',
  confirmPassword: '',
}














































