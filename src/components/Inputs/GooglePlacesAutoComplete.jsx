import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../Shared/Text';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useTranslation} from 'react-i18next';

const API_KEY = 'AIzaSyDn0UxJc8Jvk-e_mAabhB1F_AQynS9y3g0';

// Uses fetch (new-arch compatible) instead of react-native-google-places-autocomplete
// which uses XMLHttpRequest (breaks on Android RN 0.84 new arch bridgeless)
const GooglePlacesInput = ({handleAddressChanged, bottomSheetRef, recentAddresses = []}) => {
  const {t} = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async text => {
    if (!text || text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(text)}` +
        `&key=${API_KEY}` +
        `&language=en` +
        `&components=country:ca` +
        `&types=address`;
      const res = await fetch(url);
      const json = await res.json();
      setResults(json.predictions ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = text => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 300);
  };

  const handleSelectPrediction = async item => {
    setQuery(item.description);
    setResults([]);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${item.place_id}` +
        `&key=${API_KEY}` +
        `&fields=geometry,address_components,formatted_address`;
      const res = await fetch(url);
      const json = await res.json();
      const loc = json.result?.geometry?.location;
      const state = json.result?.address_components?.find(c =>
        c.types.includes('administrative_area_level_1'),
      )?.long_name;
      handleAddressChanged({
        formatted_address: item.description,
        lat: loc?.lat,
        lng: loc?.lng,
        state,
      });
    } catch {
      handleAddressChanged({formatted_address: item.description});
    }
  };

  const handleRecentPress = addr => {
    setQuery(addr.formatted_address);
    setResults([]);
    handleAddressChanged(addr);
  };

  const showRecent = isFocused && query.length === 0 && recentAddresses.length > 0;
  const showResults = query.length >= 2 && results.length > 0;

  return (
    <Pressable
      style={{flex: 1, zIndex: 11}}
      onPress={() => {}}>
      <Text
        style={{fontSize: 24, paddingVertical: 8}}
        semibold
        center
        fontType={'roboto'}>
        {t('home2.search_your_location')}
      </Text>

      <View style={{zIndex: 12, flex: 1}}>
        {/* Search input */}
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={20} color="#211c5b" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('home2.search_placeholder')}
            placeholderTextColor="#888"
            value={query}
            onChangeText={handleChangeText}
            onFocus={() => {
              setIsFocused(true);
              if (bottomSheetRef?.current) {
                bottomSheetRef.current.snapToIndex(1);
              }
            }}
            onBlur={() => setIsFocused(false)}
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator size="small" color="#211c5b" style={{marginRight: 12}} />
          )}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} style={{marginRight: 12}}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Recent addresses */}
        {showRecent && (
          <View style={styles.listContainer}>
            <Text style={styles.sectionLabel}>{t('common.recent')}</Text>
            <FlatList
              data={recentAddresses}
              keyExtractor={(_, i) => `recent-${i}`}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => handleRecentPress(item)}
                  activeOpacity={0.7}
                  style={styles.row}>
                  <Ionicons name="time-outline" size={18} color="#888" />
                  <Text fontType={'roboto'} numberOfLines={1} style={styles.rowText}>
                    {item.formatted_address}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Search results */}
        {showResults && (
          <View style={styles.listContainer}>
            <FlatList
              data={results}
              keyExtractor={item => item.place_id}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => handleSelectPrediction(item)}
                  activeOpacity={0.7}
                  style={styles.row}>
                  <Ionicons name="location-outline" size={18} color="#211c5b" />
                  <Text fontType={'roboto'} numberOfLines={2} style={styles.rowText}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default GooglePlacesInput;

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 20,
    borderColor: '#211c5b',
    borderWidth: 0.7,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#000',
    fontSize: 15,
    fontFamily: 'Roboto-Regular',
  },
  listContainer: {
    marginHorizontal: 12,
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 7,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#888',
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 10,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#E8E8E8',
    marginLeft: 42,
  },
});
