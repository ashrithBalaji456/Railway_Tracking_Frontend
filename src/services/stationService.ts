import api from './api';

export const stationService = {
  getLiveStationBoard: (stationCode: string, hours: number, refresh = false) => {
    const url = `/api/stations/${stationCode}/live?hours=${hours}${refresh ? '&refresh=true' : ''}`;
    return api.get(url);
  },
  getStationTrains: (stationCode: string, type: string, refresh = false) => {
    const url = `/api/v1/stations/${stationCode}/trains?type=${type}${refresh ? '&refresh=true' : ''}`;
    return api.get(url);
  }
};
