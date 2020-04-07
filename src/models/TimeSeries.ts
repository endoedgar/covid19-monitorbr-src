import moment from 'moment-timezone';


export class TimeSeries {
  city_ibge_code?: number;
  date?: moment.Moment;
  estimated_population: number;
  confirmed?: number;
  deaths?: number;
  confirmeddiff?: number;
  deathsdiff?: number;
  is_last: boolean
}
