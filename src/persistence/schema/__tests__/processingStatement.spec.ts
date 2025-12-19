import { describe, it, expect } from '@jest/globals';
import {
  toFrontEndProcessingStatementExportData,
  cloneProcessingStatement,
  cloneExportData,
  ExportData,
  ProcessingStatement
} from '../processingStatement';

describe('processingStatement schema - toFrontEndProcessingStatementExportData', () => {
  it('should include pointOfDestination when present in exportData', () => {
    const exportData: ExportData = {
      catches: [],
      products: [],
      consignmentDescription: 'Test consignment',
      healthCertificateNumber: 'HC123',
      healthCertificateDate: '01/01/2020',
      personResponsibleForConsignment: 'John Doe',
      plantApprovalNumber: 'PA123',
      plantName: 'Test Plant',
      plantAddressOne: '123 Test St',
      plantTownCity: 'London',
      plantPostcode: 'SW1A 1AA',
      dateOfAcceptance: '01/01/2020',
      exportedTo: {
        officialCountryName: 'France',
        isoCodeAlpha2: 'FR'
      },
      pointOfDestination: 'Port of Rotterdam'
    };

    const result = toFrontEndProcessingStatementExportData(exportData);

    expect(result.pointOfDestination).toBe('Port of Rotterdam');
  });

  it('should return null for pointOfDestination when not present in exportData', () => {
    const exportData: ExportData = {
      catches: [],
      products: [],
      consignmentDescription: 'Test consignment',
      healthCertificateNumber: 'HC123',
      healthCertificateDate: '01/01/2020',
      personResponsibleForConsignment: 'John Doe',
      plantApprovalNumber: 'PA123',
      plantName: 'Test Plant',
      plantAddressOne: '123 Test St',
      plantTownCity: 'London',
      plantPostcode: 'SW1A 1AA',
      dateOfAcceptance: '01/01/2020',
      exportedTo: {
        officialCountryName: 'France',
        isoCodeAlpha2: 'FR'
      }
    };

    const result = toFrontEndProcessingStatementExportData(exportData);

    expect(result.pointOfDestination).toBeNull();
  });

  it('should return null for pointOfDestination when exportData has no pointOfDestination field', () => {
    const exportData: ExportData = {
      catches: [],
      plantPostcode: 'SW1A 1AA',
      exportedTo: {
        officialCountryName: 'France',
        isoCodeAlpha2: 'FR'
      }
    };

    const result = toFrontEndProcessingStatementExportData(exportData);

    expect(result.pointOfDestination).toBeNull();
  });
});

describe('processingStatement schema - cloneExportData', () => {
  it('should preserve pointOfDestination when cloning export data', () => {
    const originalExportData: ExportData = {
      catches: [{
        species: 'COD',
        speciesCode: 'COD',
        catchCertificateNumber: 'CC123',
        catchCertificateType: 'uk',
        totalWeightLanded: '100',
        exportWeightBeforeProcessing: '90',
        exportWeightAfterProcessing: '80'
      }],
      products: [],
      consignmentDescription: 'Test consignment',
      healthCertificateNumber: 'HC123',
      healthCertificateDate: '01/01/2020',
      personResponsibleForConsignment: 'John Doe',
      plantApprovalNumber: 'PA123',
      plantName: 'Test Plant',
      plantAddressOne: '123 Test St',
      plantTownCity: 'London',
      plantPostcode: 'SW1A 1AA',
      dateOfAcceptance: '01/01/2020',
      exportedTo: {
        officialCountryName: 'France',
        isoCodeAlpha2: 'FR'
      },
      pointOfDestination: 'Port of Calais'
    };

    const clonedExportData = cloneExportData(originalExportData);

    expect(clonedExportData.pointOfDestination).toBe('Port of Calais');
  });

  it('should handle undefined pointOfDestination when cloning export data', () => {
    const originalExportData: ExportData = {
      catches: [],
      products: [],
      consignmentDescription: 'Test consignment',
      healthCertificateNumber: 'HC123',
      healthCertificateDate: '01/01/2020',
      personResponsibleForConsignment: 'John Doe',
      plantApprovalNumber: 'PA123',
      plantName: 'Test Plant',
      plantAddressOne: '123 Test St',
      plantTownCity: 'London',
      plantPostcode: 'SW1A 1AA',
      dateOfAcceptance: '01/01/2020',
      exportedTo: {
        officialCountryName: 'France',
        isoCodeAlpha2: 'FR'
      }
    };

    const clonedExportData = cloneExportData(originalExportData);

    expect(clonedExportData.pointOfDestination).toBeUndefined();
  });
});

describe('processingStatement schema - cloneProcessingStatement', () => {
  it('should preserve pointOfDestination in exportData when cloning processing statement', () => {
    const originalPS: ProcessingStatement = {
      documentNumber: 'GBR-2020-PS-12345',
      status: 'SUBMITTED',
      createdAt: '2020-01-01T00:00:00Z',
      createdBy: 'user1',
      createdByEmail: 'user1@example.com',
      userReference: 'REF123',
      exportData: {
        catches: [{
          species: 'COD',
          speciesCode: 'COD',
          catchCertificateNumber: 'CC123',
          catchCertificateType: 'uk',
          totalWeightLanded: '100',
          exportWeightBeforeProcessing: '90',
          exportWeightAfterProcessing: '80'
        }],
        products: [],
        consignmentDescription: 'Test consignment',
        healthCertificateNumber: 'HC123',
        healthCertificateDate: '01/01/2020',
        personResponsibleForConsignment: 'John Doe',
        plantApprovalNumber: 'PA123',
        plantName: 'Test Plant',
        plantAddressOne: '123 Test St',
        plantTownCity: 'London',
        plantPostcode: 'SW1A 1AA',
        dateOfAcceptance: '01/01/2020',
        exportedTo: {
          officialCountryName: 'France',
          isoCodeAlpha2: 'FR'
        },
        pointOfDestination: 'Port of Marseille'
      }
    };

    const clonedPS = cloneProcessingStatement(originalPS, 'GBR-2020-PS-67890', false, false);

    expect(clonedPS.exportData.pointOfDestination).toBe('Port of Marseille');
    expect(clonedPS.documentNumber).toBe('GBR-2020-PS-67890');
    expect(clonedPS.status).toBe('DRAFT');
    expect(clonedPS.clonedFrom).toBe('GBR-2020-PS-12345');
  });

  it('should handle missing pointOfDestination when cloning processing statement', () => {
    const originalPS: ProcessingStatement = {
      documentNumber: 'GBR-2020-PS-12345',
      status: 'SUBMITTED',
      createdAt: '2020-01-01T00:00:00Z',
      createdBy: 'user1',
      createdByEmail: 'user1@example.com',
      exportData: {
        catches: [],
        products: [],
        consignmentDescription: 'Test consignment',
        healthCertificateNumber: 'HC123',
        healthCertificateDate: '01/01/2020',
        personResponsibleForConsignment: 'John Doe',
        plantApprovalNumber: 'PA123',
        plantName: 'Test Plant',
        plantAddressOne: '123 Test St',
        plantTownCity: 'London',
        plantPostcode: 'SW1A 1AA',
        dateOfAcceptance: '01/01/2020',
        exportedTo: {
          officialCountryName: 'France',
          isoCodeAlpha2: 'FR'
        }
      }
    };

    const clonedPS = cloneProcessingStatement(originalPS, 'GBR-2020-PS-67890', false, false);

    expect(clonedPS.exportData.pointOfDestination).toBeUndefined();
    expect(clonedPS.documentNumber).toBe('GBR-2020-PS-67890');
  });
});
