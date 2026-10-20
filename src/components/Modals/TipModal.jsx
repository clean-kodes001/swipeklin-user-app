import React, {useState} from 'react';
import {ActivityIndicator, Pressable, TouchableOpacity, View} from 'react-native';
import Text from '../Shared/Text';
import {colors} from '../../config/colors';
import {useTranslation} from 'react-i18next';

const TIP_OPTIONS = [10, 15, 20];

const TipModal = ({cleanId, cleanAmount, currency, onDone}) => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);

  const formatAmount = pct =>
    `${currency} ${((cleanAmount * pct) / 100).toFixed(2)}`;

  const handleSelect = async pct => {
    setLoading(true);
    try {
      await onDone(pct);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={{
        zIndex: 100,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}>
      <View
        style={{
          backgroundColor: '#fff',
          width: '90%',
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 24,
          gap: 12,
        }}>
        <Text bold fontType={'roboto'} center style={{fontSize: 18}}>
          {t('tip.title')}
        </Text>
        <Text
          fontType={'roboto'}
          center
          style={{fontSize: 14, color: '#666', marginBottom: 4}}>
          {t('tip.subtitle')}
        </Text>

        {TIP_OPTIONS.map(pct => (
          <TouchableOpacity
            key={pct}
            disabled={loading}
            onPress={() => handleSelect(pct)}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
            }}>
            <Text bold style={{color: '#fff', fontSize: 16}}>
              {pct}% — {formatAmount(pct)}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          disabled={loading}
          onPress={() => handleSelect(null)}
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
          }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text fontType={'roboto'} style={{fontSize: 16, color: '#888'}}>
              {t('tip.no_tip')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

export default TipModal;
