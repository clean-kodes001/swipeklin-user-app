# Code Cleanup Documentation

This document outlines the remaining code cleanup tasks identified during the review of form data persistence implementation.

## Overview

The following cleanup tasks address redundant implementations, code duplication, and non-best practices identified in the form data persistence feature.

---

## 1. Step3.jsx - Remove Redundant Phone/DOB Updates

### Issue
Phone and DOB values are being set multiple times unnecessarily:
1. In `updatedValues` object via `form.setValues()` (line 218)
2. In `setTimeout` 200ms (lines 221-238)
3. In `setTimeout` 300ms (lines 242-256)

### Location
`src/screens/Profile/Step3.jsx` (lines 188-285)

### Recommendation
- Remove the redundant `setTimeout` calls (lines 220-238 and 242-256)
- Keep only the `form.setValues(updatedValues, false)` call (line 218)
- The `setValues` call should be sufficient to update all form fields including phone and DOB

### Code to Remove
```javascript
// Remove lines 220-238
// Force update phone and dob again after a delay to ensure DatePicker updates
setTimeout(() => {
  if (
    savedData.phone !== undefined &&
    savedData.phone !== null &&
    savedData.phone !== ''
  ) {
    console.log('Step3: Force updating phone:', savedData.phone);
    form.setFieldValue('phone', savedData.phone, false);
  }
  if (
    savedData.dob !== undefined &&
    savedData.dob !== null &&
    savedData.dob !== ''
  ) {
    console.log('Step3: Force updating dob:', savedData.dob);
    form.setFieldValue('dob', savedData.dob, false);
  }
}, 200);

// Remove lines 242-256
// Force update phone and dob if they were in saved data
if (
  savedData &&
  (savedData.phone !== undefined || savedData.dob !== undefined)
) {
  if (savedData.phone !== undefined && savedData.phone !== null) {
    form.setFieldValue('phone', savedData.phone, false);
    console.log('Step3: Force setting phone:', savedData.phone);
  }
  if (savedData.dob !== undefined && savedData.dob !== null) {
    form.setFieldValue('dob', savedData.dob, false);
    console.log('Step3: Force setting dob:', savedData.dob);
  }
}
```

---

## 2. Step3.jsx - Extract Shared Loading Logic

### Issue
The loading logic is duplicated between:
- Initial `useEffect` (lines 181-289)
- `useFocusEffect` (lines 350-436)

Both contain nearly identical code for loading and applying saved data.

### Location
`src/screens/Profile/Step3.jsx`

### Recommendation
- Extract the shared loading logic into a reusable function
- Call this function from both `useEffect` and `useFocusEffect`
- This will reduce code duplication and make maintenance easier

### Proposed Refactor
```javascript
// Create a shared function
const loadAndApplySavedData = useCallback(async () => {
  if (!user?.id) return;
  
  const savedData = await loadStep3Data();
  if (!savedData) return;

  const updatedValues = {...form.values};
  
  Object.keys(savedData).forEach(key => {
    if (key === 'timestamp') return;
    
    const savedValue = savedData[key];
    
    if (
      typeof savedValue === 'object' &&
      savedValue !== null &&
      savedValue.id !== undefined
    ) {
      updatedValues[key] = savedValue;
    } else if (savedValue !== null && savedValue !== undefined) {
      updatedValues[key] = savedValue;
    }
  });

  form.setValues(updatedValues, false);
  
  // Update tracking refs
  setTimeout(() => {
    setIsLoadingSavedData(false);
    hasLoadedInitialDataRef.current = true;
    previousValuesRef.current = getFormValuesString();
  }, 300);
}, [user?.id, form, getFormValuesString]);

// Use in both places
useEffect(() => {
  setIsLoadingSavedData(true);
  loadAndApplySavedData();
}, [user?.id, user?.first_name, user?.last_name, loadAndApplySavedData]);

useFocusEffect(
  useCallback(() => {
    loadAndApplySavedData();
  }, [loadAndApplySavedData])
);
```

---

## 3. Step3.jsx - Remove Console.logs

### Issue
Multiple `console.log` statements throughout the file that should be removed for production.

### Location
`src/screens/Profile/Step3.jsx`

### Console.logs to Remove
- Line 190: `console.log('Step3: Loading saved data', savedData);`
- Line 211: `console.log(\`Step3: Loading saved ${key}:\`, savedValue);`
- Line 217: `console.log('Step3: Updating form with saved values', updatedValues);`
- Line 227: `console.log('Step3: Force updating phone:', savedData.phone);`
- Line 235: `console.log('Step3: Force updating dob:', savedData.dob);`
- Line 250: `console.log('Step3: Force setting phone:', savedData.phone);`
- Line 254: `console.log('Step3: Force setting dob:', savedData.dob);`
- Line 283: `console.log('Step3: Initial values set', previousValuesRef.current);`
- Line 284: `console.log('Step3: Current form values', form.values);`
- Line 294: `console.log('Step3: Actually saving to storage', formValues);`
- Line 353: `console.log('Step3: Reloading saved data on focus', savedData);`
- Line 374: `console.log(\`Step3: Reloading ${key} to:\`, savedValue);`
- Line 380-382: `console.log('Step3: Updating form with reloaded values', updatedValues);`
- Line 393: `console.log('Step3: Force reloading phone:', savedData.phone);`
- Line 401: `console.log('Step3: Force reloading dob:', savedData.dob);`

### Recommendation
- Remove all `console.log` statements
- Keep `console.error` statements for error handling (these are acceptable)
- Consider using a logging utility that can be disabled in production if logging is needed

---

## 4. TextInputFieldRender.jsx - Remove Unused phoneInputRef

### Issue
`phoneInputRef` is created but never used. The code checks for `setValue` method but then always falls back to key-based remounting.

### Location
`src/components/Inputs/TextInputFieldRender.jsx` (lines 35, 58)

### Recommendation
- Remove `phoneInputRef` if it's not being used
- Or implement proper ref usage if the library supports it
- The current key-based remounting approach works but could be optimized

### Code to Clean
```javascript
// Remove unused ref
const phoneInputRef = useRef(null); // Line 35

// Remove ref from PhoneInput component
ref={phoneInputRef} // Line 58
```

### Alternative
If the library supports ref methods, implement proper usage:
```javascript
useEffect(() => {
  if (type === 'phone' && phoneInputRef.current) {
    // Use library's method if available
    if (typeof phoneInputRef.current.setValue === 'function') {
      phoneInputRef.current.setValue(value);
      return;
    }
  }
  // Fallback to key-based remount
  setPhoneKey(prev => prev + 1);
}, [value, type]);
```

---

## 5. Step3.jsx - Consolidate setTimeout Delays

### Issue
Multiple `setTimeout` calls with different delays (200ms, 300ms) doing similar work.

### Location
`src/screens/Profile/Step3.jsx`

### Recommendation
- Use a single constant for delay values
- Consolidate related setTimeout calls
- Document why delays are needed

### Proposed Refactor
```javascript
// At top of component
const FORM_UPDATE_DELAY = 300; // Delay for form state updates

// Use consistently
setTimeout(() => {
  // All update logic here
}, FORM_UPDATE_DELAY);
```

---

## 6. formDataStorage.js - Remove Redundant Phone Assignment

### Issue
Line 72 explicitly assigns `phone: formValues.phone || ''` but it's already included in the spread operator `...formValues`.

### Location
`src/utils/formDataStorage.js` (line 72)

### Recommendation
- Remove the redundant explicit assignment
- The spread operator already includes phone value

### Code to Remove
```javascript
const dataToSave = {
  ...formValues,
  phone: formValues.phone || '', // Remove this line - redundant
  dob: formValues.dob || '',
  // ... rest
};
```

### Note
If explicit assignment was added to ensure phone is always a string (not undefined), consider if this is necessary. The spread operator should preserve the value as-is.

---

## 7. DatePicker.jsx - Add Error Handling Cleanup

### Issue
The `useEffect` in DatePicker doesn't handle cleanup if component unmounts during async date parsing.

### Location
`src/components/Inputs/DatePicker.jsx` (lines 33-46)

### Recommendation
- Add cleanup function to prevent state updates on unmounted components
- This is a best practice for useEffect hooks

### Proposed Fix
```javascript
useEffect(() => {
  let isMounted = true;
  
  if (value) {
    try {
      const newDate = mode === 'time' ? null : new Date(value);
      if (newDate && !isNaN(newDate.getTime()) && isMounted) {
        setDate(newDate);
      }
    } catch (error) {
      console.warn('DatePicker: Error parsing date value', value, error);
    }
  } else if (isMounted) {
    setDate(null);
  }
  
  return () => {
    isMounted = false;
  };
}, [value, mode]);
```

---

## 8. TextInputFieldRender.jsx - Optimize PhoneInput Remounting

### Issue
PhoneInput remounts on every value change, which is inefficient. The comparison logic could be improved.

### Location
`src/components/Inputs/TextInputFieldRender.jsx` (lines 41-52)

### Recommendation
- Improve the comparison logic to avoid unnecessary remounts
- Consider using a more efficient approach if the library supports it

### Current Issue
```javascript
// This remounts even if value hasn't actually changed
if (type === 'phone' && value !== undefined && value !== null && value !== previousPhoneValueRef.current) {
  // Remounts
}
```

### Proposed Improvement
```javascript
useEffect(() => {
  if (type !== 'phone') return;
  
  const currentValue = value || '';
  const previousValue = previousPhoneValueRef.current || '';
  
  // Only remount if value actually changed
  if (currentValue !== previousValue) {
    previousPhoneValueRef.current = currentValue;
    setPhoneKey(prev => prev + 1);
  }
}, [value, type]);
```

---

## Priority Order

1. **High Priority:**
   - Remove redundant phone/DOB updates (#1)
   - Remove console.logs (#3)
   - Remove redundant phone assignment (#6)

2. **Medium Priority:**
   - Extract shared loading logic (#2)
   - Consolidate setTimeout delays (#5)

3. **Low Priority:**
   - Remove unused phoneInputRef (#4)
   - Add error handling cleanup (#7)
   - Optimize PhoneInput remounting (#8)

---

## Testing Checklist

After implementing cleanup:
- [ ] Verify phone number persists when navigating away and back
- [ ] Verify DOB persists when navigating away and back
- [ ] Verify all form fields load correctly from saved data
- [ ] Verify form data saves correctly on changes
- [ ] Verify no console errors in production build
- [ ] Verify performance is not degraded

---

## Notes

- All cleanup should maintain existing functionality
- Test thoroughly after each cleanup task
- Consider creating unit tests for the shared loading logic
- Document any breaking changes if they occur

