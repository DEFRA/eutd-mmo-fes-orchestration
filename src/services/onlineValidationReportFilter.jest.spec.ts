import { IOnlineValidationReportItem } from '../persistence/schema/onlineValidationReport'
import ValidationFilterService from './onlineValidationReportFilter'

describe('The online validation report filter', () => {

    const filterService = new ValidationFilterService();

    it('will return all errors if everything is blocked', async () => {
        const is3CBlockOn = true;
        const is3DBlockOn = true;
        const is4ABlockOn = true;
        const isBlockingNoDataSubmittedOn = true;
        const isBlockingNoLicenceHolderOn = true;
        const onlineReport : IOnlineValidationReportItem[] = [{
            failures : ["3C","3D","4A"],
            state: "test",
            species: "test",
            presentation: "test",
            vessel: "test",
            date: new Date("2019-11-25")
        }]
        const result = filterService.filterOnlineValidationReport(
          is3CBlockOn,
          is3DBlockOn,
          is4ABlockOn,
          isBlockingNoDataSubmittedOn,
          isBlockingNoLicenceHolderOn,
          onlineReport);

        expect(result.length).toEqual(1)
    });

    it('will return only the reports for which the blocking is switched on', async () => {
        const is3CBlockOn = true;
        const is3DBlockOn = false;
        const is4ABlockOn = false;
        const isBlockingNoDataSubmittedOn = false;
        const isBlockingNoLicenceHolderOn = true;
        const onlineReport : IOnlineValidationReportItem[] = [{
            failures : ["3C", "3D"],
            state: "test",
            species: "test",
            presentation: "test",
            vessel: "test",
            date: new Date("2019-11-25")
        },{
            failures : ["4A", "3D"],
            state: "test2",
            species: "test2",
            presentation: "test2",
            vessel: "test",
            date: new Date("2019-11-25")
        }]
        const result = filterService.filterOnlineValidationReport(
          is3CBlockOn,
          is3DBlockOn,
          is4ABlockOn,
          isBlockingNoDataSubmittedOn,
          isBlockingNoLicenceHolderOn,
          onlineReport
        )

        expect(result.length).toEqual(1)
    });

    it('will return only the report failures for which the blocking is switched on', async () => {
        const is3CBlockOn = true;
        const is3DBlockOn = false;
        const is4ABlockOn = false;
        const isBlockingNoDataSubmittedOn  = false;
        const isBlockingNoLicenceHolderOn = false;
        const onlineReport : IOnlineValidationReportItem[] = [{
            failures : ["3C", "3D", "noDataSubmitted", "noLicenceHolder"],
            state: "test",
            species: "test",
            presentation: "test",
            vessel: "test",
            date: new Date("2019-11-25")
        },{
            failures : ["4A", "3D"],
            state: "test2",
            species: "test2",
            presentation: "test2",
            vessel: "test",
            date: new Date("2019-11-25")
        }]
        const result = filterService.filterOnlineValidationReport(
          is3CBlockOn,
          is3DBlockOn,
          is4ABlockOn,
          isBlockingNoDataSubmittedOn,
          isBlockingNoLicenceHolderOn,
          onlineReport
        );
        expect(result[0].failures.length).toEqual(1)
    });

    it('will return an empty array if all the blocking is switched off', async() => {
        const is3CBlockOn = false;
        const is3DBlockOn = false;
        const is4ABlockOn = false;
        const isBlockingNoDataSubmittedOn = false;
        const isBlockingNoLicenceHolderOn = false;
        const onlineReport : IOnlineValidationReportItem[] = [{
            failures : ["3C", "3D", "noDataSubmitted", "noLicenceHolder"],
            state: "test",
            species: "test",
            presentation: "test",
            vessel: "test",
            date: new Date("2019-11-25")
        },{
            failures : ["4A", "3D"],
            state: "test2",
            species: "test2",
            presentation: "test2",
            vessel: "test",
            date: new Date("2019-11-25")
        }]
        const result = filterService.filterOnlineValidationReport(
          is3CBlockOn,
          is3DBlockOn,
          is4ABlockOn,
          isBlockingNoDataSubmittedOn,
          isBlockingNoLicenceHolderOn,
          onlineReport
        );

        expect(result).toEqual([])
    });

    it('will work when the data is more complex', async() => {
        const is3CBlockOn = false;
        const is3DBlockOn = true;
        const is4ABlockOn = true;
        const isBlockingNoDataSubmittedOn = true;
        const isBlockingNoLicenceHolderOn = true;
        const onlineReport : IOnlineValidationReportItem[] = [{
            failures : ["3C", "3D", "4A"],
            state: "test",
            species: "test",
            presentation: "test",
            vessel: "test",
            date: new Date("2019-11-25")
        },{
            failures : ["4A", "3D"],
            state: "test2",
            species: "test2",
            presentation: "test2",
            vessel: "test",
            date: new Date("2019-11-25")
        },{
            failures : [],
            state: "test2",
            species: "test2",
            presentation: "test2",
            vessel: "test",
            date: new Date("2019-11-25")
        },{
            failures : ["3C"],
            state: "test2",
            species: "test2",
            presentation: "test2",
            vessel: "test",
            date: new Date("2019-11-25")
        },{
          failures : ["noDataSubmitted"],
          state: "test3",
          species: "test3",
          presentation: "test3",
          vessel: "test",
          date: new Date("2019-11-26")
      },{
        failures : ["noLicenceHolder"],
        state: "test4",
        species: "test4",
        presentation: "test4",
        vessel: "test",
        date: new Date("2022-11-26")
    }]
        const result = filterService.filterOnlineValidationReport(
          is3CBlockOn,
          is3DBlockOn,
          is4ABlockOn,
          isBlockingNoDataSubmittedOn,
          isBlockingNoLicenceHolderOn,
          onlineReport);

        expect(result.length).toEqual(4)
        expect(result[0].failures).toEqual(['3D', '4A'])
        expect(result[1].failures).toEqual(['4A', '3D'])
        expect(result[2].failures).toEqual(['noDataSubmitted'])
        expect(result[3].failures).toEqual(['noLicenceHolder'])
    });

});
