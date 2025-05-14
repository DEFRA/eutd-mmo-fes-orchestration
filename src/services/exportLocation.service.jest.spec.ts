import ExportLocationService from "./exportLocation.service"
import * as CatchCertService from '../persistence/services/catchCert';
import * as StorageDocumentService from "../persistence/services/storageDoc";
import DocumentNumberService from "./documentNumber.service";
import ServiceNames from "../validators/interfaces/service.name.enum";
import * as ProcessingStatementService from "../persistence/services/processingStatement";
import { ExportLocation } from "../persistence/schema/frontEndModels/export-location";

describe("Export location service", () => {

  let mockGetExportLocationDataCC;
  let mockSaveExportLocationDataCC;
  let mockGetExportLocationDataSD;
  let mockSaveExportLocationDataSD;
  let mockGetExportLocationDataPS;
  let mockSaveExportLocationDataPS;
  let mockGetServiceNameFromDocumentNumber;

  const contactId = 'contactBob';
  const payload = {
    exportedFrom: 'United Kingdom',
  }

  beforeEach(() => {
    mockGetExportLocationDataCC = jest.spyOn(CatchCertService, 'getExportLocation');
    mockSaveExportLocationDataCC = jest.spyOn(CatchCertService, 'upsertExportLocation');
    mockGetExportLocationDataSD = jest.spyOn(StorageDocumentService, 'getExportLocation');
    mockSaveExportLocationDataSD = jest.spyOn(StorageDocumentService, 'upsertExportLocation');
    mockGetExportLocationDataPS = jest.spyOn(ProcessingStatementService, 'getExportLocation');
    mockSaveExportLocationDataPS = jest.spyOn(ProcessingStatementService, 'upsertExportLocation');
    mockGetServiceNameFromDocumentNumber = jest.spyOn(DocumentNumberService, 'getServiceNameFromDocumentNumber');
  });

  afterEach(() => {
    mockGetExportLocationDataCC.mockRestore();
    mockSaveExportLocationDataCC.mockRestore();
    mockGetExportLocationDataSD.mockRestore();
    mockSaveExportLocationDataSD.mockRestore();
    mockGetExportLocationDataPS.mockRestore();
    mockSaveExportLocationDataPS.mockRestore();
    mockGetServiceNameFromDocumentNumber.mockRestore();
  });

  it("Will add an CC export location", async () => {
    mockGetExportLocationDataCC.mockResolvedValue({});
    mockSaveExportLocationDataCC.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.CC);

    await ExportLocationService.addExportLocation("User 1", payload, 'GBR-344-4234234-2344', contactId);

    expect(mockGetExportLocationDataCC).toHaveBeenCalledWith('User 1', 'GBR-344-4234234-2344', contactId);
    expect(mockSaveExportLocationDataCC).toHaveBeenCalledWith("User 1", {"exportedFrom": "United Kingdom"}, 'GBR-344-4234234-2344', contactId);
  });

  it("Will not add an CC export location with an invalid exportedFrom", async () => {
    mockGetExportLocationDataCC.mockResolvedValue({});
    mockSaveExportLocationDataCC.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.CC);

    await expect(() => ExportLocationService.addExportLocation("User 1", { "exportedFrom": "Invalid" }, 'GBR-344-4234234-2344', contactId)).rejects.toThrow();
  });

  it("Will retrieve the CC export location from mongo", async () => {
      mockGetExportLocationDataCC.mockResolvedValue({});
      mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.CC);

      await ExportLocationService.get("User 1", undefined, contactId);

      expect(mockGetExportLocationDataCC).toHaveBeenCalledWith('User 1', undefined, contactId);
  });

  it("Will retrieve the CC export location from mongo with a document number", async () => {
    mockGetExportLocationDataCC.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.CC);

    await ExportLocationService.get("User 1", "GBR-3444-3453-3543", contactId);

    expect(mockGetExportLocationDataCC).toHaveBeenCalledWith('User 1', "GBR-3444-3453-3543", contactId);
  });

  it("Will not throw for PS export location with an invalid exportedFrom", async () => {
    mockGetExportLocationDataPS.mockResolvedValue({});
    mockSaveExportLocationDataPS.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.PS);

    const result = await ExportLocationService.addExportLocation("User 1", { "exportedFrom": "Invalid" }, 'GBR-344-4234234-2344', contactId);

    expect(result).toEqual({"exportedFrom": "Invalid", "exportedTo": undefined});
  });

  it("Will not throw for SD export location with an invalid exportedFrom", async () => {
    mockGetExportLocationDataSD.mockResolvedValue({});
    mockSaveExportLocationDataSD.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.SD);

    const result = await ExportLocationService.addExportLocation("User 1", { "exportedFrom": "Invalid" }, 'GBR-344-4234234-2344', contactId);

    expect(result).toEqual({"exportedFrom": "Invalid", "exportedTo": undefined});
  });

  it("Will retrieve the SD export location from mongo", async () => {
    mockGetExportLocationDataSD.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.SD);

    await ExportLocationService.get("User 1", undefined, contactId);

    expect(mockGetExportLocationDataSD).toHaveBeenCalledWith('User 1', undefined, 'contactBob');
  });

  it("Will retrieve the SD export location from mongo with a document number", async () => {
    mockGetExportLocationDataSD.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.SD);

    await ExportLocationService.get("User 1","GBR-3444-3453-3543", contactId);

    expect(mockGetExportLocationDataSD).toHaveBeenCalledWith('User 1', "GBR-3444-3453-3543", 'contactBob');
  });

  it("Will retrieve the PS export location from mongo", async () => {
    mockGetExportLocationDataPS.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.PS);

    await ExportLocationService.get("User 1", undefined, contactId);

    expect(mockGetExportLocationDataPS).toHaveBeenCalledWith('User 1', undefined, contactId);
  });

  it("Will retrieve the PS export location from mongo with a document number", async () => {
    mockGetExportLocationDataPS.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.PS);

    await ExportLocationService.get("User 1", "GBR-3444-3453-3543", contactId);

    expect(mockGetExportLocationDataPS).toHaveBeenCalledWith('User 1', "GBR-3444-3453-3543", contactId);
  });

  it("will save the  CC export location in mongo", async () => {
      mockSaveExportLocationDataCC.mockResolvedValue({});

      const exportLocation: ExportLocation = {
        exportedTo: {
          officialCountryName: 'France'
        }
      }

      await ExportLocationService.save("User 1", exportLocation, undefined, contactId);

      expect(mockSaveExportLocationDataCC).toHaveBeenCalledWith("User 1", exportLocation, undefined, contactId);
  });

  it("will save the  SD export location in mongo", async () => {
    mockSaveExportLocationDataSD.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.SD);

    const exportLocation: ExportLocation = {
      exportedTo: {
        officialCountryName: 'France'
      }
    }

    await ExportLocationService.save("User 1", exportLocation, undefined, contactId);

    expect(mockSaveExportLocationDataSD).toHaveBeenCalledWith("User 1", exportLocation, undefined, 'contactBob');
  });

  it("will save the  PS export location in mongo", async () => {
    mockSaveExportLocationDataPS.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.PS);

    const exportLocation: ExportLocation = {
      exportedTo: {
        officialCountryName: 'France'
      }
    }

    await ExportLocationService.save("User 1", exportLocation, undefined, contactId);

    expect(mockSaveExportLocationDataPS).toHaveBeenCalledWith("User 1", exportLocation, undefined, contactId);
  });

  it("will save the CC export location in mongo with document number", async () => {
    mockSaveExportLocationDataCC.mockResolvedValue({});
    mockGetServiceNameFromDocumentNumber.mockReturnValue(ServiceNames.CC);

    const exportLocation: ExportLocation = {
      exportedTo: {
        officialCountryName: 'France'
      }
    }

    await ExportLocationService.save("User 1", exportLocation, "GBR-3444-CC-3444-3533", contactId);

    expect(mockSaveExportLocationDataCC).toHaveBeenCalledWith("User 1", exportLocation, "GBR-3444-CC-3444-3533", contactId);
  });
});