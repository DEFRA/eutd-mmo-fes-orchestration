import TransportController from "./catch-certificate-transport.controller";
import TransportService from "../services/catch-certificate-transport.service";
import { Transport } from "../persistence/schema/frontEndModels/transport";
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
  const transport: Transport = {
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
  const transport: Transport = {
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

  const transport: Transport = {
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

describe("updateTransport", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {
      vehicle: 'train'
    },
    headers: { accept: "text/html" },
  };

  const transport: Transport = {
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

