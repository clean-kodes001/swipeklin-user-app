import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View, Platform} from 'react-native';
import StepsTopbar from '../../components/Shared/StepsBar';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Text from '../../components/Shared/Text';
import {formHandler} from '../../utils/formhandler';
import {formatDateOnly} from '../../utils/dateOnly';
import googleLocation from '../../../googleLocation.json';
import {useFormik} from 'formik';
import Select from '../../components/Inputs/Select';
import SearchSelect from '../../components/Inputs/SearchSelect';
import Datepicker from '../../components/Inputs/DatePicker';
import {uploadProfile} from '../../store/actions/profile/uploadProfile';
import {_step3Schema} from '../../utils/validationSchemas';
import {logOut} from '../../store/reducer/userSlice';
import {validatePhoneNumber} from '../../utils/validatePhone';
import {validatePostalCode} from '../../utils/validatePostalCode';
import {
  saveStep3Data,
  loadStep3Data,
  clearStep3Data,
  clearStep2Data,
} from '../../utils/formDataStorage';
import {debounce} from '../../utils/debounce';
import {useTranslation} from 'react-i18next';

const Step3 = ({navigation, route}) => {
  const {t} = useTranslation();
  const avatar = route.params?.avatar;

  const [cities, setCities] = useState([]);
  const [phoneError, setPhoneError] = useState('');
  const [postalCodeError, setPostalCodeError] = useState('');

  const {unAuthenticated} = useSelector(state => state.data);
  const [states, setStates] = useState(
    () =>
      unAuthenticated?.states?.filter(state => state.country_id === Number(1)) ||
      [],
  );
  const {user} = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);
  const previousValuesRef = useRef(null);
  const hasLoadedInitialDataRef = useRef(false);
  const previousUserIdRef = useRef(user?.id);
  const addressRef = useRef();

  // Clear saved data only when user ID changes to a different user (logout/login scenario)
  // Don't clear when navigating between steps - data should persist
  useEffect(() => {
    const clearOldData = async () => {
      const prevUserId = previousUserIdRef.current;
      const nextUserId = user?.id;
      previousUserIdRef.current = nextUserId;
      if ((prevUserId && !nextUserId) || (prevUserId && nextUserId && prevUserId !== nextUserId)) {
        await clearStep3Data();
        hasLoadedInitialDataRef.current = false;
        previousValuesRef.current = null;
      }
    };
    clearOldData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Validate phone number for Canada
  const validateCanadianPhone = phoneNumber => {
    const formattedPhoneNumber = '1' + phoneNumber;
    const {error} = validatePhoneNumber(formattedPhoneNumber, 'CA');
    setPhoneError(error);
  };

  // Validate postal code for Canada
  const validateCanadianPostalCode = async postalCode => {
    if (!postalCode || postalCode.trim() === '') {
      setPostalCodeError('');
      return;
    }

    // Local validation for immediate feedback
    const localValidation = validatePostalCode(postalCode, 'CA', true);
    if (localValidation.error) {
      setPostalCodeError(localValidation.error);
      return;
    }

    // If local validation passes, update postal code with formatted version
    if (localValidation.formatted !== postalCode) {
      form.setFieldValue('postal_code', localValidation.formatted);
    }
    setPostalCodeError('');
  };

  // Handle address selection from Google Places
  const handleAddressSelected = (data, details = null) => {
    if (!details) {
      return;
    }

    const addressComponents = details.address_components || [];
    let postalCode = '';
    let provinceCode = '';
    let cityName = '';

    addressComponents.forEach(component => {
      const types = component.types || [];
      if (types.includes('postal_code')) postalCode = component.long_name;
      if (types.includes('administrative_area_level_1')) provinceCode = component.short_name;
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        cityName = component.long_name;
      }
    });

    if (postalCode) {
      form.setFieldValue('postal_code', postalCode);
      validateCanadianPostalCode(postalCode);
    }

    if (provinceCode) {
      const PROVINCE_NAMES = {AB:'Alberta',BC:'British Columbia',MB:'Manitoba',NB:'New Brunswick',NL:'Newfoundland and Labrador',NS:'Nova Scotia',NT:'Northwest Territories',NU:'Nunavut',ON:'Ontario',PE:'Prince Edward Island',QC:'Quebec',SK:'Saskatchewan',YT:'Yukon'};
      const fullName = PROVINCE_NAMES[provinceCode];
      const matchedState = states.find(
        s => s.name.toLowerCase() === fullName?.toLowerCase(),
      );
      if (matchedState) {
        const stateCities =
          unAuthenticated.cities?.filter(
            c => c.state_id === Number(matchedState.id),
          ) || [];
        setCities(stateCities);
        const matchedCity = cityName
          ? stateCities.find(c => c.name.toLowerCase() === cityName.toLowerCase())
          : null;
        form.setValues({
          ...form.values,
          address: data.description,
          postal_code: postalCode || form.values.postal_code,
          state: {name: matchedState.name, id: matchedState.id},
          city: matchedCity ? {name: matchedCity.name, id: matchedCity.id} : '',
        });
        return;
      }
    }

    form.setFieldValue('address', data.description);
  };

  const onSubmit = async values => {
    const formData = new FormData();
    if (avatar) {
      formData.append('avatar', avatar);
    }
    formData.append('first_name', values.first_name);
    formData.append('last_name', values.last_name);
    formData.append('other_name', values.other_name);
    formData.append('phone', values?.phone);
    formData.append('dob', values.dob);
    formData.append('email', user?.email);
    formData.append(
      'postal_code',
      values?.postal_code?.replace(/\s/g, '') || '',
    );
    formData.append('gender_id', values?.gender?.id);
    formData.append('address', values?.address);

    formData.append('country_id', values?.country?.id);
    formData.append('state_id', values?.state?.id);
    formData.append('city_id', values?.city?.id);

    try {
      await dispatch(
        uploadProfile({
          nextStage: null,
          navigation,
          data: formData,
          nextPage: null,
        }),
      ).unwrap();
      // Clear all saved form data after successful submission
      await clearStep3Data();
      await clearStep2Data(); // Also clear Step2 data since onboarding is complete
    } catch (error) {
      // Don't clear on error - user can retry
      console.error('Error uploading profile:', error);
    }
  };

  const _genders = useMemo(
    () => [...(unAuthenticated?.gender || []), {id: 0, name: t('profile.gender_not_identify')}],
    [unAuthenticated?.gender, t],
  );

  const normalizeValues = useCallback(values => {
    const v = values || {};
    const pick = obj => (obj && obj.id !== undefined ? {id: obj.id, name: obj.name} : null);
    return {
      first_name: v.first_name || '',
      last_name: v.last_name || '',
      other_name: v.other_name || '',
      phone: v.phone || '',
      dob: v.dob || '',
      postal_code: v.postal_code || '',
      address: v.address || '',
      gender: pick(v.gender),
      city: pick(v.city),
      state: pick(v.state),
      country: pick(v.country),
    };
  }, []);

  const form = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      other_name: user?.other_name || '',
      dob: formatDateOnly(user?.dob),

      phone: user?.phone || '',

      postal_code: user?.postal_code || '',
      address: user?.address || '',

      gender: user?.gender_id
        ? _genders?.find(gender => gender.id === user.gender_id) || null
        : null,
      city: user?.city_id
        ? unAuthenticated?.cities?.find(c => c.id === user.city_id) || null
        : null,
      state: user?.state_id
        ? unAuthenticated?.states?.find(s => s.id === user.state_id) || null
        : null,
      country: user?.country_id
        ? unAuthenticated?.countries?.find(c => c.id === user.country_id) ||
          {id: 1, name: 'Canada'}
        : {id: 1, name: 'Canada'},
    },
    validationSchema: _step3Schema,
    onSubmit,
  });

  useEffect(() => {
    const countryId = Number(form.values.country?.id || 1);
    setStates(
      unAuthenticated?.states?.filter(state => state.country_id === countryId) || [],
    );
  }, [unAuthenticated?.states, form.values.country?.id]);

  useEffect(() => {
    const stateId = Number(form.values.state?.id);
    if (!stateId) {
      setCities([]);
      return;
    }
    setCities(
      unAuthenticated?.cities?.filter(city => city.state_id === stateId) || [],
    );
  }, [unAuthenticated?.cities, form.values.state?.id]);

  // Load saved data on mount - always load if user exists (even new users in onboarding)
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingSavedData(true);
      const savedData = await loadStep3Data();
      if (savedData) {
        const updatedValues = {...form.values};
        Object.keys(savedData).forEach(key => {
          if (key === 'timestamp') return;
          const savedValue = savedData[key];
          if (savedValue !== undefined && savedValue !== null) {
            updatedValues[key] = savedValue;
          }
        });
        form.setValues(updatedValues, false);
        const normalizedString = JSON.stringify(normalizeValues(updatedValues));
        previousValuesRef.current = normalizedString;
        setTimeout(() => {
          if (savedData.phone !== undefined && savedData.phone !== null) {
            form.setFieldValue('phone', savedData.phone, false);
          }
          if (savedData.dob !== undefined && savedData.dob !== null) {
            form.setFieldValue('dob', savedData.dob, false);
          }
        }, 200);
        setTimeout(() => {
          if (savedData.phone !== undefined && savedData.phone !== null) {
            form.setFieldValue('phone', savedData.phone, false);
          }
          if (savedData.dob !== undefined && savedData.dob !== null) {
            form.setFieldValue('dob', savedData.dob, false);
          }
        }, 500);
      } else {
        previousValuesRef.current = JSON.stringify(normalizeValues(form.values));
      }
      setIsLoadingSavedData(false);
      hasLoadedInitialDataRef.current = true;
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.first_name, user?.last_name]);

  // Debounced save function - created once and reused
  const debouncedSaveRef = useRef(
    debounce(async formValues => {
      console.log('Step3: Actually saving to storage', formValues);
      await saveStep3Data(formValues);
    }, 500),
  );

  // Helper function to create a stable string representation of form values
  const getFormValuesString = useCallback(() => {
    // Create a normalized copy of form values for comparison
    return JSON.stringify(normalizeValues(form.values));
  }, [form.values, normalizeValues]);

  // Save form data when it changes (debounced)
  useEffect(() => {
    // Don't save if still loading initial data
    if (isLoadingSavedData || !hasLoadedInitialDataRef.current) {
      return;
    }

    // Get normalized string representation
    const currentValuesString = getFormValuesString();

    // Only save if values have actually changed
    if (previousValuesRef.current !== currentValuesString) {
      console.log('Step3: Form values changed, triggering save');
      previousValuesRef.current = currentValuesString;
      debouncedSaveRef.current(form.values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values, isLoadingSavedData, getFormValuesString]);

  // Reload saved data when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const savedData = await loadStep3Data();
        if (savedData) {
          const updatedValues = {...form.values};
          Object.keys(savedData).forEach(key => {
            if (key === 'timestamp') return;
            const savedValue = savedData[key];
            if (savedValue !== undefined && savedValue !== null) {
              updatedValues[key] = savedValue;
            }
          });
          form.setValues(updatedValues, false);
          previousValuesRef.current = JSON.stringify(normalizeValues(updatedValues));
          setTimeout(() => {
            if (savedData.phone !== undefined && savedData.phone !== null) {
              form.setFieldValue('phone', savedData.phone, false);
            }
            if (savedData.dob !== undefined && savedData.dob !== null) {
              form.setFieldValue('dob', savedData.dob, false);
            }
          }, 200);
        }
      };
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, normalizeValues]),
  );

  const addressQuery = useMemo(
    () => ({
      key: googleLocation.APIkey,
      language: 'en',
      components: 'country:ca',
    }),
    [],
  );

  useEffect(() => {
    const address = form.values.address || '';
    if (addressRef.current && typeof addressRef.current.setAddressText === 'function') {
      const current = typeof addressRef.current.getAddressText === 'function'
        ? addressRef.current.getAddressText()
        : null;
      if (current !== address) {
        addressRef.current.setAddressText(address);
      }
    }
    if (
      address &&
      addressRef.current?._textInput &&
      typeof addressRef.current._textInput.setNativeProps === 'function'
    ) {
      addressRef.current._textInput.setNativeProps({text: address});
    }
  }, [form.values.address]);

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <StepsTopbar active={4} />
      <KeyboardAvoidingView>
        <View style={styles.base}>
          <View>
            <TextInputField
              {...formHandler('first_name', form)}
              placeholder={t('profile.placeholder_first_name')}
              label={t('profile.label_first_name')}
              mainStyles={{width: '100%'}}
            />
            <TextInputField
              {...formHandler('other_name', form)}
              placeholder={t('profile.placeholder_other_name')}
              label={t('profile.label_other_name')}
              mainStyles={{width: '100%'}}
            />
            <TextInputField
              {...formHandler('last_name', form)}
              placeholder={t('profile.placeholder_last_name')}
              label={t('profile.label_last_name')}
              mainStyles={{width: '100%'}}
            />

            <TextInputField
              {...formHandler('phone', form)}
              onChangeText={text => {
                form.setFieldValue('phone', text);
                // Validate as user types
                validateCanadianPhone(text);
              }}
              onChangeCountry={({callingCode, cca2}) => {
                /* if (cca2 === 'NG') {
                  form.setValues({
                    ...form.values,
                    country: {id: 2, name: 'Nigeria'},
                    state: '',
                    city: '',
                    countryCode: cca2,
                    callingCode: callingCode[0],
                  });
                  setStates(
                    unAuthenticated.states?.filter(
                      state => state.country_id === Number(2),
                    ),
                  );
                  // form.setFieldValue('country', {id: 2, name: 'Nigeria'});
                } else */ //if (cca2 === 'CA') {
                form.setValues({
                  ...form.values,
                  country: {id: 1, name: 'Canada'},
                  state: null,
                  city: null,
                  countryCode: cca2,
                  callingCode: callingCode[0],
                });
                setStates(
                  unAuthenticated?.states?.filter(
                    state => state.country_id === Number(1),
                  ) || [],
                );
                // form.setFieldValue('country', {id: 1, name: 'Canada'});
                // }
                // form.setFieldValue('countryCode', cca2);
                // form.setFieldValue('callingCode', callingCode[0]);

                // Reset phone error when country changes
                setPhoneError('');
              }}
              type="phone"
              keyboardType="numeric"
              placeholder=""
              label={t('profile.label_phone_number')}
              error={phoneError || formHandler('phone', form).error}
            />

            <View style={styles.doubleSelect}>
              <Select
                disabled={true}
                {...formHandler('country', form)}
                onValueChange={(text, id) => {
                  /* if (text === 'Nigeria') {
                    form.setFieldValue('countryCode', 'NG');
                    form.setFieldValue('callingCode', '234');
                  } else */ if (text === 'Canada') {
                    form.setFieldValue('countryCode', 'CA');
                    form.setFieldValue('callingCode', '1');
                  }

                  form.setValues({
                    ...form.values,
                    country: {name: text, id},
                    state: null,
                    city: null,
                  });

                  setStates(
                    unAuthenticated?.states?.filter(
                      state => state.country_id === Number(id),
                    ) || [],
                  );
                }}
                styles={{width: '100%'}}
                label={t('profile.label_country')}
                list={(unAuthenticated?.countries || []).filter(c => c.id !== 2) /* Nigeria disabled */}
              />
            </View>
            <View style={styles.doubleSelect}>
              <SearchSelect
                {...formHandler('state', form)}
                disabled={!states?.length || !form.values.country?.id}
                onValueChange={(text, id) => {
                  form.setValues({
                    ...form.values,
                    state: {name: text, id},
                    city: null,
                  });
                  setCities(
                    unAuthenticated?.cities?.filter(
                      city => city.state_id === Number(id),
                    ) || [],
                  );
                }}
                styles={{width: '47%'}}
                label={
                  form.values.country?.id === 1
                    ? 'Province'
                    : form.values.country?.id === 2
                    ? 'State'
                    : 'Province/State'
                }
                list={states}
              />
              <SearchSelect
                {...formHandler('city', form)}
                disabled={
                  cities.length < 1 ||
                  !form.values.state?.id ||
                  !form.values.country?.id
                }
                onValueChange={(text, id) => {
                  form.setFieldValue('city', {name: text, id});
                }}
                styles={{width: '47%'}}
                label={
                  form.values.country?.id === 1
                    ? 'City/Town'
                    : form.values.country?.id === 2
                    ? 'City/Town'
                    : 'City/Town'
                }
                list={cities}
              />
            </View>
            <View style={{marginTop: 12}}>
              <Text
                fontType={'Roboto'}
                medium
                style={{fontSize: 12, marginBottom: 3}}>
                {t('step3.address_label')}
              </Text>
              <GooglePlacesAutocomplete
                ref={addressRef}
                placeholder={t('profile.placeholder_address')}
                textInputProps={{
                  defaultValue: form.values.address || undefined,
                  placeholderTextColor: '#ABAFB1',
                }}
                onPress={handleAddressSelected}
                styles={{
                  container: {
                    flex: 0,
                    zIndex: 99999,
                    position: 'relative',
                  },
                  textInputContainer: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    borderBottomWidth: 0,
                    paddingHorizontal: 0,
                    marginHorizontal: 0,
                    zIndex: 99999,
                  },
                  textInput: {
                    backgroundColor: 'transparent',
                    borderColor: formHandler('address', form).error
                      ? 'red'
                      : '#CFD3D4',
                    borderWidth: 0.8,
                    borderRadius: 8,
                    height: 52,
                    paddingHorizontal: 14,
                    color: '#323232',
                    fontSize: 14,
                    fontFamily: 'Roboto-Regular',
                  },
                  listView: {
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    marginTop: 4,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    maxHeight: 200,
                    zIndex: 100000,
                    position: 'absolute',
                    top: 56,
                    left: 0,
                    right: 0,
                  },
                  row: {
                    padding: 12,
                    minHeight: 44,
                  },
                  description: {
                    color: '#000',
                  },
                  predefinedPlacesDescription: {
                    color: '#000',
                  },
                }}
                onFail={err => {
                  console.warn('Google Places error:', err);
                }}
                fetchDetails={true}
                predefinedPlaces={[]}
                keyboardShouldPersistTaps="always"
                timeout={10000}
                query={addressQuery}
                debounce={300}
                minLength={2}
                enablePoweredByContainer={false}
                listViewDisplayed="auto"
                renderDescription={row => row.description}
                suppressDefaultStyles={false}
                enableHighAccuracyLocation={false}
                filterReverseGeocodingByTypes={[
                  'locality',
                  'administrative_area_level_3',
                ]}
                predefinedPlacesAlwaysVisible={false}
              />
              {formHandler('address', form).error && (
                <Text
                  notCapitalized
                  fontType={'roboto'}
                  style={{
                    marginTop: 2,
                    marginLeft: 4,
                    fontSize: 12,
                    color: 'red',
                  }}>
                  {formHandler('address', form).error}
                </Text>
              )}
            </View>
            <Select
              {...formHandler('gender', form)}
              onValueChange={(text, id) => {
                form.setFieldValue('gender', {name: text, id});
              }}
              styles={{width: '100%'}}
              label={t('profile2.label_gender')}
              list={_genders}
            />
            <View style={styles.doubleSelect}>
              <Datepicker
                maximumDate={
                  new Date(
                    new Date().getFullYear() - 18,
                    new Date().getMonth(),
                    new Date().getDate(),
                  )
                }
                label={t('profile.label_date_of_birth')}
                {...formHandler('dob', form)}
                mode={'date'}
                placeholder={t('home.placeholder_date')}
              />
              <TextInputField
                {...formHandler('postal_code', form)}
                onChangeText={async text => {
                  form.setFieldValue('postal_code', text);
                  // Validate as user types
                  await validateCanadianPostalCode(text);
                }}
                placeholder={t('profile.placeholder_postal_code')}
                label={t('profile.label_postal_code')}
                autoCapitalize="characters"
                error={
                  postalCodeError || formHandler('postal_code', form).error
                }
                mainStyles={{width: '47%'}}
              />
            </View>
          </View>
          <Button
            text={t('editBooking.submit')}
            disabled={(!user?.first_name && !form.dirty) || !form.isValid}
            pressed={form.handleSubmit}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          />
          <Button
            text={t('common.logout_and_come_back')}
            outline
            pressed={async () => {
              // Clear all form data on logout
              await clearStep3Data();
              dispatch(logOut());
            }}
            height={52}
            style={{width: '100%', marginBottom: 16}}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default Step3;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 18,
  },
  doubleSelect: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
