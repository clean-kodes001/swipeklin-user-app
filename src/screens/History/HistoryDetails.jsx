import React from 'react';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {View} from 'react-native';
import Head from '../../components/Shared/Head';
import {useNavigation} from '@react-navigation/native';
import HistoryItem from '../../components/History/HistoryItem';
import {useTranslation} from 'react-i18next';

const HistoryDetails = ({route}) => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {item} = route.params;
  return (
    <ScreenContainer style={{flex: 1, padding: 12}}>
      <Head navigation={navigation} pageTitle={t('history.history_details')} type={2} />
      <View style={{flex: 1}}>
        <HistoryItem type={2} item={item} />
      </View>
    </ScreenContainer>
  );
};

export default HistoryDetails;
