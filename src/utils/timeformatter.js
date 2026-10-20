import {parseDateOnly} from './dateOnly';

const timeformatter = (date, type, withTime, timeComesFirst) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const _date = new Date(date);
  const _month = months[_date.getMonth()];
  const getDate = _date.getDate();
  const getHours = _date.getHours();
  const getMinutes = _date.getMinutes();
  const getMonth = (_date.getMonth()+1);
  const getFullYear = _date.getFullYear();
  const getTime = _date.getTime();
  const getDateStr = _date.toDateString();

  const _day =
    getDate > 3
      ? `${getDate}th`
      : getDate === 3
      ? '3rd'
      : getDate === 2
      ? '2nd'
      : getDate === 1
      ? '1st'
      : null;

  const _time = `${addzero(getHours % 12 === 0 ? 12 : getHours % 12)}:${addzero(
    getMinutes,
  )} ${getHours >= 12 ? 'PM' : 'AM'}`;
  const _time24 = `${addzero(getHours)}:${addzero(getMinutes)}`;

  if (type === 'time_only') {
    return _time;
  } else if (type === 'time24') {
    return _time24;
  } else if (type === 'date_only') {
    return `${getFullYear}-${getMonth?.toString()?.padStart(2, '0')}-${getDate?.toString()?.padStart(2, '0')}`;
  } else if (type === 'formal') {
    let time = `${_month?.slice(0, 3)} ${getDate}, ${getFullYear}`;
    if (withTime === true) {
      time = timeComesFirst ? `${_time}, ${time}` : `${time}, ${_time}`;
    } else {
      time = `${time}`;
    }
    return time;
    // new Date().getTime() / (1000 * 60 * 60).toFixed(1) -
    //         getTime / (1000 * 60 * 60).toFixed(1) <=
    //       24

    // new Date().getTime() / (1000 * 60 * 60).toFixed(1) -
    //       getTime / (1000 * 60 * 60).toFixed(1) <=
    //     24
  } else {
    let time =
      (new Date().toDateString() === getDateStr)
        ? 'Today at ' + _time
        : (new Date(new Date().setDate(new Date().getDate()-1)).toDateString() === getDateStr)
        ? 'Yesterday at ' + _time
        : (new Date() < _date)
        ? `${_day} ${_month} ${getFullYear} at ${_time}`
        : `${_day} ${_month} ${getFullYear} at ${_time}`;
        
    if (withTime === true) {
      // time = `${time}, ${_time}`;
      time =
        (new Date().toDateString() === getDateStr)
          ? 'Today at ' + _time
          : (new Date(new Date().setDate(new Date().getDate()-1)).toDateString() === getDateStr)
          ? 'Yesterday at ' + _time
          : timeComesFirst
          ? `${_time}, ${_day} ${_month} ${getFullYear}`
          : `${_day} ${_month} ${getFullYear} at ${_time}`;
    }

    return time;
  }
};

const addzero = number => {
  return number < 10 ? `0${number}` : number;
};

export const combineTimeAndDate = (date, time) => {
  // parseDateOnly resolves the calendar day in LOCAL time: a plain 'YYYY-MM-DD' string
  // (what the date picker emits) is read component-wise so it is not shifted a day by
  // UTC parsing; a Date or ISO datetime resolves to the instant's local day.
  const _date = parseDateOnly(date) || new Date();
  const year = _date.getFullYear();
  const month = _date.getMonth();
  const day = _date.getDate();

  // Resolve the time. 'HH:MM' (what the time picker emits) is split directly; a Date
  // object or ISO datetime string uses local getters; missing time defaults to 1 PM.
  let hours = 13;
  let minutes = 0;
  if (!time) {
    hours = 13;
    minutes = 0;
  } else if (typeof time === 'string' && /^\d{1,2}:\d{2}$/.test(time)) {
    const parts = time.split(':');
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
  } else {
    const _time = new Date(time);
    hours = _time.getHours();
    minutes = _time.getMinutes();
  }

  return new Date(year, month, day, hours, minutes);
};

export default timeformatter;

const getMins = min => {
  return min % 60;
};
const getHours = sec => {
  return sec / 60;
};

export const calcTime = sec => {
  const hours = Number.parseInt(getHours(sec));
  const mins = getMins(sec);
  return hours < 1 ? `${mins} minutes` : `${hours} hour(s) ${mins} minutes`;
};

export const calcTimeEst = sec => {
  const hours = Number.parseInt(getHours(sec));
  const mins = getMins(sec);
  return hours >= 3 ? `${hours} - ${hours + 2} hours` : `1 - 3 hours`;
};

