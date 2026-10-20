import {parsePhoneNumber} from 'libphonenumber-js';

/**
 * Validates a phone number for a specific country
 * @param {string} phoneNumber - The phone number to validate
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'CA', 'US', 'NG')
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validatePhoneNumber = (phoneNumber, countryCode = 'CA') => {
  if (!phoneNumber || phoneNumber.length === 0) {
    return {isValid: true, error: ''};
  }

  try {
    // Parse and validate phone number for the specified country
    const parsed = parsePhoneNumber(phoneNumber, countryCode);

    if (!parsed) {
      return {
        isValid: false,
        error: `Invalid ${getCountryName(countryCode)} phone number`,
      };
    }

    if (!parsed.isValid()) {
      return {
        isValid: false,
        error: `Invalid ${getCountryName(countryCode)} phone number`,
      };
    }

    // Check if it matches the expected country
    if (parsed.country !== countryCode) {
      return {
        isValid: false,
        error: `Please enter a valid ${getCountryName(
          countryCode,
        )} phone number`,
      };
    }

    return {isValid: true, error: ''};
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid phone number format',
    };
  }
};

/**
 * Helper function to get country name from country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Country name
 */
const getCountryName = countryCode => {
  const countryNames = {
    CA: 'Canadian',
    US: 'US',
    NG: 'Nigerian',
    GB: 'UK',
    // Add more countries as needed
  };

  return countryNames[countryCode] || countryCode;
};
