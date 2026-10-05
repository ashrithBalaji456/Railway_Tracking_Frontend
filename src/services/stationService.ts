import api from './api';

export const stationService = {
  getLiveStationBoard: (stationCode: string, hours: number) => {
    return api.get(`/api/stations/${stationCode}/live?hours=${hours}`);
  }
};
