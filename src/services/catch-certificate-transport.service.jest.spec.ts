import { CatchCertificate, LandingsEntryOptions, CatchCertificateTransport as BackEndCatchCertificateTransport, AddTransportation } from "../persistence/schema/catchCert";
import { CatchCertificateTransport } from "../persistence/schema/frontEndModels/catchCertificateTransport";
import SUT from "./catch-certificate-transport.service";
import * as Service from "../persistence/services/catchCert";

const USER_ID = 'Bob';
const DOCUMENT_NUMBER = 'GBR-2025-CC-0123456789';
const contactId = 'contactId';
const catchCertificate: CatchCertificate = {
  documentNumber: "GBR-2020-CC-E0DE238CB",
  createdAt: "05 Feb 2020",
  createdBy: "User Id to be done",
  createdByEmail: "User email to be done",
  draftData: {},
  requestByAdmin: true,
  exportData: {
    products: [
      {
        species: "test-species-label",
        speciesId: "test-product-id",
        speciesCode: "test-species-code",
        commodityCode: "test-commodityCode",
        state: {
          code: "test-state-code",
          name: "test-state-label"
        },
        presentation: {
          code: "test-presentation-code",
          name: "test-presentation-label"
        },
        caughtBy: [
          {
            vessel: "test-vesselName",
            pln: "test-pln",
            id: "test-id",
            date: "2020-02-04",
            weight: 150,
            faoArea: "test-fao",
            numberOfSubmissions: 0
          }
        ]
      }
    ],
    addTransportation: AddTransportation.Yes,
    transportation: {
      vehicle: "truck",
      nationalityOfVehicle: "adsf",
      registrationNumber: "asdsfsd",
      departurePlace: "Aylesbury",
      exportedFrom: "United Kingdom"
    },
    transportations: [{
      id: 0,
      vehicle: "truck",
      nationalityOfVehicle: "adsf",
      registrationNumber: "asdsfsd",
      departurePlace: "Aylesbury",
    }, {
      id: 1,
      vehicle: 'train',
    }],
    exportedFrom: "United Kingdom",
    conservation: {
      conservationReference: "UK Fisheries Policy, Common Fisheries Policy, dsf"
    },
    exporterDetails: {
      contactId: 'a contact Id',
      accountId: 'an account id',
      exporterFullName: "Mr. Robot",
      exporterCompanyName: "FSociety",
      addressOne: '123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road',
      buildingNumber: '123',
      subBuildingName: 'Unit 1',
      buildingName: 'CJC Fish Ltd',
      streetName: '17  Old Edinburgh Road',
      county: 'West Midlands',
      country: 'England',
      townCity: "Nuevo Jamon",
      postcode: "NE1 0HI",
      _dynamicsAddress: {},
      _dynamicsUser: {
        firstName: "John",
        lastName: "Doe"
      }
    },
    landingsEntryOption: LandingsEntryOptions.ManualEntry
  },
  status: "DRAFT",
  documentUri: "",
  userReference: ''
}

describe('CatchCertificateTransportService - addTransport', () => {
  const transport: CatchCertificateTransport = {
    id: '0',
    vehicle: 'truck',
    nationalityOfVehicle: 'UK',
    registrationNumber: 'BA078',
    departurePlace: 'Hull'
  };

  let mockUpsertDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockUpsertDraftData = jest.spyOn(Service, 'upsertDraftData');
    mockUpsertDraftData.mockResolvedValue(undefined);
  })

  afterEach(() => {
    mockUpsertDraftData.mockRestore();
  })

  it('should upsert a single transportation', async () => {
    const expected: BackEndCatchCertificateTransport = {
      id: 0,
      vehicle: 'truck',
      nationalityOfVehicle: 'UK',
      registrationNumber: 'BA078',
      departurePlace: 'Hull'
    };

    const res = await SUT.addTransport(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', { '$push': { 'exportData.transportations': expected } }, 'contactId')
  });

  it('should throw an error if upsertDraftData fails to upsert', async () => {
    mockUpsertDraftData.mockRejectedValue(new Error('something has gone wrong'));
    await expect(() => SUT.addTransport(transport, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  });
});

describe('CatchCertificateTransport - getTransport', () => {

  let mockGetDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(Service, 'getDraft');
    mockGetDraftData.mockResolvedValue(catchCertificate);
  })

  afterEach(() => {
    mockGetDraftData.mockRestore();
  })

  it('will return a single transportation', async () => {
    const expectedResult: CatchCertificateTransport = {
      id: '0',
      vehicle: "truck",
      nationalityOfVehicle: "adsf",
      registrationNumber: "asdsfsd",
      departurePlace: "Aylesbury",
    }

    const result = await SUT.getTransport(0, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toEqual(expectedResult);
  });

  it('will null for a missing catch certificate', async () => {
    mockGetDraftData.mockResolvedValue(undefined);

    const result = await SUT.getTransport(0, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toBeNull();
  });

  it('will null for a missing transport', async () => {
    const result = await SUT.getTransport(2, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toBeNull();
  });

  it('will return null when transportation is undefined', async () => {
    const mockCatchCertificate: CatchCertificate = {
      ...catchCertificate,
      exportData: {
        ...catchCertificate.exportData,
        transportations: undefined
      }
    }
    mockGetDraftData.mockResolvedValue(mockCatchCertificate);

    const result = await SUT.getTransport(0, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toBeNull();
  });
});

describe('CatchCertificateTransport - addTransportation', () => {

  let mockGetDraftData: jest.SpyInstance;
  let mockUpsertDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(Service, 'getDraft');
    mockGetDraftData.mockResolvedValue(catchCertificate);

    mockUpsertDraftData = jest.spyOn(Service, 'upsertDraftData');
    mockUpsertDraftData.mockResolvedValue(undefined);
  })

  afterEach(() => {
    mockGetDraftData.mockRestore();
    mockUpsertDraftData.mockRestore();
  })

  it('will return a single transportation check response', async () => {
    const result = await SUT.getTransportCheck(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toEqual({ addTransportation: 'yes' });
  });

  it('will return undefined', async () => {
    mockGetDraftData.mockResolvedValue({ ...catchCertificate, exportData: { ...catchCertificate.exportData, addTransportation: undefined } });
    const result = await SUT.getTransportCheck(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result.addTransportation).toBeUndefined();
  });

  it('will return undefined when export data is empty', async () => {
    mockGetDraftData.mockResolvedValue({ ...catchCertificate, exportData: undefined });
    const result = await SUT.getTransportCheck(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result.addTransportation).toBeUndefined();
  });


  it('should update a single transportation check', async () => {
    const transport: AddTransportation = AddTransportation.Yes;
    const res = await SUT.addTransportCheck(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', {
      '$set': {
        'exportData.addTransportation': transport
      }
    }, 'contactId');
  });
});

describe('CatchCertificateTransport - getTransportDetails', () => {

  let mockGetDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(Service, 'getDraft');
    mockGetDraftData.mockResolvedValue(catchCertificate);
  })

  afterEach(() => {
    mockGetDraftData.mockRestore();
  })

  it('will return a the last transportation', async () => {
    const expectedResult: CatchCertificateTransport = {
      id: "0",
      vehicle: "truck",
      nationalityOfVehicle: "adsf",
      registrationNumber: "asdsfsd",
      departurePlace: "Aylesbury",
    }

    const result = await SUT.getTransportationDetails(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toEqual(expectedResult);
  });

  it('will null for a missing catch certificate', async () => {
    mockGetDraftData.mockResolvedValue({ ...catchCertificate, exportData: { ...catchCertificate.exportData, transportations: [], transportation: undefined } });

    const result = await SUT.getTransportationDetails(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toBeNull();
  });

  it('will a direct landing catch certificate', async () => {
    mockGetDraftData.mockResolvedValue({ ...catchCertificate, exportData: { ...catchCertificate.exportData, transportation: { vehicle: 'directLanding' }, transportations: [] } });

    const result = await SUT.getTransportationDetails(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toEqual({
      vehicle: "directLanding",
    });
  });

});

describe('CatchCertificateTransport - getTransportations', () => {

  let mockGetDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(Service, 'getDraft');
    mockGetDraftData.mockResolvedValue(catchCertificate);
  })

  afterEach(() => {
    mockGetDraftData.mockRestore();
  })

  it('will return a single transportation', async () => {
    const expectedResult: CatchCertificateTransport = {
      id: '0',
      vehicle: "truck",
      nationalityOfVehicle: "adsf",
      registrationNumber: "asdsfsd",
      departurePlace: "Aylesbury",
    }

    const result = await SUT.getTransportations(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toEqual([expectedResult, {
      id: '1',
      vehicle: 'train',
    }]);
  });

  it('will get return an empty array for older documents with no transportations', async () => {
    mockGetDraftData.mockResolvedValue({ ...catchCertificate, exportData: { ...catchCertificate.exportData, transportations: undefined } });

    const result = await SUT.getTransportations(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', 'contactId');
    expect(result).toEqual([]);
  });

});

describe('CatchCertificateTransportService - updateTransport', () => {

  let mockGetDraftData: jest.SpyInstance;
  let mockUpsertDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(Service, 'getDraft');
    mockGetDraftData.mockResolvedValue(catchCertificate);

    mockUpsertDraftData = jest.spyOn(Service, 'upsertDraftData');
    mockUpsertDraftData.mockResolvedValue(undefined);
  })

  afterEach(() => {
    mockGetDraftData.mockRestore();
    mockUpsertDraftData.mockRestore();
  })

  it('should update a single transportation', async () => {
    const expected: BackEndCatchCertificateTransport = {
      id: 1,
      vehicle: 'train',
      railwayBillNumber: '1223',
      departurePlace: 'Hull'
    }

    const transport: CatchCertificateTransport = {
      id: "1",
      vehicle: 'train',
      railwayBillNumber: '1223',
      departurePlace: 'Hull'
    }
    const res = await SUT.updateTransport(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', {
      '$set': {
        'exportData.transportations': [{
          id: 0,
          vehicle: "truck",
          nationalityOfVehicle: "adsf",
          registrationNumber: "asdsfsd",
          departurePlace: "Aylesbury",
        }, expected]
      }
    }, 'contactId');
  });

  it('should not update a single transportation', async () => {
    const transport: CatchCertificateTransport = {
      id: '3',
      vehicle: 'train',
      railwayBillNumber: '1223',
      departurePlace: 'Hull'

    }
    const res = await SUT.updateTransport(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).not.toHaveBeenCalled();
  });

  it('should not update a single transportation with no export data', async () => {
    mockGetDraftData.mockResolvedValue(undefined);

    const transport: CatchCertificateTransport = {
      id: '3',
      vehicle: 'train',
      railwayBillNumber: '1223',
      departurePlace: 'Hull'

    }
    const res = await SUT.updateTransport(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).not.toHaveBeenCalled();
  });

  it('should update a single transportation with updated transportation', async () => {

    const transport: CatchCertificateTransport = {
      id: '1',
      vehicle: 'train',
      documents: [{ name: 'name', reference: 'reference' }]
    }
    const res = await SUT.updateTransportDocuments(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', {
      '$set': {
        'exportData.transportations.1.transportDocuments': [{ name: 'name', reference: 'reference' }]
      }
    }, 'contactId');
  });

  it('should retain documents for existing transportation when updated', async () => {
    mockGetDraftData.mockResolvedValue({
      ...catchCertificate,
      exportData: {
        ...catchCertificate.exportData,
        // add a transport with some existing documents
        transportations: [{
          id: 0,
          vehicle: "truck",
          nationalityOfVehicle: "adsf",
          registrationNumber: "asdsfsd",
          departurePlace: "Aylesbury",
          transportDocuments: [{
            name: 'truck doc 1',
            reference: 'TRK00001'
          }, {
            name: 'truck doc 2',
            reference: 'TRK0002'
          }]
        }]
      }
    });

    const expected: BackEndCatchCertificateTransport = {
      id: 0,
      vehicle: "truck",
      nationalityOfVehicle: 'British',
      transportDocuments: [{
        name: 'truck doc 1',
        reference: 'TRK00001'
      }, {
        name: 'truck doc 2',
        reference: 'TRK0002'
      }]
    }

    const transport: CatchCertificateTransport = {
      id: "0",
      vehicle: 'truck',
      nationalityOfVehicle: "British", // switch from adsf to British
    }
    const res = await SUT.updateTransport(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', {
      '$set': {
        'exportData.transportations': [expected],
      }
    }, 'contactId');
  })

  it('should clear documents for existing transportation when vehicle type is changed', async () => {
    mockGetDraftData.mockResolvedValue({
      ...catchCertificate,
      exportData: {
        ...catchCertificate.exportData,
        // add a transport with some existing documents
        transportations: [{
          id: 0,
          vehicle: "truck",
          nationalityOfVehicle: "adsf",
          registrationNumber: "asdsfsd",
          departurePlace: "Aylesbury",
          transportDocuments: [{
            name: 'truck doc 1',
            reference: 'TRK00001'
          }, {
            name: 'truck doc 2',
            reference: 'TRK0002'
          }]
        }]
      }
    });

    const expected: BackEndCatchCertificateTransport = {
      id: 0,
      vehicle: "train",
      transportDocuments: []
    }

    const transport: CatchCertificateTransport = {
      id: "0",
      vehicle: "train", // switch vehicle from 'truck' to 'train'
    }
    const res = await SUT.updateTransport(transport, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(res).toEqual(transport);
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', {
      '$set': {
        'exportData.transportations': [expected],
      }
    }, 'contactId');
  })
});

describe('CatchCertificateTransportService - removeTransportations', () => {

  let mockUpsertDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockUpsertDraftData = jest.spyOn(Service, 'upsertDraftData');
    mockUpsertDraftData.mockResolvedValue(undefined);
  })

  afterEach(() => {
    mockUpsertDraftData.mockRestore();
  })

  it('should remove all transportations', async () => {
    await SUT.removeTransportations(USER_ID, DOCUMENT_NUMBER, contactId);

    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', {
      '$unset': {
        'exportData.transportations': []
      }
    }, 'contactId');
  });
});

describe('CatchCertificateTransportService - removeTransportation', () => {

  let mockGetDraftData: jest.SpyInstance;
  let mockUpsertDraftData: jest.SpyInstance;

  beforeEach(() => {
    mockGetDraftData = jest.spyOn(Service, 'getDraft');
    mockGetDraftData.mockResolvedValue(catchCertificate);

    mockUpsertDraftData = jest.spyOn(Service, 'upsertDraftData');
    mockUpsertDraftData.mockResolvedValue(undefined);
  })

  afterEach(() => {
    mockGetDraftData.mockRestore();
    mockUpsertDraftData.mockRestore();
  })

  it('should remove a specific transportation', async () => {
    await SUT.removeTransportation(0, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(mockGetDraftData).toHaveBeenCalled();
    expect(mockUpsertDraftData).toHaveBeenCalledWith('Bob', 'GBR-2025-CC-0123456789', {
      '$set': {
        'exportData.transportations': [{ id: 1, vehicle: 'train' }]
      }
    }, 'contactId');
  });

  it('should remove any transportations', async () => {
    await SUT.removeTransportation(-1, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(mockGetDraftData).toHaveBeenCalled();
    expect(mockUpsertDraftData).not.toHaveBeenCalled();
  });

  it('should remove any transportations when export data is undefined', async () => {
    mockGetDraftData.mockResolvedValue({ ...catchCertificate, exportData: undefined });

    await SUT.removeTransportation(-1, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(mockGetDraftData).toHaveBeenCalled();
    expect(mockUpsertDraftData).not.toHaveBeenCalled();
  });

  it('should remove any transportations when data is undefined', async () => {
    mockGetDraftData.mockResolvedValue(undefined);

    await SUT.removeTransportation(-1, USER_ID, DOCUMENT_NUMBER, contactId);

    expect(mockGetDraftData).toHaveBeenCalled();
    expect(mockUpsertDraftData).not.toHaveBeenCalled();
  });

  it('will a direct landing catch certificate', async () => {
    mockGetDraftData.mockResolvedValue({ ...catchCertificate, exportData: { ...catchCertificate.exportData, transportation: { vehicle: 'directLanding' }, transportations: undefined } });

    await SUT.removeTransportation(-1, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockGetDraftData).toHaveBeenCalled();
    expect(mockUpsertDraftData).not.toHaveBeenCalled();
  });
});