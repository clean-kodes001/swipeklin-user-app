import * as Yup from 'yup';
import i18n from '../i18n/i18n';

const t = key => i18n.t(`validation.${key}`);

const CANADIAN_PROVINCES = [
  {id: 'AB', name: 'Alberta'},
  {id: 'BC', name: 'British Columbia'},
  {id: 'MB', name: 'Manitoba'},
  {id: 'NB', name: 'New Brunswick'},
  {id: 'NL', name: 'Newfoundland and Labrador'},
  {id: 'NT', name: 'Northwest Territories'},
  {id: 'NS', name: 'Nova Scotia'},
  {id: 'NU', name: 'Nunavut'},
  {id: 'ON', name: 'Ontario'},
  {id: 'PE', name: 'Prince Edward Island'},
  {id: 'QC', name: 'Quebec'},
  {id: 'SK', name: 'Saskatchewan'},
  {id: 'YT', name: 'Yukon'},
];

const checkAddressProvinceMatch = (address, state) => {
  if (!address || !state?.name) return true;
  const addressLower = address.toLowerCase();
  const selectedName = state.name.toLowerCase();
  const conflict = CANADIAN_PROVINCES.find(p => {
    const pName = p.name.toLowerCase();
    const pCode = p.id.toLowerCase();
    if (pName === selectedName) return false;
    const shortCodePattern = new RegExp(`(?:,\\s*|\\s)${pCode}(?:\\s|,|$)`);
    return addressLower.includes(pName) || shortCodePattern.test(addressLower);
  });
  return !conflict;
};

export const _emailSchema = Yup.object().shape({
  email: Yup.string()
    .email(() => t('email_invalid'))
    // require a real TLD ('foo@gmail' rejected) and a single domain label
    // before it, so doubled/stacked TLDs like 'foo@gmail.co.com' are rejected too
    .matches(/^[^\s@]+@[^\s@.]+\.[A-Za-z]{3,}$/, {
      message: () => t('email_invalid'),
      excludeEmptyString: true,
    })
    .required(() => t('email_required')),
});
export const _step3Schema = Yup.object().shape({
  phone: Yup.string()
    .required(() => t('phone_required'))
    .test(
      'regex test',
      () => t('phone_invalid'),
      val => {
        const regExp = /[a-zA-Z]/;
        return !regExp.test(val);
      },
    )

    .test(
      'empty string test',
      () => t('phone_empty'),
      val => {
        return val.trim() !== '';
      },
    ),
  first_name: Yup.string().required(() => t('required')),
  last_name: Yup.string().required(() => t('required')),

  dob: Yup.date().required(() => t('required')),
  country: Yup.object().required(() => t('required')),
  gender: Yup.object().required(() => t('required')),
  state: Yup.object().required(() => t('required')),
  city: Yup.object().required(() => t('required')),
  postal_code: Yup.string()
    .required(() => t('required'))
    .test(
      'canadian-postal-code',
      () => t('postal_code_invalid'),
      function (value) {
        if (!value) return true; // Let required() handle empty values
        // Remove spaces and convert to uppercase for validation
        const cleaned = value.trim().replace(/\s/g, '').toUpperCase();
        // Canadian postal code format: A1A1A1 (6 characters, alphanumeric)
        // First character: A-V, X, Y (excludes D, F, I, O, Q, U)
        // Second character: 0-9
        // Third character: A-Z (excludes D, F, I, O, Q, U)
        // Fourth character: 0-9
        // Fifth character: A-Z (excludes D, F, I, O, Q, U)
        // Sixth character: 0-9
        const canadianPostalCodeRegex =
          /^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$/i;
        return canadianPostalCodeRegex.test(cleaned);
      },
    ),
  address: Yup.string()
    .required(() => t('required'))
    .test(
      'province-match',
      () => t('address_province_mismatch'),
      function (address) {
        return checkAddressProvinceMatch(address, this.parent.state);
      },
    ),
});
export const _supportSchema = Yup.object().shape({
  first_name: Yup.string().required(() => t('required')),
  last_name: Yup.string().required(() => t('required')),
  document: Yup.mixed().required(() => t('required')),
  dob: Yup.date().required(() => t('required')),
  gender: Yup.object().required(() => t('required')),
});
export const _loginSchema = Yup.object().shape({
  username: Yup.string()
    .email(() => t('email_invalid'))
    .required(() => t('email_required')),
  password: Yup.string()
    .required(() => t('password_required'))
    .min(8, () => t('password_min')),
});

export const _createPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required(() => t('password_required'))
    .min(8, () => t('password_min')),
  password_confirmation: Yup.string()
    .when('password', (password, schema) => {
      if (password)
        return schema.required(() => t('confirm_password_required'));
    })
    .oneOf([Yup.ref('password')], () => t('passwords_match')),
});

export const _enterPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required(() => t('password_required'))
    .min(8, () => t('password_min')),
});
