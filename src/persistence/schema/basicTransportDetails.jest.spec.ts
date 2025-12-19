import * as CatchCertificateBackEndModels from "./catchCert";
import * as BackEndModels from "./common"
import * as CatchCertificateFrontEndModels from "./frontEndModels/catchCertificate";
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
          },
          pointOfDestination: "Barcelona Port Terminal"
        }

        const exportData: CatchCertificateBackEndModels.ExportData = {
          conservation: {
            conservationReference: '',
          },
          exporterDetails: {
            _dynamicsAddress: '',
            _dynamicsUser: '',
            addressOne: '',
            exporterCompanyName: '',
            exporterFullName: '',
            postcode: ''
          },
          products: [
            {
              speciesId: ''
            }
          ],
          transportation: basicTransport,
          pointOfDestination: "Barcelona Port Terminal"
        }

        const expectedResult : FrontEndModels.ExportLocation = {
            exportedFrom : "Isle Of Man",
            exportedTo : {
              officialCountryName: "SPAIN",
              isoCodeAlpha2: "A1",
              isoCodeAlpha3: "A3",
              isoNumericCode: "SP"
            },
            pointOfDestination: "Barcelona Port Terminal"
        }

        const result = CatchCertificateFrontEndModels.toFrontEndExportLocation(exportData);

        expect(result).toStrictEqual(expectedResult);
    });

    it("will handle undefined exportedFrom, exportedTo and pointOfDestination", async() => {
        const expectedResult : FrontEndModels.ExportLocation = {
          exportedFrom : "",
          exportedTo: undefined,
          pointOfDestination: undefined
        }

        const result = CatchCertificateFrontEndModels.toFrontEndExportLocation(undefined);

        expect(result).toStrictEqual(expectedResult);
    });

    it("will map the export location from exportData", async() => {
      const basicTransport : BackEndModels.BasicTransportDetails = {
        vehicle : "Truck",
        exportedFrom: "Isle Of Man",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        },
        pointOfDestination: "Lagos Port Complex"
      }

      const catchCertificateTransport: CatchCertificateBackEndModels.CatchCertificateBasicTransportDetails = {
        id: 0,
        vehicle: 'truck'
      }

      const exportData: CatchCertificateBackEndModels.ExportData = {
        conservation: {
          conservationReference: '',
        },
        exporterDetails: {
          _dynamicsAddress: '',
          _dynamicsUser: '',
          addressOne: '',
          exporterCompanyName: '',
          exporterFullName: '',
          postcode: ''
        },
        products: [
          {
            speciesId: ''
          }
        ],
        transportation: basicTransport,
        transportations: [catchCertificateTransport],
        exportedFrom: 'England',
        exportedTo: {
          officialCountryName: "NIGERIA",
          isoCodeAlpha2: "N1",
          isoCodeAlpha3: "N3",
          isoNumericCode: "NG"
        },
        pointOfDestination: "Lagos Port Complex"
      }

      const expectedResult : FrontEndModels.ExportLocation = {
          exportedFrom : "England",
          exportedTo : {
            officialCountryName: "NIGERIA",
            isoCodeAlpha2: "N1",
            isoCodeAlpha3: "N3",
            isoNumericCode: "NG"
          },
          pointOfDestination: "Lagos Port Complex"
      }

      const result = CatchCertificateFrontEndModels.toFrontEndExportLocation(exportData);

      expect(result).toStrictEqual(expectedResult);
  });
});
