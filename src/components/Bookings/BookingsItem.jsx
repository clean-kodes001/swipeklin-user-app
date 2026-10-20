import React, {useState} from 'react';
import Text from '../Shared/Text';
import {Alert, StyleSheet, View, Pressable, ScrollView, Image} from 'react-native';
import {colors} from '../../config/colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import DetailsPair from './DetailsPair';
import timeformatter, {calcTime} from '../../utils/timeformatter';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import AntDesign from '@react-native-vector-icons/ant-design';
import {logHelper} from '../../utils/logHelper';
import Button from '../Shared/Button';
import {updateBooking} from '../../store/actions/bookings/updateBooking';
import {deleteBooking} from '../../store/actions/bookings/deleteBooking';
import {cancelOccurrence} from '../../store/actions/bookings/cancelOccurrence';
import {retryOccurrence} from '../../store/actions/bookings/retryOccurrence';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {useTranslation} from 'react-i18next';

const BookingsItem = ({item, type}) => {
  const {t} = useTranslation();
  const {user} = useSelector(state => state.user);
  const {pending, pendingDelete, pendingCancel, pendingRetry} = useSelector(
    state => state.bookings,
  );
  const dispatch = useDispatch();
  const {authenticated: authenticatedData} = useSelector(state => state.data);
  const navigation = useNavigation();

  const renderImages = (uri, index) => {
    return (
      <Image key={index} source={{uri: uri}} style={{width: 90, height: 70}} />
    );
  };

  const handleActivate = status => {
    dispatch(
      updateBooking({
        data: {
          status: 1,
          clean_type_id: item?.clean_type_id,
          cleaners: item?.cleaners,
          bedrooms: item?.bedrooms,
          washrooms: item?.washrooms,
          kitchens: item?.kitchens,
          otherrooms: item?.otherrooms,
          livingrooms: item?.livingrooms,
          dinningrooms: item?.dinningrooms,
          laundryrooms: item?.laundryrooms,
          officerooms: item?.officerooms,
          extras: item.extras,
          type: item?.type,
          frequency: item?.frequency ?? 0,
          schedule_date: item?.schedule_date,
          occurrence: item?.occurrence,
        },
        id: item?.id,
      }),
    );
  };
  const handleDeactivate = status => {
    dispatch(
      updateBooking({
        data: {
          status: 0,
          clean_type_id: item?.clean_type_id,
          cleaners: item?.cleaners,
          bedrooms: item?.bedrooms,
          washrooms: item?.washrooms,
          kitchens: item?.kitchens,
          otherrooms: item?.otherrooms,
          livingrooms: item?.livingrooms,
          dinningrooms: item?.dinningrooms,
          laundryrooms: item?.laundryrooms,
          officerooms: item?.officerooms,
          extras: item.extras,
          type: item?.type,
          frequency: item?.frequency ?? 0,
          schedule_date: item?.schedule_date,
          occurrence: item?.occurrence,
        },
        id: item?.id,
      }),
    );
  };

  const handleCancelOccurrence = () => {
    // Name the exact date being cancelled so a repeat tap can't silently skip the
    // following occurrence (the double-skip bug). For an active re-occurring booking
    // `.next` is always present.
    const nextDate = item?.next_schedule_date?.next;
    Alert.alert(
      t('booking.cancel_dialog_title'),
      t('booking.cancel_dialog_message', {date: timeformatter(nextDate)}),
      [
        {text: t('booking.keep_it'), style: 'cancel'},
        {
          text: t('booking.this_occurrence_only'),
          onPress: () => dispatch(cancelOccurrence({id: item?.id})),
        },
        {
          text: t('booking.cancel_entire_series'),
          style: 'destructive',
          onPress: () => handleDeleteBookings(),
        },
      ],
    );
  };

  const handleEditBookings = () => {
    navigation.navigate('editbooking', {data: item});
  };

  const handleRetry = () => {
    Alert.alert(
      t('booking.retry_dialog_title'),
      t('booking.retry_dialog_message'),
      [
        {text: t('booking.keep_it'), style: 'cancel'},
        {
          text: t('common.retry_now'),
          onPress: () => dispatch(retryOccurrence({id: item?.id})),
        },
      ],
    );
  };

  const handleAddCard = () => {
    navigation.navigate('paymentmethod');
  };

  const handleDeleteBookings = () => {
    // ...item,
    dispatch(
      deleteBooking({
        data: {
          clean_type_id: item?.clean_type_id,
          cleaners: item?.cleaners,
          bedrooms: item?.bedrooms,
          washrooms: item?.washrooms,
          kitchens: item?.kitchens,
          otherrooms: item?.otherrooms,
          livingrooms: item?.livingrooms,
          dinningrooms: item?.dinningrooms,
          laundryrooms: item?.laundryrooms,
          officerooms: item?.officerooms,
          extras: item.extras,
          type: item?.type,
          status: 1,
          delete: true,
          frequency: item?.frequency ?? 0,
          schedule_date: item?.schedule_date,
          occurrence: item?.occurrence,
        },
        id: item?.id,
        navigation,
      }),
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Pressable
        disabled={type ? true : false}
        onPress={() => {
          navigation.navigate('bookingdetails', {item: item});
        }}
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
          <View>
            <Text
              numberOfLines={!type ? 1 : null}
              fontType={'roboto'}
              style={{
                fontSize: 16,
                //  color: '#161d29'
                marginBottom: 4,
              }}>
              {item?.location}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'left',
                alignItems: 'center',
              }}>
              <View
                style={{
                  backgroundColor:
                    item.status === 1
                      ? colors.activeFaded
                      : colors.inActiveFaded,
                  padding: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 8,
                  width: 80,
                }}>
                <Text
                  fontType={'roboto'}
                  style={{
                    width: 'auto',
                    fontSize: 12,
                    color: item.status === 1 ? colors.active : colors.inActive,
                  }}>
                  {item.status === 1
                    ? 'Active'
                    : item.status === 0
                    ? 'Disabled'
                    : ''}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.fadedText,
                  padding: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 8,
                  width: 100,
                  marginHorizontal: 10,
                }}>
                <Text
                  fontType={'roboto'}
                  style={{
                    width: 'auto',
                    fontSize: 12,
                    color: colors.textBlack,
                  }}>
                  {authenticatedData?.options?.frequencies?.find(
                    frequency => frequency.id === item?.frequency,
                  )?.name ?? 'One-Time'}
                </Text>
              </View>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {item?.country?.name}
              </Text>
            </View>
          </View>

          {type && item?.needs_attention ? (
            <View style={styles.attentionBanner}>
              <Text
                color={colors.orangeDark}
                fontType={'roboto'}
                style={styles.attentionBannerText}>
                {item?.last_failure_reason}
              </Text>
              <Button
                text={t('common.add_card')}
                pressed={handleAddCard}
                height={36}
                style={styles.attentionBannerButton}
              />
            </View>
          ) : (
            <></>
          )}

          {type ? (
            item.status === 0 ? (
              <>
                <Text
                  numberOfLines={!type ? 1 : null}
                  fontType={'roboto'}
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                  }}>{t('history.disabled_label')}{timeformatter(item?.updated_at)}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Button
                    loading={pending}
                    text={t('common.edit')}
                    pressed={handleEditBookings}
                    height={52}
                    style={{
                      width: '47%',
                      height: 45,
                      backgroundColor: colors.brandGreen,
                      borderRadius: 8,
                    }}
                  />
                  <Button
                    loading={pendingDelete}
                    text={t('common.delete')}
                    pressed={handleDeleteBookings}
                    height={52}
                    style={{
                      width: '47%',
                      height: 45,
                      backgroundColor: colors.brandSecondary,
                      borderRadius: 8,
                    }}
                  />
                </View>
                <Button
                  loading={pending}
                  text={t('common.activate')}
                  pressed={handleActivate}
                  height={52}
                  style={{
                    width: '100%',
                    height: 45,
                    backgroundColor: '#0CBC87',
                    borderRadius: 8,
                  }}
                />
              </>
            ) : item.status === 1 ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Button
                    loading={pending}
                    text={t('common.edit')}
                    pressed={handleEditBookings}
                    height={52}
                    style={{
                      width: '47%',
                      height: 45,
                      backgroundColor: colors.brandGreen,

                      borderRadius: 8,
                    }}
                  />
                  <Button
                    loading={pendingDelete}
                    text={t('common.delete')}
                    pressed={handleDeleteBookings}
                    height={52}
                    style={{
                      width: '47%',
                      height: 45,
                      backgroundColor: colors.brandSecondary,

                      borderRadius: 8,
                    }}
                  />
                </View>
                <Button
                  loading={pending}
                  text={t('common.deactivate')}
                  pressed={handleDeactivate}
                  height={52}
                  style={{
                    width: '100%',
                    height: 45,
                    backgroundColor: colors.brandPurple,
                    borderRadius: 8,
                  }}
                />
                {item?.occurrence === 1 && (
                  <Button
                    loading={pendingCancel}
                    disabled={pendingCancel}
                    text={t('common.cancel_occurrence')}
                    pressed={handleCancelOccurrence}
                    height={52}
                    style={{
                      width: '100%',
                      height: 45,
                      backgroundColor: colors.orangeDark,
                      borderRadius: 8,
                      marginTop: 8,
                    }}
                  />
                )}
                {item?.needs_attention && (
                  <Button
                    loading={pendingRetry}
                    disabled={pendingRetry}
                    text={t('common.retry_now')}
                    pressed={handleRetry}
                    height={52}
                    style={{
                      width: '100%',
                      height: 45,
                      backgroundColor: colors.active,
                      borderRadius: 8,
                      marginTop: 8,
                    }}
                  />
                )}
              </>
            ) : (
              <></>
            )
          ) : (
            <></>
          )}

          <View style={styles.DetailsPairInner}>
            <DetailsPair
              title={t('history.occurrence')}
              value={item?.occurrence === 1 ? t('history.re_occurring') : t('history.one_time')}
            />
            <DetailsPair title={t('history.duration')} value={calcTime(item?.duration)} />
          </View>
          <View style={styles.DetailsPairInner}>
            <DetailsPair
              title={t('history.price')}
              value={`${item?.country?.currency} ${Number(item?.amount).toFixed(
                2,
              )}`}
            />
            <DetailsPair
              title={t('history.creation_date')}
              value={timeformatter(item?.created_at)}
            />
          </View>
          {type === 2 && (
            <>
              <View style={styles.DetailsPairInner}>
                <DetailsPair
                  title={t('history.type_of_cleaning')}
                  value={item?.clean_type?.name}
                />
                <DetailsPair title={t('history.cleaners')} value={item.cleaners} />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair title={t('history.bedrooms')} value={item?.bedrooms} />
                <DetailsPair title={t('history.washrooms')} value={item?.washrooms} />
              </View>
              <View style={styles.DetailsPairInner}>
                <DetailsPair title={t('history.kitchens')} value={item?.kitchens} />
                <DetailsPair title={t('history.other_rooms')} value={item?.otherrooms} />
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
            </>
          )}
          <View style={[styles.DetailsPairInner]}>
            <DetailsPair
              title={t('history.next_clean')}
              value={
                item?.next_schedule_date?.next
                  ? timeformatter(item?.next_schedule_date?.next)
                  : 'Ended'
              }
            />
          </View>
          {type === 2 && item?.next_schedule_date?.next_more?.length > 0 && (
            <>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={styles.scheduleHeading}>
                {t('history.upcoming')}
              </Text>
              {item?.next_schedule_date?.next_more?.map((next, index) => (
                <View key={`upcoming-${index}`} style={styles.DetailsPairInner}>
                  <Text
                    color={'#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={styles.scheduleRowText}>
                    {timeformatter(next)}
                  </Text>
                </View>
              ))}
            </>
          )}
          {type === 2 && item?.next_schedule_date?.cancelled?.length > 0 && (
            <>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={styles.scheduleHeading}>
                {t('history.cancelled')}
              </Text>
              {item?.next_schedule_date?.cancelled?.map((cancelled, index) => (
                <View
                  key={`cancelled-${index}`}
                  style={[styles.DetailsPairInner, styles.cancelledRow]}>
                  <Text
                    color={'#9AA0A6'}
                    fontType={'roboto'}
                    style={styles.cancelledDate}>
                    {timeformatter(cancelled)}
                  </Text>
                  <View style={styles.cancelledBadge}>
                    <Text
                      color={'#C0392B'}
                      fontType={'roboto'}
                      style={styles.cancelledBadgeText}>
                      {`✕ ${t('history.cancelled_badge')}`}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
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
                style={{fontSize: 18, paddingHorizontal: 20}}>{t('documents.upload_label')}</Text>
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
                  style={{fontSize: 12, paddingHorizontal: 20}}>{t('history.no_images')}</Text>
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
                style={{fontSize: 18}}>{t('history.reviews')}</Text>
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
                        color={'#000'}
                        fontType={'roboto'}
                        style={{fontSize: 12}}>{t('history.no_review')}</Text>
                    );
                  })
                ) : (
                  <Text
                    color={'#000'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>{t('history.no_review')}</Text>
                )}
              </View>
            </View>
          </View>
        </>
      ) : (
        <></>
      )}
    </ScrollView>
  );
};

export default BookingsItem;

const styles = StyleSheet.create({
  DetailsPairInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleHeading: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  scheduleRowText: {
    fontSize: 16,
  },
  cancelledRow: {
    marginTop: 2,
  },
  cancelledDate: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  cancelledBadge: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cancelledBadgeText: {
    fontSize: 11,
  },
  attentionBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  attentionBannerText: {
    flex: 1,
    fontSize: 12,
  },
  attentionBannerButton: {
    width: 100,
    height: 36,
    backgroundColor: colors.orangeDark,
    borderRadius: 8,
  },
});
