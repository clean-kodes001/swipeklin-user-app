import {showToast} from './showToast';

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  AVATAR_PROFILE: 5 * 1024 * 1024, // 5 MB (5120 KB)
  DOCUMENTS_CLEANER: 9 * 1024 * 1024, // 9 MB (9216 KB)
  CHAT_IMAGES: 9 * 1024 * 1024, // 9 MB (9216 KB)
  CONTACT_TASK: 2 * 1024 * 1024, // 2 MB (2048 KB)
};

/**
 * Allowed file formats
 */
export const ALLOWED_FORMATS = {
  AVATAR_PROFILE: ['jpg', 'jpeg', 'png', 'gif'],
  CONTACT_TASK: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
};

/**
 * Get file extension from filename or URI
 * @param {string} filename - The filename or URI
 * @returns {string} The file extension in lowercase
 */
export const getFileExtension = filename => {
  if (!filename) return '';
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
};

/**
 * Validate file size
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @param {string} errorMessage - Custom error message
 * @returns {Object} {isValid: boolean, error: string|null}
 */
export const validateFileSize = (fileSize, maxSize, errorMessage = null) => {
  if (!fileSize || fileSize === 0) {
    return {isValid: false, error: 'File size is invalid'};
  }

  if (fileSize > maxSize) {
    const sizeInMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: errorMessage || `The file must not be more than ${sizeInMB}MB.`,
    };
  }

  return {isValid: true, error: null};
};

/**
 * Validate file format
 * @param {string} filename - The filename or URI
 * @param {string[]} allowedFormats - Array of allowed extensions (lowercase)
 * @returns {Object} {isValid: boolean, error: string|null}
 */
export const validateFileFormat = (filename, allowedFormats) => {
  if (!filename || !allowedFormats || allowedFormats.length === 0) {
    return {isValid: true, error: null}; // Skip format validation if not specified
  }

  const extension = getFileExtension(filename);
  if (!extension) {
    return {isValid: false, error: 'File format could not be determined'};
  }

  if (!allowedFormats.includes(extension)) {
    return {
      isValid: false,
      error: `File format not allowed. Allowed formats: ${allowedFormats.join(', ').toUpperCase()}`,
    };
  }

  return {isValid: true, error: null};
};

/**
 * Validate avatar/profile image
 * @param {Object} file - File object from image picker (has assets array)
 * @returns {Object} {isValid: boolean, error: string|null}
 */
export const validateAvatarImage = file => {
  if (!file || !file.assets || file.assets.length === 0) {
    return {isValid: false, error: 'No file selected'};
  }

  const asset = file.assets[0];
  const fileSize = asset.fileSize || asset.size || 0;
  const fileName = asset.fileName || asset.uri || '';

  // Validate size
  const sizeValidation = validateFileSize(
    fileSize,
    FILE_SIZE_LIMITS.AVATAR_PROFILE,
    'The file must not be more than 5MB.',
  );
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate format
  const formatValidation = validateFileFormat(
    fileName,
    ALLOWED_FORMATS.AVATAR_PROFILE,
  );
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  return {isValid: true, error: null};
};

/**
 * Validate document for cleaner onboarding
 * @param {Object|Array} file - File object from document picker
 * @returns {Object} {isValid: boolean, error: string|null}
 */
export const validateCleanerDocument = file => {
  if (!file) {
    return {isValid: false, error: 'No file selected'};
  }

  // DocumentPicker returns array, get first item
  const document = Array.isArray(file) ? file[0] : file;
  if (!document) {
    return {isValid: false, error: 'No file selected'};
  }

  const fileSize = document.size || 0;
  const fileName = document.name || document.uri || '';

  // Validate size
  const sizeValidation = validateFileSize(
    fileSize,
    FILE_SIZE_LIMITS.DOCUMENTS_CLEANER,
    'The file must not be more than 9MB.',
  );
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return {isValid: true, error: null};
};

/**
 * Validate contact task document
 * @param {Object|Array} file - File object from document picker
 * @returns {Object} {isValid: boolean, error: string|null}
 */
export const validateContactDocument = file => {
  if (!file) {
    return {isValid: false, error: 'No file selected'};
  }

  // DocumentPicker returns array, get first item
  const document = Array.isArray(file) ? file[0] : file;
  if (!document) {
    return {isValid: false, error: 'No file selected'};
  }

  const fileSize = document.size || 0;
  const fileName = document.name || document.uri || '';

  // Validate size
  const sizeValidation = validateFileSize(
    fileSize,
    FILE_SIZE_LIMITS.CONTACT_TASK,
    'The file must not be more than 2MB.',
  );
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate format
  const formatValidation = validateFileFormat(
    fileName,
    ALLOWED_FORMATS.CONTACT_TASK,
  );
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  return {isValid: true, error: null};
};

/**
 * Validate chat image
 * @param {Object} file - File object from image picker
 * @returns {Object} {isValid: boolean, error: string|null}
 */
export const validateChatImage = file => {
  if (!file || !file.assets || file.assets.length === 0) {
    return {isValid: false, error: 'No file selected'};
  }

  const asset = file.assets[0];
  const fileSize = asset.fileSize || asset.size || 0;

  // Validate size
  const sizeValidation = validateFileSize(
    fileSize,
    FILE_SIZE_LIMITS.CHAT_IMAGES,
    'The file must not be more than 9MB.',
  );
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return {isValid: true, error: null};
};

/**
 * Show error toast to user
 * @param {string} message - Error message to display
 */
export const showFileValidationError = message => {
  showToast({type: 0, message});
};

