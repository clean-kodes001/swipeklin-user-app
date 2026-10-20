import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  STEP2_DATA: 'temp_step2_data',
  STEP3_DATA: 'temp_step3_data',
};

// AsyncStorage size limits (conservative estimates)
// iOS: ~6MB per item, Android: ~10MB per item
// Base64 increases size by ~33%, so we limit base64 to files < 3.5MB
// This ensures base64 stays under 4.6MB (safe for iOS 6MB limit)
const MAX_BASE64_FILE_SIZE = 3.5 * 1024 * 1024; // 3.5MB

/**
 * Save temporary form data for Step2
 * @param {Object} data - The image data to save
 */
export const saveStep2Data = async data => {
  try {
    if (!data?.assets?.[0]) {
      return;
    }

    const asset = data.assets[0];
    const fileSize = asset.fileSize || asset.size || 0;

    // Only use base64 if file is small enough to avoid AsyncStorage size limits
    // Base64 is ~33% larger, so 3.5MB file = ~4.6MB base64 (safe for iOS 6MB limit)
    const shouldUseBase64 =
      asset.base64 && fileSize > 0 && fileSize < MAX_BASE64_FILE_SIZE;

    const dataToSave = {
      // Use base64 only if file is small enough
      base64: shouldUseBase64 ? asset.base64 : null,
      // Always save URI as fallback
      imageUri: asset.uri || null,
      type: asset.type || 'image/jpeg',
      timestamp: Date.now(),
    };

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.STEP2_DATA,
        JSON.stringify(dataToSave),
      );
    } catch (storageError) {
      // If save fails due to size, try saving without base64
      if (
        storageError.message?.includes('size') ||
        storageError.message?.includes('quota') ||
        storageError.message?.includes('too large')
      ) {
        console.warn('Base64 too large for AsyncStorage, saving URI only');
        const fallbackData = {
          base64: null,
          imageUri: asset.uri || null,
          type: asset.type || 'image/jpeg',
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(
          STORAGE_KEYS.STEP2_DATA,
          JSON.stringify(fallbackData),
        );
      } else {
        throw storageError;
      }
    }
  } catch (error) {
    console.error('Error saving Step2 data:', error);
    throw error; // Propagate error
  }
};

/**
 * Load temporary form data for Step2
 * @returns {Object|null} The saved image data or null
 */
export const loadStep2Data = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STEP2_DATA);
    if (data) {
      const parsed = JSON.parse(data);

      // Prefer base64 if available (more reliable)
      if (parsed?.base64) {
        return {
          assets: [
            {
              uri: `data:${parsed.type || 'image/jpeg'};base64,${
                parsed.base64
              }`,
              base64: parsed.base64,
              type: parsed.type || 'image/jpeg',
            },
          ],
        };
      }

      // Fallback to URI if base64 not available
      if (parsed?.imageUri) {
        return {
          assets: [
            {
              uri: parsed.imageUri,
              type: parsed.type || 'image/jpeg',
            },
          ],
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading Step2 data:', error);
    // Clear corrupted data
    await clearStep2Data();
    return null;
  }
};

/**
 * Clear temporary form data for Step2
 */
export const clearStep2Data = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.STEP2_DATA);
  } catch (error) {
    console.error('Error clearing Step2 data:', error);
  }
};

/**
 * Save temporary form data for Step3
 * @param {Object} formValues - The formik form values to save
 */
export const saveStep3Data = async formValues => {
  try {
    // Convert Date objects and complex objects to serializable format
    const dataToSave = {
      ...formValues,
      dob: formValues.dob || '',
      gender: formValues.gender
        ? {id: formValues.gender.id, name: formValues.gender.name}
        : '',
      city: formValues.city
        ? {id: formValues.city.id, name: formValues.city.name}
        : '',
      state: formValues.state
        ? {id: formValues.state.id, name: formValues.state.name}
        : '',
      country: formValues.country
        ? {id: formValues.country.id, name: formValues.country.name}
        : '',
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.STEP3_DATA,
      JSON.stringify(dataToSave),
    );
  } catch (error) {
    console.error('Error saving Step3 data:', error);
    throw error; // Propagate error
  }
};

/**
 * Load temporary form data for Step3
 * @returns {Object|null} The saved form values or null
 */
export const loadStep3Data = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STEP3_DATA);
    if (data) {
      const parsed = JSON.parse(data);
      // Validate structure
      if (!parsed || typeof parsed !== 'object') {
        await clearStep3Data();
        return null;
      }
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error loading Step3 data:', error);
    // Clear corrupted data
    await clearStep3Data();
    return null;
  }
};

/**
 * Clear temporary form data for Step3
 */
export const clearStep3Data = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.STEP3_DATA);
  } catch (error) {
    console.error('Error clearing Step3 data:', error);
  }
};

/**
 * Clear all temporary form data (useful for logout or completion)
 */
export const clearAllFormData = async () => {
  try {
    await Promise.all([clearStep2Data(), clearStep3Data()]);
  } catch (error) {
    console.error('Error clearing all form data:', error);
  }
};
