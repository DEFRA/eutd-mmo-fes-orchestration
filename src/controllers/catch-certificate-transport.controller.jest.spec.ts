import TransportController from "./catch-certificate-transport.controller";
import TransportService from "../services/catch-certificate-transport.service";
import { CatchCertificateTransport } from "../persistence/schema/frontEndModels/catchCertificateTransport";
import { AddTransportation } from "../persistence/schema/catchCert";

const USER_ID = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12";
const contactId = 'contactBob';
const DOCUMENT_NUMBER = "document-number";

describe("addTransport", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate" },
    payload: {
      vehicle: "train",
    },
    headers: { accept: "text/html" },
  };
  const transport: CatchCertificateTransport = {
    id: 'some-transport-id',
    vehicle: "train"
  }

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'addTransport');
    mockService.mockResolvedValue(transport);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will add transportation from payload', async () => {
    const result = await TransportController.addTransport(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)
    expect(result).toEqual(transport);
  })

  it('will fail to add transportation', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.addTransport(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })
});

describe("addTransportCheck", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate" },
    payload: {
      addTransportation: 'yes'
    },
    headers: { accept: "text/html" },
  };
  const transport: { addTransportation: AddTransportation } = { addTransportation: AddTransportation.Yes };

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'addTransportCheck');
    mockService.mockResolvedValue(transport);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will add transportation check from payload', async () => {
    const result = await TransportController.addTransportationCheck(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)
    expect(result).toEqual(transport);
  })

  it('will fail to add transportation check', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.addTransportationCheck(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })
});

describe("getTransportationCheck", () => {

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'getTransportCheck');
    mockService.mockResolvedValue(AddTransportation.Yes);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will all transportations', async () => {
    const result = await TransportController.getTransportationCheck(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12', 'document-number', 'contactBob');
    expect(result).toEqual('yes');
  })

  it('will fail to get transportations', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.getTransportationCheck(USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })
});

describe("getTransportations", () => {
  const transport: CatchCertificateTransport = {
    id: 'some-transport-id',
    vehicle: "train"
  }

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'getTransportations');
    mockService.mockResolvedValue(transport);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will all transportations', async () => {
    const result = await TransportController.getTransportations(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12', 'document-number', 'contactBob');
    expect(result).toEqual(transport);
  })

  it('will fail to get transportations', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.getTransportations(USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })
});

describe("getTransport", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {},
    headers: { accept: "text/html" },
  };

  const transport: CatchCertificateTransport = {
    id: 'some-transport-id',
    vehicle: "train"
  }

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'getTransport');
    mockService.mockResolvedValue(transport);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will get a single transportation', async () => {
    const result = await TransportController.getTransport(mockReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(0, 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12', 'document-number', 'contactBob')
    expect(result).toEqual(transport);
  })

  it('will fail to get a transportation', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.getTransport(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })
});

describe("saveTransportDocuments", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {
      id: "5325443602",
      vehicle: "truck",
      documents: [{}, {}, {}, {}, { name: "name", reference: "reference" }, { name: '', reference: '' }, { name: '     ', reference: '    ' }]
    },
    headers: { accept: "text/html" },
  };

  const transport: CatchCertificateTransport = {
      id: "5325443602",
      vehicle: "truck",
      documents: [{ name: "name", reference: "reference" }]
  }

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'updateTransportDocuments');
    mockService.mockResolvedValue(transport);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will save transportation from payload', async () => {
    const result = await TransportController.saveTransportDocuments(mockReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(transport, 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12', 'document-number', 'contactBob');
    expect(result).toEqual(transport);
  })

  it('will fail to update transportation', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.saveTransportDocuments(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })

  it('will filter out documents with empty name or reference', async () => {
    const reqWithEmptyDocs: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: "5325443602",
        vehicle: "truck",
        documents: [
          { name: "valid", reference: "valid_ref" },
          { name: "", reference: "ref" },
          { name: "name", reference: "" },
          { name: "   ", reference: "ref" },
          { name: "name", reference: "   " }
        ]
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: "5325443602",
      vehicle: "truck",
      documents: [{ name: "valid", reference: "valid_ref" }]
    };

    await TransportController.saveTransportDocuments(reqWithEmptyDocs, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })
});

describe("updateTransportDocuments", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {
      id: "1234567890",
      vehicle: "plane",
      documents: [{ name: "doc1", reference: "ref1" }, { name: "doc2", reference: "ref2" }]
    },
    headers: { accept: "text/html" },
  };

  const transport: CatchCertificateTransport = {
    id: "1234567890",
    vehicle: "plane",
    documents: [{ name: "doc1", reference: "ref1" }, { name: "doc2", reference: "ref2" }]
  }

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'updateTransportDocuments');
    mockService.mockResolvedValue(transport);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will update transport documents without filtering', async () => {
    const result = await TransportController.updateTransportDocuments(mockReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(transport, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(result).toEqual(transport);
  })

  it('will fail to update transport documents', async () => {
    mockService.mockRejectedValue(new Error('update failed'));
    await expect(TransportController.updateTransportDocuments(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('update failed');
  })

  it('will pass through all documents including empty ones', async () => {
    const reqWithEmptyDocs: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: "1234567890",
        vehicle: "plane",
        documents: [
          { name: "valid", reference: "valid_ref" },
          { name: "", reference: "" },
          { name: "   ", reference: "   " }
        ]
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: "1234567890",
      vehicle: "plane",
      documents: [
        { name: "valid", reference: "valid_ref" },
        { name: "", reference: "" },
        { name: "   ", reference: "   " }
      ]
    };

    await TransportController.updateTransportDocuments(reqWithEmptyDocs, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })
});

describe("updateTransport", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {
      id: 'some-transport-id',
      vehicle: 'train'
    },
    headers: { accept: "text/html" },
  };

  const transport: CatchCertificateTransport = {
    id: 'some-transport-id',
    vehicle: "train"
  }

  let mockService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'updateTransport');
    mockService.mockResolvedValue(transport);
  });

  afterEach(() => {
    mockService.mockRestore();
  });

  it('will update transportation from payload', async () => {
    const result = await TransportController.updateTransport(mockReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(transport, 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12', 'document-number', 'contactBob')
    expect(result).toEqual(transport);
  })

  it('will fail to update transportation', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.updateTransport(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })

  it('will transform containerNumbers array to containerIdentificationNumber for truck', async () => {
    const truckReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: 'truck-transport-id',
        vehicle: 'truck',
        containerNumbers: ['CONT001', 'CONT002', 'CONT003']
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: 'truck-transport-id',
      vehicle: 'truck',
      containerNumbers: ['CONT001', 'CONT002', 'CONT003']
    };

    await TransportController.updateTransport(truckReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })

  it('will filter empty containerNumbers when transforming for truck', async () => {
    const truckReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: 'truck-transport-id',
        vehicle: 'truck',
        containerNumbers: ['CONT001', '', '  ', 'CONT002', null]
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: 'truck-transport-id',
      vehicle: 'truck',
      containerNumbers: ['CONT001', '', '  ', 'CONT002', null]
    };

    await TransportController.updateTransport(truckReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })

  it('will transform containerNumbers for train vehicles', async () => {
    const trainReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: 'train-transport-id',
        vehicle: 'train',
        containerNumbers: ['CONT001', 'CONT002']
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: 'train-transport-id',
      vehicle: 'train',
      containerNumbers: ['CONT001', 'CONT002']
    };

    await TransportController.updateTransport(trainReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })

  it('will transform containerNumbers array to containerNumber for plane', async () => {
    const planeReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: 'plane-transport-id',
        vehicle: 'plane',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678']
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: 'plane-transport-id',
      vehicle: 'plane',
      containerNumbers: ['ABCU1234567', 'DEFJ2345678']
    };

    await TransportController.updateTransport(planeReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })

  it('will transform containerNumbers array to containerNumber for containerVessel', async () => {
    const containerVesselReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: 'vessel-transport-id',
        vehicle: 'containerVessel',
        containerNumbers: ['GHIZ3456789', 'JKLR4567890']
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: 'vessel-transport-id',
      vehicle: 'containerVessel',
      containerNumbers: ['GHIZ3456789', 'JKLR4567890']
    };

    await TransportController.updateTransport(containerVesselReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })

  it('will filter empty containerNumbers when transforming for plane', async () => {
    const planeReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: 'plane-transport-id',
        vehicle: 'plane',
        containerNumbers: ['ABCU1234567', '', null, 'DEFJ2345678']
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: 'plane-transport-id',
      vehicle: 'plane',
      containerNumbers: ['ABCU1234567', '', null, 'DEFJ2345678']
    };

    await TransportController.updateTransport(planeReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })

  it('will filter empty containerNumbers when transforming for containerVessel', async () => {
    const containerVesselReq: any = {
      app: { claims: { sub: "test", email: "test@test.com" } },
      params: { documentType: "catchCertificate", transportId: 0 },
      payload: {
        id: 'vessel-transport-id',
        vehicle: 'containerVessel',
        containerNumbers: ['GHIZ3456789', '  ', 'JKLR4567890', null]
      },
      headers: { accept: "text/html" },
    };

    const expectedTransport = {
      id: 'vessel-transport-id',
      vehicle: 'containerVessel',
      containerNumbers: ['GHIZ3456789', '  ', 'JKLR4567890', null]
    };

    await TransportController.updateTransport(containerVesselReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(expectedTransport, USER_ID, DOCUMENT_NUMBER, contactId);
  })
});

describe("removeTransport", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {
      vehicle: "train",
    },
    headers: { accept: "text/html" },
  };

  let mockService: jest.SpyInstance;
  let mockRemoveService: jest.SpyInstance;

  beforeEach(() => {
    mockService = jest.spyOn(TransportService, 'removeTransportations');
    mockService.mockResolvedValue(undefined);

    mockRemoveService = jest.spyOn(TransportService, 'removeTransportation');
    mockRemoveService.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockService.mockRestore();
    mockRemoveService.mockRestore();
  });

  it('will remove all transportations', async () => {
    await TransportController.removeTransportations(USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith(USER_ID, DOCUMENT_NUMBER, contactId);
  })

  it('will fail to remove all transportations', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));
    await expect(TransportController.removeTransportations(USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })

  it('will remove a transportation', async () => {
    await TransportController.removeTransportationById(mockReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockRemoveService).toHaveBeenCalledWith(0, USER_ID, DOCUMENT_NUMBER, contactId);
  })
});

