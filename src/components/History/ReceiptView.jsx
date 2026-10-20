import React, {forwardRef} from 'react';
import {Dimensions, Image, StyleSheet, Text, View} from 'react-native';

const logo = require('../../assets/media/logo/swipekin-logo.png');

const WIDTH = Dimensions.get('window').width;

const Divider = () => <View style={styles.divider} />;

const SectionTitle = ({children}) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

const Row = ({label, value, valueStyle}) =>
  value ? (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  ) : null;

const ReceiptView = forwardRef(({item, effectiveRequest, t}, ref) => {
  const completedCleaner = item?.clean_cleaners?.find(c => c?.status_time?.t7);
  const currency = item?.country?.currency ?? '';

  // Price breakdown. `amount` is the agreed tax-inclusive price; the state's
  // `tax` is the percentage applied, so we invert it to recover base + tax.
  const taxRate = Number(item?.state?.tax ?? 0);
  const totalPrice = Number(effectiveRequest?.amount ?? item?.amount ?? 0);
  const basePrice = taxRate > 0 ? totalPrice / (1 + taxRate / 100) : totalPrice;
  const taxAmount = totalPrice - basePrice;

  // Actual money moved through Stripe (payments − refunds). Usually equals the
  // total price, but can differ for amendments/penalties — shown only then.
  const charged = Number(item?.amount_charged ?? 0);
  const showCharged = charged > 0 && Math.abs(charged - totalPrice) > 0.01;

  // Tip is a separate charge — shown on its own line, never folded into totals.
  const tip = Number(item?.tip_amount ?? 0);

  const generatedDate = new Date().toLocaleDateString();

  const paymentStatus = () => {
    const s = item?.status;
    if (s === 7 || s === 10) return t('history.receipt_paid');
    if (s === 5 || s === 6 || s === 9) return t('history.receipt_cancelled');
    return t('history.receipt_pending');
  };

  const rooms = [
    {label: t('history.bedrooms'), value: effectiveRequest?.bedrooms ?? item?.bedrooms},
    {label: t('history.washrooms'), value: effectiveRequest?.washrooms ?? item?.washrooms},
    {label: t('history.kitchens'), value: effectiveRequest?.kitchens ?? item?.kitchens},
    {label: t('history.other_rooms'), value: effectiveRequest?.otherrooms ?? item?.otherrooms},
    {label: t('history.living_rooms'), value: effectiveRequest?.livingrooms ?? item?.livingrooms},
    {label: t('history.dinning_rooms'), value: effectiveRequest?.dinningrooms ?? item?.dinningrooms},
    {label: t('history.laundry_rooms'), value: effectiveRequest?.laundryrooms ?? item?.laundryrooms},
    {label: t('history.office_den_rooms'), value: effectiveRequest?.officerooms ?? item?.officerooms},
  ].filter(r => Number(r.value) > 0);

  const extras = [
    effectiveRequest?.extras?.refridgerator && t('history.extras_fridge'),
    effectiveRequest?.extras?.stove && t('history.extras_stove'),
    effectiveRequest?.extras?.dish_washer && t('history.extras_dishwasher'),
    effectiveRequest?.extras?.microwave && t('history.extras_microwave'),
  ].filter(Boolean);

  return (
    <View ref={ref} collapsable={false} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.receiptTitle}>{t('history.receipt_title')}</Text>
      </View>

      {/* Meta */}
      <View style={styles.section}>
        <Row label={t('history.receipt_generated')} value={generatedDate} />
        <Row
          label={t('history.receipt_reference')}
          value={item?.id ?? '—'}
          valueStyle={styles.refValue}
        />
      </View>

      <Divider />

      {/* Service */}
      <View style={styles.section}>
        <SectionTitle>{t('history.request_details')}</SectionTitle>
        <Row
          label={t('history.receipt_service_type')}
          value={effectiveRequest?.clean_type?.name ?? item?.clean_type?.name ?? '—'}
        />
        <Row label={t('home.location_label')} value={item?.location ?? '—'} />
        <Row
          label={t('history.receipt_cleaner')}
          value={completedCleaner?.user?.name ?? '—'}
        />
      </View>

      <Divider />

      {/* Rooms */}
      {rooms.length > 0 && (
        <>
          <View style={styles.section}>
            <SectionTitle>{t('history.receipt_rooms')}</SectionTitle>
            {rooms.map((r, i) => (
              <Row key={i} label={r.label} value={String(r.value)} />
            ))}
          </View>
          <Divider />
        </>
      )}

      {/* Extras */}
      {extras.length > 0 && (
        <>
          <View style={styles.section}>
            <SectionTitle>{t('history.receipt_extras')}</SectionTitle>
            <Text style={styles.extrasText}>{extras.join(', ')}</Text>
          </View>
          <Divider />
        </>
      )}

      {/* Payment */}
      <View style={styles.section}>
        <SectionTitle>{t('payment.title')}</SectionTitle>
        <Row
          label={t('history.receipt_base_price')}
          value={`${currency} ${basePrice.toFixed(2)}`}
        />
        <Row
          label={
            taxRate > 0
              ? `${t('history.receipt_tax')} (${taxRate}%)`
              : t('history.receipt_tax')
          }
          value={`${currency} ${taxAmount.toFixed(2)}`}
        />
        <Row
          label={t('history.receipt_total_price')}
          value={`${currency} ${totalPrice.toFixed(2)}`}
          valueStyle={styles.amountValue}
        />
        {showCharged && (
          <Row
            label={t('history.receipt_amount_charged')}
            value={`${currency} ${charged.toFixed(2)}`}
          />
        )}
        {tip > 0 && (
          <Row
            label={t('history.tip')}
            value={`${currency} ${tip.toFixed(2)}`}
          />
        )}
        <Row label={t('history.receipt_payment_status')} value={paymentStatus()} />
      </View>

      {/* Notes */}
      {!!item?.notes && (
        <>
          <Divider />
          <View style={styles.section}>
            <SectionTitle>{t('history.receipt_notes')}</SectionTitle>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>SwipeKlin — swipeklin.com</Text>
      </View>
    </View>
  );
});

export default ReceiptView;

const BRAND = '#5143d9';

const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: BRAND,
    paddingBottom: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 56,
    marginBottom: 4,
  },
  receiptTitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  refValue: {
    fontSize: 10,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginVertical: 4,
  },
  extrasText: {
    fontSize: 13,
    color: '#333',
  },
  notes: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerLine: {
    height: 1,
    backgroundColor: '#e8e8e8',
    width: '100%',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#aaa',
  },
});
