import CertificateController from './certificate.controller';
import * as CatchCertService from '../persistence/services/catchCert';
import SummaryErrorsService from '../services/summaryErrors.service';
import ProgressService from '../services/progress.service';

const documentNumber = 'GBR-X-CC-1';
const contactId = 'contactBob';

const req: any = {
  app: { claims: { sub: 'Bob', contactId } },
  headers: {},
  params: {},
};

const backEndCc: any = {
  createdAt: "2021-01-05T16:59:29.190Z",
  status: "DRAFT",
  documentNumber,
  userReference: 'user-ref-123',
  exportData: {},
};

describe('CertificateController.getCatchCertificatePreSubmit', () => {
  let mockGetDocument: jest.SpyInstance;
  let mockGetSummaryErrors: jest.SpyInstance;
  let mockGetProgress: jest.SpyInstance;

  beforeEach(() => {
    mockGetDocument = jest.spyOn(CatchCertService, 'getDocument');
    mockGetSummaryErrors = jest.spyOn(SummaryErrorsService, 'get');
    mockGetProgress = jest.spyOn(ProgressService, 'get');
  });

  afterEach(() => {
    mockGetDocument.mockRestore();
    mockGetSummaryErrors.mockRestore();
    mockGetProgress.mockRestore();
  });

  it('returns null when document not found', async () => {
    mockGetDocument.mockResolvedValue(null);

    const result = await CertificateController.getCatchCertificatePreSubmit(req as any, 'Bob', documentNumber);

    expect(result).toBeNull();
  });

  it('returns summary and completeness when document found', async () => {
    mockGetDocument.mockResolvedValue(backEndCc);
    mockGetSummaryErrors.mockResolvedValue([]);
    mockGetProgress.mockResolvedValue({ progress: null, requiredSections: 0, completedSections: 0 });

    const result = await CertificateController.getCatchCertificatePreSubmit(req as any, 'Bob', documentNumber);

    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('completeness');
    expect(result.summary.documentNumber).toBe(documentNumber);
    expect(result.summary.userReference).toBe('user-ref-123');
  });

  it('passes providedDocument through and does not call getDocument', async () => {
    const provided = { documentNumber, status: 'DRAFT', userReference: 'provided-ref' };
    mockGetSummaryErrors.mockResolvedValue([]);
    mockGetProgress.mockResolvedValue({ progress: null, requiredSections: 0, completedSections: 0 });

    const result = await CertificateController.getCatchCertificatePreSubmit(req as any, 'Bob', documentNumber, provided as any);

    expect(mockGetDocument).not.toHaveBeenCalled();
    expect(result.summary.userReference).toBe('provided-ref');
  });
});
