const moment = require('moment');
import * as referenceDataService from '../services/reference-data.service';
import { LandingStatus } from '../persistence/schema/frontEndModels/payload';
import { LandingsRefreshData } from './interfaces';

export default class VesselLandingsRefresher {

  public static refresh = async (landing: LandingsRefreshData): Promise<void> =>
    referenceDataService.refreshLandings(landing);

  static getLandingsRefreshData(landings: LandingStatus[]): LandingsRefreshData[] {
    return landings.reduce((landingsRefreshData: LandingsRefreshData[], { model }) =>
      model.vessel.vesselOverriddenByAdmin
        ? landingsRefreshData : [...landingsRefreshData, {
          pln: model.vessel.pln,
          dateLanded: moment(model.dateLanded).format('YYYY-MM-DD'),
          isLegallyDue: model.isLegallyDue
        }], []);
  }

}
