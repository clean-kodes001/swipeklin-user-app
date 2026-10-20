/**
 * Validates postal codes for different countries
 */

// Canadian Postal Code (with or without space)
// Basic version - excludes D, F, I, O, Q, U
const canadianPostalCodeRegex =
  /^(?!.*[DFIOQU])[A-VXY][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i;

// More explicit/strict version - explicitly lists allowed letters
const canadianPostalCodeRegexStrict =
  /^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ]\s?[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$/i;

// US ZIP Code (5 digits or 5+4 format)
const usZipCodeRegex = /^\d{5}(-\d{4})?$/;

// UK Postcode
const ukPostcodeRegex = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i;

/**
 * Validates a postal/zip code for a specific country
 * @param {string} postalCode - The postal code to validate
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'CA', 'US', 'GB')
 * @param {boolean} useStrict - Use strict validation (for CA only, defaults to true)
 * @returns {Object} - { isValid: boolean, error: string, formatted: string }
 */
export const validatePostalCode = (
  postalCode,
  countryCode = 'CA',
  useStrict = true,
) => {
  if (!postalCode || postalCode.length === 0) {
    return {isValid: true, error: '', formatted: ''};
  }

  // Remove extra spaces and convert to uppercase
  const cleanedCode = postalCode.trim().toUpperCase();

  switch (countryCode) {
    case 'CA': {
      const regex = useStrict
        ? canadianPostalCodeRegexStrict
        : canadianPostalCodeRegex;
      const isValid = regex.test(cleanedCode);

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid Canadian postal code format (e.g., A1A 1A1)',
          formatted: cleanedCode,
        };
      }

      // Format with space if not present
      const formatted = cleanedCode.replace(/\s/g, '');
      const formattedWithSpace =
        formatted.slice(0, 3) + ' ' + formatted.slice(3);

      return {
        isValid: true,
        error: '',
        formatted: formattedWithSpace,
      };
    }

    case 'US': {
      const isValid = usZipCodeRegex.test(cleanedCode);

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid US ZIP code format (e.g., 12345 or 12345-6789)',
          formatted: cleanedCode,
        };
      }

      return {
        isValid: true,
        error: '',
        formatted: cleanedCode,
      };
    }

    case 'GB': {
      const isValid = ukPostcodeRegex.test(cleanedCode);

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid UK postcode format',
          formatted: cleanedCode,
        };
      }

      return {
        isValid: true,
        error: '',
        formatted: cleanedCode,
      };
    }

    default:
      // For unsupported countries, just return valid
      return {
        isValid: true,
        error: '',
        formatted: cleanedCode,
      };
  }
};

/**
 * Formats a Canadian postal code with proper spacing
 * @param {string} postalCode - The postal code to format
 * @returns {string} - Formatted postal code
 */
export const formatCanadianPostalCode = postalCode => {
  if (!postalCode) {
    return '';
  }

  // Remove spaces and convert to uppercase
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase();

  // Add space after 3rd character if not present
  if (cleaned.length > 3) {
    return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
  }

  return cleaned;
};
