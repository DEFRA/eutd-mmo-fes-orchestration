import VesselLandingsRefresher from './vesselLandingsRefresher.service';
import { LandingsRefreshData } from './interfaces';
import { LandingStatus } from '../persistence/schema/frontEndModels/payload';

describe('getLandingsRefreshData', () => {

  it('will convert from LandingStatus[] to LandingsRefreshData[]', async() => {
    const input: LandingStatus[] = [
      {
        model: {
          id: 'test',
          vessel: {
            pln: 'A1234'
          },
          exportWeight: 50,
          dateLanded: '2019-09-08T00:00:00.000Z',
          isLegallyDue: true
        }
      }
    ] as LandingStatus[];

    const output: LandingsRefreshData[] = [
      {
        pln : 'A1234',
        isLegallyDue: true,
        dateLanded : '2019-09-08'
      }
    ]

    expect(VesselLandingsRefresher.getLandingsRefreshData(input)).toStrictEqual(output);
  });

  it('will not return landings that have an vesselOverriddenByAdmin flag', () => {
    const input: LandingStatus[] = [
      {
        model: {
          id: 'test',
          vessel: {
            pln: 'A1234'
          },
          exportWeight: 50,
          dateLanded: '2019-09-08T00:00:00.000Z',
          isLegallyDue: true
        }
      },
      {
        model: {
          id: 'test 2',
          vessel: {
            pln: 'B1234',
            vesselOverriddenByAdmin: true
          },
          exportWeight: 50,
          dateLanded: '2019-09-09T00:00:00.000Z'
        }
      }
    ] as LandingStatus[];

    const output: LandingsRefreshData[] = [
      {
        pln : 'A1234',
        isLegallyDue: true,
        dateLanded : '2019-09-08'
      }
    ]

    expect(VesselLandingsRefresher.getLandingsRefreshData(input)).toStrictEqual(output);
  });

});