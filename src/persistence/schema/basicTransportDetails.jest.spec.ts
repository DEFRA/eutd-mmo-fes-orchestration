import * as BackEndModels from "./common"
import * as FrontEndModels from "./frontEndModels/export-location"

describe("When mapping basic transport details to a front end model", () => {
    it("will map the export location", async() => {
        const basicTransport : BackEndModels.BasicTransportDetails = {
            vehicle : "Truck",
            exportedFrom: "Isle Of Man",
            exportedTo: {
              officialCountryName: "SPAIN",
              isoCodeAlpha2: "A1",
              isoCodeAlpha3: "A3",
              isoNumericCode: "SP"
            }
        }

        const expectedResult : FrontEndModels.ExportLocation = {
            exportedFrom : "Isle Of Man",
            exportedTo : {
              officialCountryName: "SPAIN",
              isoCodeAlpha2: "A1",
              isoCodeAlpha3: "A3",
              isoNumericCode: "SP"
            }
        }

        const result = BackEndModels.toFrontEndExportLocation(basicTransport);

        expect(result).toStrictEqual(expectedResult);
    });

    it("will handle undefined exportedFrom and exportedTo", async() => {
        const expectedResult : FrontEndModels.ExportLocation = {
          exportedFrom : "",
          exportedTo: undefined
        }

        const result = BackEndModels.toFrontEndExportLocation(undefined);

        expect(result).toStrictEqual(expectedResult);
    });
});
