import moment from 'moment-timezone';


export class TimeSeries {
  city_ibge_code?: number;
  date?: moment.Moment;
  confirmeddiff?: number;
  deathsdiff?: number;
  is_last: boolean
}
