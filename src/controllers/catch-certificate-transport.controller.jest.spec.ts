import TransportController from "./catch-certificate-transport.controller";
import TransportService from "../services/catch-certificate-transport.service";
import { Transport } from "../persistence/schema/frontEndModels/transport";

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
  const transport:Transport = {
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

describe("getTransportations", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {},
    headers: { accept: "text/html" },
  };

  const transport:Transport = {
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
    const result = await TransportController.getTransportations(mockReq, USER_ID, DOCUMENT_NUMBER, contactId);
    expect(mockService).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12', 'document-number', 'contactBob');
    expect(result).toEqual(transport);
  })

  it('will fail to get transportations', async () => {
    mockService.mockRejectedValue(new Error('something has gone wrong'));

    await expect(TransportController.getTransportations(mockReq, USER_ID, DOCUMENT_NUMBER, contactId)).rejects.toThrow('something has gone wrong');
  })
});

describe("getTransport", () => {
  const mockReq: any = {
    app: { claims: { sub: "test", email: "test@test.com" } },
    params: { documentType: "catchCertificate", transportId: 0 },
    payload: {},
    headers: { accept: "text/html" },
  };

  const transport:Transport = {
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

  const transport:Transport = {
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
