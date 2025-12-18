import { worldCountries } from '@/lib/resources'
import { Country } from '@/types'

// Helper function to parse E.164 phone number and extract country code and number
export const parsePhoneNumber = (phoneNumber: string): { country: Country; number: string } => {
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    // Default to Nigeria if no valid phone number
    const defaultCountry = worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0]
    return { country: defaultCountry, number: '' }
  }

  // Remove + and find matching country code
  const digitsOnly = phoneNumber.substring(1).replace(/[\s\-\(\)\.]/g, '')
  
  // Try to find matching country code (1-3 digits)
  for (let i = 3; i >= 1; i--) {
    const potentialCode = digitsOnly.substring(0, i)
    const country = worldCountries.find(c => {
      const codeDigits = c.phoneCode.replace(/[\s\-+]/g, '')
      return codeDigits === potentialCode
    })
    
    if (country) {
      const number = digitsOnly.substring(i)
      return { country, number }
    }
  }

  // Default to Nigeria if no match found
  const defaultCountry = worldCountries.find(c => c.countryCode === 'NG') || worldCountries[0]
  return { country: defaultCountry, number: digitsOnly }
}


































