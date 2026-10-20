import React, {useRef, useState} from 'react';
import Text from '../../components/Shared/Text';
import {
  Alert,
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import {colors} from '../../config/colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import DetailsPair from './DetailsPair';
import timeformatter, {calcTimeEst} from '../../utils/timeformatter';
import {useNavigation} from '@react-navigation/native';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {useTranslation} from 'react-i18next';
import FuntionButton from '../Buttons/FuntionButton';
import {generateReceipt} from '../../utils/generateReceipt';
import ReceiptView from './ReceiptView';

const HistoryItem = ({item, type}) => {
  const {t} = useTranslation();
  const [showAmends, setShowAmends] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const receiptRef = useRef(null);
  const navigation = useNavigation();

  const safeTime = value => {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const formatDateTime = value => {
    return safeTime(value) ? timeformatter(value, 'formal', true) : '-';
  };

  const cleanAmends = Array.isArray(item?.clean_amends)
    ? item.clean_amends
    : item?.clean_amend
    ? [item.clean_amend]
    : [];

  const latestAcceptedAmend = cleanAmends.reduce((acc, current) => {
    if (current?.status !== 1) {
      return acc;
    }
    if (!acc) {
      return current;
    }
    const currentTime = safeTime(current?.updated_at ?? current?.created_at);
    const accTime = safeTime(acc?.updated_at ?? acc?.created_at);
    return currentTime >= accTime ? current : acc;
  }, null);

  const effectiveRequest = latestAcceptedAmend ?? item;
  const hasPendingAmend = cleanAmends.some(amend => amend?.status === 0);
  const showInitialRequestAtBottom = Boolean(latestAcceptedAmend);
  const initialRequestMeta = {
    label: t('history.original_label'),
    color: colors.grayText,
    background: colors.inActiveFaded,
  };

  const requestCurrency =
    effectiveRequest?.country?.currency ?? item?.country?.currency ?? '';

  const amendStatusMeta = status => {
    if (status === 1) {
      return {
        label: t('history.amend_status_accepted'),
        color: colors.active,
        background: colors.activeFaded,
      };
    }
    if (status === 2) {
      return {
        label: t('history.amend_status_declined'),
        color: colors.danger,
        background: '#fdecef',
      };
    }
    return {
      label: t('history.amend_status_pending'),
      color: colors.orangeDark,
      background: '#fff3e8',
    };
  };

  const handleDisplayImages = currentIndex => {
    const _images = item?.images_link?.map(image => {
      return {
        uri: image,
      };
    });

    navigation.navigate('viewimages', {
      images: _images,
      type: 1,
      startIndex: currentIndex,
    });
  };

  const renderImages = (uri, index) => {
    return (
      <Pressable key={index} onPress={() => handleDisplayImages(index)}>
        <Image source={{uri: uri}} style={{width: 90, height: 70}} />
      </Pressable>
    );
  };

  const getCancellationStage = statusTime => {
    if (!statusTime) return null;
    if (statusTime.t4) return t('history.stage_during_cleaning');
    if (statusTime.t3) return t('history.stage_after_arrival');
    if (statusTime.t1) return t('history.stage_after_matching');
    return null;
  };

  const getTimeCleaning = (statusTime, updatedAt) => {
    const t4 = statusTime?.t4;
    if (!t4) return null;
    const t5 = statusTime?.t5;
    const start = new Date(t4);
    const end = new Date(t5 || updatedAt);
    const diffMs = Math.max(0, end - start);
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const cancelledStatuses = [5, 6, 9];
  const matchedCleaner = item?.clean_cleaners?.find(c => c?.status_time?.t1);
  const cancellationStage = cancelledStatuses.includes(item?.status)
    ? getCancellationStage(matchedCleaner?.status_time)
    : null;
  const cancellationTimeSpent =
    cancellationStage === t('history.stage_during_cleaning')
      ? getTimeCleaning(matchedCleaner?.status_time, item?.updated_at)
      : null;
  const cancelledBy =
    item?.cancelled_by === 'user'
      ? t('history.cancelled_by_user')
      : item?.cancelled_by === 'cleaner'
      ? t('history.cancelled_by_cleaner')
      : null;

  // On a cancelled clean `amount_charged` is the cancellation penalty, not the price of the
  // booking. Labelling it "Price Charged" is what made a cancelled job look as though the
  // full amount had been taken (BUG-019), so it moves into the cancellation card below and
  // says plainly when nothing was charged.
  const isCancelled = cancelledStatuses.includes(item?.status);
  // Three states, not two. A penalty we are still collecting is neither "charged" nor "no
  // charge" — saying "No charge" for two days and then taking the money is the same broken
  // promise this whole fix exists to remove.
  const cancellationPenalty =
    Number(item?.amount_charged) > 0
      ? `${item?.country?.currency} ${Number(item?.amount_charged).toFixed(2)}`
      : Number(item?.penalty_outstanding) > 0
      ? `${item?.country?.currency} ${Number(item?.penalty_outstanding).toFixed(2)} — ${t(
          'history.cancellation_penalty_pending',
        )}`
      : t('history.cancellation_penalty_none');

  const handleDownloadReceipt = async () => {
    setGeneratingReceipt(true);
    try {
      await generateReceipt(receiptRef, t);
    } catch {
      Alert.alert('', t('history.receipt_error'));
    } finally {
      setGeneratingReceipt(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Pressable
        disabled={type ? true : false}
        onPress={() => {
          navigation.navigate('historydetails', {item: item});
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          backgroundColor: '#fff',
          paddingVertical: 20,
          paddingHorizontal: 20,
          borderRadius: 12,
          marginTop: 12,
        }}>
        <View
          style={{
            display: 'flex',
            flex: 1,
            gap: 12,
          }}>
          <View>
            {type === 2 && (
              <Text
                color={'#000'}
                bold
                fontType={'roboto'}
                style={{fontSize: 18, paddingBottom: 20}}>
                {t('history.request_details')}
              </Text>
            )}
            <Text
              numberOfLines={!type ? 1 : null}
              fontType={'roboto'}
              style={{
                fontSize: 16,
                //  color: '#161d29'
                marginBottom: 4,
              }}>
              {effectiveRequest?.location ?? item?.location}
            </Text>

            <View
              style={{
                backgroundColor:
                  item.status === 1 ? colors.activeFaded : colors.inActiveFaded,
                padding: 4,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                width: 120,
              }}>
              <Text
                fontType={'roboto'}
                style={{
                  width: 'auto',
                  fontSize: 12,
                  color: item.status === 1 ? colors.active : colors.inActive,
                }}>
                {item.status === 1
                  ? t('history.status_active')
                  : item.status === 2
                  ? t('history.status_inactive')
                  : item.status === 3
                  ? t('history.status_arrived')
                  : item.status === 4
                  ? t('history.status_started')
                  : item.status === 5 || item.status === 6 || item.status === 12
                  ? t('history.status_cancelled')
                  : item.status === 7
                  ? t('history.status_ended')
                  : item.status === 8
                  ? t('history.status_no_cleaner_found')
                  : item.status === 9
                  ? t('history.status_declined')
                  : item.status === 10
                  ? t('history.status_ended')
                  : item.status === 11
                  ? t('history.status_amended')
                  : t('history.status_pending')}
              </Text>
            </View>
            {type === 2 && hasPendingAmend ? (
              <View
                style={{
                  marginTop: 8,
                  alignSelf: 'flex-start',
                  backgroundColor: '#fff3e8',
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                }}>
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 12,
                    color: colors.orangeDark,
                  }}>
                  {t('historyItem.pending_amendment')}
                </Text>
              </View>
            ) : (
              <></>
            )}
          </View>
          <View style={styles.DetailsPairInner}>
            {/* <DetailsPair
              title={t('history.occurrence')}
              value={item?.occrence ? t('history.re_occurring') : t('history.one_time')}
            /> */}
            {/* <DetailsPair
              title={t('history.duration')}
              value={calcTimeEst(effectiveRequest?.duration ?? item?.duration)}
            /> */}
          </View>
          <View style={styles.DetailsPairInner}>
            <DetailsPair
              title={t('history.price_tax_inclusive')}
              value={`${requestCurrency} ${Number(
                effectiveRequest?.amount ?? item?.amount ?? 0,
              ).toFixed(2)}`}
            />
            {Number(item?.amount_charged) > 0 && item?.status !== 8 && !isCancelled && (
              <DetailsPair
                title={t('history.price_charged')}
                value={`${item?.country?.currency} ${Number(
                  item?.amount_charged,
                ).toFixed(2)}`}
              />
            )}
            {Number(item?.tip_amount) > 0 && (
              <DetailsPair
                title={t('history.tip')}
                value={`${item?.country?.currency} ${Number(
                  item?.tip_amount,
                ).toFixed(2)}`}
              />
            )}
          </View>
          {type === 2 && (
            <>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.type_of_cleaning')}
                  value={
                    effectiveRequest?.clean_type?.name ?? item?.clean_type?.name
                  }
                />
                <DetailsPair
                  title={t('history.cleaners')}
                  value={effectiveRequest?.cleaners ?? item?.cleaners}
                />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.bedrooms')}
                  value={effectiveRequest?.bedrooms ?? item?.bedrooms}
                />
                <DetailsPair
                  title={t('history.washrooms')}
                  value={effectiveRequest?.washrooms ?? item?.washrooms}
                />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.kitchens')}
                  value={effectiveRequest?.kitchens ?? item?.kitchens}
                />
                <DetailsPair
                  title={t('history.other_rooms')}
                  value={effectiveRequest?.otherrooms ?? item?.otherrooms}
                />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.living_rooms')}
                  value={effectiveRequest?.livingrooms ?? item?.livingrooms}
                />
                <DetailsPair
                  title={t('history.dinning_rooms')}
                  value={effectiveRequest?.dinningrooms ?? item?.dinningrooms}
                />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.laundry_rooms')}
                  value={effectiveRequest?.laundryrooms ?? item?.laundryrooms}
                />
                <DetailsPair
                  title={t('history.office_den_rooms')}
                  value={effectiveRequest?.officerooms ?? item?.officerooms}
                />
              </View>
            </>
          )}
          <View style={styles.DetailsPairInner}>
            <DetailsPair
              title={t('history.creation_date')}
              value={timeformatter(item?.created_at)}
            />
          </View>
        </View>
        {!type ? (
          <MaterialCommunityIcons
            name="chevron-right"
            color={'#444'}
            size={26}
          />
        ) : (
          <></>
        )}
      </Pressable>
      {type === 2 ? (
        <>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#fff',
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 12,
              marginTop: 12,
            }}>
            <View
              style={{
                display: 'flex',
                flex: 1,
                gap: 12,
              }}>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.extras_fridge')}
                  value={
                    effectiveRequest?.extras?.refridgerator ??
                    item?.extras?.refridgerator
                  }
                />
                <DetailsPair
                  title={t('history.extras_stove')}
                  value={effectiveRequest?.extras?.stove ?? item?.extras?.stove}
                />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.extras_dishwasher')}
                  value={
                    effectiveRequest?.extras?.dish_washer ??
                    item?.extras?.dish_washer
                  }
                />
                <DetailsPair
                  title={t('history.extras_microwave')}
                  value={
                    effectiveRequest?.extras?.microwave ??
                    item?.extras?.microwave
                  }
                />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.occurrence')}
                  value={
                    item?.occrence
                      ? t('history.re_occurring')
                      : t('history.one_time')
                  }
                />
              </View>

              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.notes')}
                  value={effectiveRequest?.notes ?? item?.notes}
                />
              </View>
            </View>
          </View>

          {cancellationStage != null && cancelledBy != null && (
            <View
              style={{
                width: '100%',
                backgroundColor: '#fdecef',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
                gap: 12,
              }}>
              <Text
                color={'#c0392b'}
                bold
                fontType={'roboto'}
                style={{fontSize: 16}}>
                {t('history.cancellation_stage')}
              </Text>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.cancelled_by')}
                  value={cancelledBy}
                />
                <DetailsPair
                  title={t('history.cancellation_stage')}
                  value={cancellationStage}
                />
              </View>
              <View style={styles.DetailsPairInner}>
                {cancellationTimeSpent != null ? (
                  <DetailsPair
                    title={t('history.time_cleaning')}
                    value={cancellationTimeSpent}
                  />
                ) : (
                  <View style={{flex: 1}} />
                )}
                <DetailsPair
                  title={t('history.cancellation_penalty')}
                  value={cancellationPenalty}
                />
              </View>
            </View>
          )}

          <View
            style={{
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: 12,
              marginTop: 12,
              overflow: 'hidden',
            }}>
            <Pressable
              onPress={() => setShowAmends(prev => !prev)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Text
                  color={'#000'}
                  bold
                  fontType={'roboto'}
                  style={{fontSize: 18}}>
                  {t('history.amendments_heading')} ({cleanAmends.length})
                </Text>
                {cleanAmends.some(amend => amend?.status === 0) ? (
                  <View
                    style={{
                      backgroundColor: '#fff3e8',
                      paddingVertical: 2,
                      paddingHorizontal: 8,
                      borderRadius: 999,
                    }}>
                    <Text
                      fontType={'roboto'}
                      style={{fontSize: 12, color: colors.orangeDark}}>
                      {t('historyItem.pending')}
                    </Text>
                  </View>
                ) : (
                  <></>
                )}
              </View>
              <MaterialCommunityIcons
                name={showAmends ? 'chevron-up' : 'chevron-down'}
                color={'#444'}
                size={26}
              />
            </Pressable>

            {showAmends ? (
              <View style={{paddingHorizontal: 20, paddingBottom: 16}}>
                {cleanAmends.length < 1 ? (
                  <Text
                    color={'#000'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>
                    {t('historyItem.no_amendments')}
                  </Text>
                ) : (
                  <>
                    {showInitialRequestAtBottom ? (
                      <View
                        style={{
                          marginTop: 12,
                          borderWidth: 1,
                          borderColor: colors.borderColor,
                          borderRadius: 12,
                          padding: 12,
                          backgroundColor: '#fff',
                        }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10,
                          }}>
                          <Text
                            color={'#000'}
                            bold
                            fontType={'roboto'}
                            style={{fontSize: 14}}>
                            {t('history.initial_request')}
                          </Text>
                          <View
                            style={{
                              backgroundColor: initialRequestMeta.background,
                              paddingVertical: 4,
                              paddingHorizontal: 10,
                              borderRadius: 999,
                            }}>
                            <Text
                              fontType={'roboto'}
                              style={{
                                fontSize: 12,
                                color: initialRequestMeta.color,
                              }}>
                              {initialRequestMeta.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.created')}
                            value={formatDateTime(item?.created_at)}
                          />
                          <DetailsPair
                            title={t('history.updated')}
                            value={formatDateTime(item?.updated_at)}
                          />
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.duration')}
                            value={calcTimeEst(item?.duration)}
                          />
                          <DetailsPair
                            title={t('history.price')}
                            value={`${item?.country?.currency ?? ''} ${Number(
                              item?.amount ?? 0,
                            ).toFixed(2)}`}
                          />
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.bedrooms')}
                            value={item?.bedrooms}
                          />
                          <DetailsPair
                            title={t('history.washrooms')}
                            value={item?.washrooms}
                          />
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.kitchens')}
                            value={item?.kitchens}
                          />
                          <DetailsPair
                            title={t('history.other_rooms')}
                            value={item?.otherrooms}
                          />
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.living_rooms')}
                            value={item?.livingrooms}
                          />
                          <DetailsPair
                            title={t('history.dinning_rooms')}
                            value={item?.dinningrooms}
                          />
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.laundry_rooms')}
                            value={item?.laundryrooms}
                          />
                          <DetailsPair
                            title={t('history.office_den_rooms')}
                            value={item?.officerooms}
                          />
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.extras_fridge')}
                            value={item?.extras?.refridgerator}
                          />
                          <DetailsPair
                            title={t('history.extras_stove')}
                            value={item?.extras?.stove}
                          />
                        </View>

                        <View style={styles.DetailsPairInner}>
                          <DetailsPair
                            title={t('history.extras_dishwasher')}
                            value={item?.extras?.dish_washer}
                          />
                          <DetailsPair
                            title={t('history.extras_microwave')}
                            value={item?.extras?.microwave}
                          />
                        </View>

                        {item?.ammendment_comment ? (
                          <View style={{marginTop: 10}}>
                            <DetailsPair
                              title={t('history.comment')}
                              value={item?.ammendment_comment}
                            />
                          </View>
                        ) : (
                          <></>
                        )}
                      </View>
                    ) : (
                      <></>
                    )}

                    {[...cleanAmends]
                      .sort((a, b) => {
                        const aTime = new Date(
                          a?.created_at || a?.updated_at || 0,
                        ).getTime();
                        const bTime = new Date(
                          b?.created_at || b?.updated_at || 0,
                        ).getTime();
                        return aTime - bTime;
                      })
                      .map((amend, index) => {
                        const meta = amendStatusMeta(amend?.status);
                        const amendCurrency =
                          amend?.country?.currency ??
                          item?.country?.currency ??
                          '';
                        return (
                          <View
                            key={amend?.id ?? index}
                            style={{
                              marginTop:
                                index === 0
                                  ? showInitialRequestAtBottom
                                    ? 12
                                    : 0
                                  : 12,
                              borderWidth: 1,
                              borderColor: colors.borderColor,
                              borderRadius: 12,
                              padding: 12,
                              backgroundColor: '#fff',
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                              }}>
                              <Text
                                color={'#000'}
                                bold
                                fontType={'roboto'}
                                style={{fontSize: 14}}>
                                {t('history.amend_number')}
                                {index + 1}
                              </Text>
                              <View
                                style={{
                                  backgroundColor: meta.background,
                                  paddingVertical: 4,
                                  paddingHorizontal: 10,
                                  borderRadius: 999,
                                }}>
                                <Text
                                  fontType={'roboto'}
                                  style={{fontSize: 12, color: meta.color}}>
                                  {meta.label}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.created')}
                                value={formatDateTime(amend?.created_at)}
                              />
                              <DetailsPair
                                title={t('history.updated')}
                                value={formatDateTime(amend?.updated_at)}
                              />
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.duration')}
                                value={calcTimeEst(amend?.duration)}
                              />
                              <DetailsPair
                                title={t('history.price')}
                                value={`${amendCurrency} ${Number(
                                  amend?.amount ?? 0,
                                ).toFixed(2)}`}
                              />
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.bedrooms')}
                                value={amend?.bedrooms}
                              />
                              <DetailsPair
                                title={t('history.washrooms')}
                                value={amend?.washrooms}
                              />
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.kitchens')}
                                value={amend?.kitchens}
                              />
                              <DetailsPair
                                title={t('history.other_rooms')}
                                value={amend?.otherrooms}
                              />
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.living_rooms')}
                                value={amend?.livingrooms}
                              />
                              <DetailsPair
                                title={t('history.dinning_rooms')}
                                value={amend?.dinningrooms}
                              />
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.laundry_rooms')}
                                value={amend?.laundryrooms}
                              />
                              <DetailsPair
                                title={t('history.office_den_rooms')}
                                value={amend?.officerooms}
                              />
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.extras_fridge')}
                                value={amend?.extras?.refridgerator}
                              />
                              <DetailsPair
                                title={t('history.extras_stove')}
                                value={amend?.extras?.stove}
                              />
                            </View>

                            <View style={styles.DetailsPairInner}>
                              <DetailsPair
                                title={t('history.extras_dishwasher')}
                                value={amend?.extras?.dish_washer}
                              />
                              <DetailsPair
                                title={t('history.extras_microwave')}
                                value={amend?.extras?.microwave}
                              />
                            </View>

                            {amend?.ammendment_comment ? (
                              <View style={{marginTop: 10}}>
                                <DetailsPair
                                  title={t('history.comment')}
                                  value={amend?.ammendment_comment}
                                />
                              </View>
                            ) : (
                              <></>
                            )}
                          </View>
                        );
                      })}
                  </>
                )}
              </View>
            ) : (
              <></>
            )}
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#fff',
              paddingVertical: 16,

              borderRadius: 12,
              marginTop: 12,
            }}>
            <View
              style={{
                display: 'flex',
                flex: 1,
                gap: 12,
              }}>
              <Text
                color={'#000'}
                bold
                fontType={'roboto'}
                style={{fontSize: 18, paddingHorizontal: 20}}>
                {t('history.property_images')}
              </Text>
              {item?.images_link && item?.images_link?.length > 0 ? (
                <ScrollView
                  showsHorizontalScrollIndicator={false}
                  horizontal
                  contentContainerStyle={{
                    gap: 12,
                    paddingHorizontal: 16,
                  }}>
                  {item?.images_link.map(renderImages)}
                </ScrollView>
              ) : (
                <Text
                  color={'#000'}
                  fontType={'roboto'}
                  style={{fontSize: 12, paddingHorizontal: 20}}>
                  {t('history.no_images')}
                </Text>
              )}
            </View>
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#fff',
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 12,
              marginTop: 12,
            }}>
            <View
              style={{
                display: 'flex',

                flex: 1,
                gap: 8,
              }}>
              <Text
                color={'#000'}
                bold
                fontType={'roboto'}
                style={{fontSize: 18}}>
                {t('history.reviews')}
              </Text>
              <View>
                {item?.clean_cleaners ? (
                  item?.clean_cleaners?.map((cleanCleaner, index) => {
                    const review = cleanCleaner?.review;
                    const user = cleanCleaner?.user;
                    return review ? (
                      <View key={index}>
                        <Text bold style={{fontSize: 26}}>
                          {review?.rating}.0
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 2,
                            marginBottom: 4,
                            alignItems: 'center',
                          }}>
                          {[1, 2, 3, 4, 5].map(index => (
                            <View key={index}>
                              <FontAwesome
                                style={{color: '#F8C22E'}}
                                name={
                                  index <= review?.rating ? 'star' : 'star-o'
                                }
                                size={24}
                              />
                            </View>
                          ))}
                        </View>
                        <View>
                          {review?.comment ? (
                            <Text
                              color={'#333'}
                              fontType={'roboto'}
                              style={{fontSize: 14}}>
                              {review?.comment}
                            </Text>
                          ) : (
                            <></>
                          )}
                          <Text
                            capitalized
                            color={'#333'}
                            fontType={'roboto'}
                            style={{fontSize: 14, marginVertical: 2}}>
                            {user?.name}
                          </Text>

                          <Text
                            color={'#333'}
                            fontType={'roboto'}
                            style={{fontSize: 12}}>
                            {review?.created_at}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text
                        key={index}
                        color={'#000'}
                        fontType={'roboto'}
                        style={{fontSize: 12}}>
                        {t('history.no_review')}
                      </Text>
                    );
                  })
                ) : (
                  <Text
                    color={'#000'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>
                    {t('history.no_review')}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.receiptOffscreen}>
            <ReceiptView
              ref={receiptRef}
              item={item}
              effectiveRequest={effectiveRequest}
              t={t}
            />
          </View>
          <View style={{paddingVertical: 8, paddingBottom: 24}}>
            <FuntionButton
              name={
                generatingReceipt
                  ? t('history.generating_receipt')
                  : t('history.download_receipt')
              }
              loading={generatingReceipt}
              disabled={generatingReceipt}
              onPress={handleDownloadReceipt}
              style={{width: '100%', alignSelf: 'center'}}
            />
          </View>
        </>
      ) : (
        <></>
      )}
    </ScrollView>
  );
};

export default HistoryItem;

const styles = StyleSheet.create({
  DetailsPairInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptOffscreen: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
});
