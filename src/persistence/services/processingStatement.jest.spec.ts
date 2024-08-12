import * as mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as ProcessingStatementService from './processingStatement';
import {
  ExportData,
  ProcessingStatementModel,
  ProcessingStatement,
} from '../schema/processingStatement';
import * as FrontEndExporterSchema from '../schema/frontEndModels/exporterDetails';
import DocumentNumberService from '../../services/documentNumber.service';
import ManageCertsService from '../../services/manage-certs.service';

describe('processingStatement', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getConnectionString();
    await mongoose.connect(mongoUri).catch(err => {console.log(err)});
  });

  afterEach(async () => {
    await ProcessingStatementModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const testUser = 'Bob';
  const testContact = 'contactBob';
  const testUserEmail = 'bob@test.com';
  const defaultUserReference = 'User Reference';
  const testRequestByAdmin = true;

  const createDocument = async (
    draftData: Object = null,
    status: string = 'DRAFT',
    createdBy: string = testUser,
    documentNumber: string = 'test',
    userReference: string = defaultUserReference,
    createdAt: Date = new Date(2020, 0, 27),
    contactId: string = testContact
  ) => {
    await new ProcessingStatementModel({
      documentNumber: documentNumber,
      status: status,
      createdAt: createdAt,
      createdBy: createdBy,
      exportData: draftData,
      draftData: draftData,
      documentUri: 'test',
      userReference: userReference,
      contactId: contactId,
    }).save();
  };

  describe('getDocument', () => {
    it('will return a document if a match exists', async () => {
      await createDocument(null, 'COMPLETE', testUser, 'doc1');

      const result = await ProcessingStatementService.getDocument(
        'doc1',
        testUser,
        testContact
      );

      expect(result.documentNumber).toBe('doc1');
    });

    it('will return null if no document can be found', async () => {
      const result = await ProcessingStatementService.getDocument(
        'doc1',
        testUser,
        testContact
      );

      expect(result).toBeNull();
    });

    it('will return null if document is not for a correct user', async () => {
      await createDocument(null, 'COMPLETE', testUser, 'doc1');
      const result = await ProcessingStatementService.getDocument(
        'doc1',
        undefined,
        'notCorrectUser'
      );

      expect(result).toBeNull();
    });
  });

  describe('createDraft', () => {
    it('will create a new draft in the system', async () => {
      await ProcessingStatementService.createDraft(
        testUser,
        testUserEmail,
        testRequestByAdmin,
        testContact
      );

      const result = await ProcessingStatementModel.find({
        createdBy: testUser,
        createdByEmail: testUserEmail,
        status: 'DRAFT',
      });

      expect(result.length).toBe(1);
    });
  });

  describe('getDraft', () => {
    it('should return draft data if it exists with a document number', async () => {
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantAddressTwo: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 1',
            addressOne: 'Building',
            addressTwo: 'Street',
            townCity: 'Town',
            postcode: 'NE1 1NE',
          },
        },
        'DRAFT',
        'Bob',
        'ZZZ-3444-3444-3444'
      );
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantAddressTwo: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 2',
            addressOne: 'Building',
            addressTwo: 'Street',
            townCity: 'Town',
            postcode: 'NE1 1NE',
          },
        },
        'DRAFT',
        'Bob',
        'GBR-3444-3444-3444'
      );

      const result: any = await ProcessingStatementService.getDraft(
        'Bob',
        'GBR-3444-3444-3444',
        testContact
      );

      expect(
        result.exportData.exporterDetails.exporterCompanyName
      ).toStrictEqual('Company 2');
    });
    it('should return first occurrence if document number is undefined', async () => {
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantAddressTwo: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 1',
            addressOne: 'Building',
            addressTwo: 'Street',
            townCity: 'Town',
            postcode: 'NE1 1NE',
          },
        },
        'DRAFT',
        'Bob',
        'ZZZ-3444-3444-3444'
      );
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantAddressTwo: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 2',
            addressOne: 'Building',
            addressTwo: 'Street',
            townCity: 'Town',
            postcode: 'NE1 1NE',
          },
        },
        'DRAFT',
        'Bob',
        'GBR-3444-3444-3444'
      );

      const result: any = await ProcessingStatementService.getDraft(
        'Bob',
        undefined,
        testContact
      );

      expect(
        result.exportData.exporterDetails.exporterCompanyName
      ).toStrictEqual('Company 1');
    });
  });

  describe('getDraftData', () => {
    describe('if the user has no draft processing statements', () => {
      it('if a default value is specified return it', async () => {
        const result = await ProcessingStatementService.getDraftData(
          testUser,
          testContact,
          'test',
          'no results found'
        );

        expect(result).toStrictEqual('no results found');
      });

      it('if no default value is specified return an empty object', async () => {
        const result = await ProcessingStatementService.getDraftData(
          testUser,
          'test',
          testContact
        );

        expect(result).toStrictEqual({});
      });
    });

    describe('if the user has a draft processing statement', () => {
      it('should return draft data if it exists', async () => {
        await createDocument({ test: 'test' });

        const result = await ProcessingStatementService.getDraftData(
          testUser,
          'test',
          testContact
        );

        expect(result).toStrictEqual('test');
      });

      it('should return the default value if it doesnt exist', async () => {
        await createDocument({ data: 'test' });

        const result = await ProcessingStatementService.getDraftData(
          testUser,
          'test',
          testContact
        );

        expect(result).toStrictEqual({});
      });
    });
  });

  describe('upsertDraftDataForProcessingStatement', () => {
    const payload = { data: 'test' };
    const defaultUser = 'Bob';

    it('should create and return only one Processing Statement', async () => {
      await ProcessingStatementService.upsertDraftDataForProcessingStatement(
        defaultUser,
        testContact
      );
      const result = await ProcessingStatementModel.find({
        createdBy: defaultUser,
        status: 'DRAFT',
      });
      expect(result.length).toBe(1);
    });

    it('should create and return a new Processing Statement if payload and path is not given', async () => {
      await ProcessingStatementService.upsertDraftDataForProcessingStatement(
        defaultUser,
        testContact
      );
      const year = new Date().getFullYear();

      const result = (
        await ProcessingStatementModel.find({
          createdBy: defaultUser,
          status: 'DRAFT',
        })
      )[0];
      expect(result['_id']).toBeDefined();
      expect(result['documentNumber']).toMatch(
        new RegExp(`^GBR-${year}-PS-[A-Z0-9]{9}$`)
      );
      expect(result['createdBy']).toBe(defaultUser);
      expect(result['status']).toBe('DRAFT');
    });

    it('should update an existing certificate if the user already has a draft', async () => {
      await ProcessingStatementService.upsertDraftDataForProcessingStatement(
        defaultUser,
        testContact,
        'test-1',
        { item: 'test 1' }
      );
      await ProcessingStatementService.upsertDraftDataForProcessingStatement(
        defaultUser,
        testContact,
        'test-2',
        { item: 'test 2' }
      );
      const result = await ProcessingStatementModel.find({
        createdBy: defaultUser,
        status: 'DRAFT',
      });
      expect(result.length).toBe(1);
      expect(result[0].draftData['test-1']).toStrictEqual({ item: 'test 1' });
      expect(result[0].draftData['test-2']).toStrictEqual({ item: 'test 2' });
    });

    it('should create and return a new certificate with a payload content', async () => {
      await ProcessingStatementService.upsertDraftDataForProcessingStatement(
        defaultUser,
        testContact,
        'path',
        payload
      );
      const year = new Date().getFullYear();

      const result = (
        await ProcessingStatementModel.find({
          createdBy: defaultUser,
          status: 'DRAFT',
        })
      )[0];
      expect(result['_id']).toBeDefined();
      expect(result['documentNumber']).toBeDefined();
      expect(result['documentNumber']).toMatch(
        new RegExp(`^GBR-${year}-PS-[A-Z0-9]{9}$`)
      );
      expect(result['createdBy']).toBe(defaultUser);
      expect(result['status']).toBe('DRAFT');
      expect(result.draftData['path']).toStrictEqual(payload);
    });

    it('should save an empty object as  payload if payload is not given', async () => {
      const newDraft =
        await ProcessingStatementService.upsertDraftDataForProcessingStatement(
          defaultUser,
          testContact,
          'path'
        );

      expect(newDraft.draftData['path']).toStrictEqual({});
    });

    it('should throw and error if path is no given', async () => {
      await expect(
        ProcessingStatementService.upsertDraftDataForProcessingStatement(
          defaultUser,
          testContact,
          '',
          payload
        )
      ).rejects.toThrow(
        '[upsertDraftDataForProcessingStatement][INVALID-ARGUMENTS]'
      );
    });
  });

  describe('getDraftDocumentHeaders', () => {
    it('should return a draft if one is present', async () => {
      await createDocument();

      const result = await ProcessingStatementService.getDraftDocumentHeaders(
        testUser,
        testContact
      );

      expect(result).toStrictEqual([
        {
          documentNumber: 'test',
          status: 'DRAFT',
          startedAt: '27 Jan 2020',
          userReference: 'User Reference',
        },
      ]);
    });

    it('should return no drafts if no drafts are present', async () => {
      await createDocument(null, 'COMPLETE');

      const result = await ProcessingStatementService.getDraftDocumentHeaders(
        testUser,
        testContact
      );

      expect(result).toStrictEqual([]);
    });

    it('should return only drafts for the specified user', async () => {
      await createDocument(null, 'DRAFT', 'Juan', 'test 1');
      await createDocument(null, 'DRAFT', 'Chris', 'test 2');
      await createDocument(null, 'DRAFT', testUser, 'test 3');
      await createDocument(null, 'COMPLETE', testUser, 'test 4');

      const result = await ProcessingStatementService.getDraftDocumentHeaders(
        'Bob',
        undefined
      );

      expect(result).toStrictEqual([
        {
          documentNumber: 'test 3',
          status: 'DRAFT',
          startedAt: '27 Jan 2020',
          userReference: 'User Reference',
        },
      ]);
    });

    it('should return all drafts for the specified user', async () => {
      await createDocument(null, 'DRAFT', 'Bob', 'test 1');
      await createDocument(null, 'DRAFT', 'Bob', 'test 2');
      await createDocument(null, 'DRAFT', 'Bob', 'test 3');
      await createDocument(null, 'DRAFT', 'Pete', 'test 4');

      const result = await ProcessingStatementService.getDraftDocumentHeaders(
        'Bob',
        undefined
      );

      expect(result.length).toEqual(3);
    });

    it('should return all DRAFTS for a user with the correct user reference', async () => {
      await createDocument(null, 'DRAFT', 'Foo', 'test1', 'User Reference 1');
      await createDocument(null, 'DRAFT', 'Foo', 'test2', 'User Reference 2');
      await createDocument(null, 'DRAFT', 'Foo', 'test3', 'User Reference 3');
      await createDocument(null, 'DRAFT', 'Foo', 'test4', 'User Reference 4');

      const expected = [
        {
          documentNumber: 'test1',
          status: 'DRAFT',
          startedAt: '27 Jan 2020',
          userReference: 'User Reference 1',
        },
        {
          documentNumber: 'test2',
          status: 'DRAFT',
          startedAt: '27 Jan 2020',
          userReference: 'User Reference 2',
        },
        {
          documentNumber: 'test3',
          status: 'DRAFT',
          startedAt: '27 Jan 2020',
          userReference: 'User Reference 3',
        },
        {
          documentNumber: 'test4',
          status: 'DRAFT',
          startedAt: '27 Jan 2020',
          userReference: 'User Reference 4',
        },
      ];

      const result = await ProcessingStatementService.getDraftDocumentHeaders(
        'Foo',
        testContact
      );

      expect(result).toStrictEqual(expected);
    });

    it('should return drafts in createdAt descending order', async () => {
      await createDocument(
        null,
        'DRAFT',
        'Bob',
        'doc1',
        'ref1',
        new Date('2020-01-01')
      );
      await createDocument(
        null,
        'DRAFT',
        'Bob',
        'doc3',
        'ref3',
        new Date('2020-01-03')
      );
      await createDocument(
        null,
        'DRAFT',
        'Bob',
        'doc2',
        'ref2',
        new Date('2020-01-02')
      );

      const result = await ProcessingStatementService.getDraftDocumentHeaders(
        'Bob',
        testContact
      );

      expect(result.length).toEqual(3);
      expect(result[0].documentNumber).toBe('doc3');
      expect(result[1].documentNumber).toBe('doc2');
      expect(result[2].documentNumber).toBe('doc1');
    });
  });

  describe('getAllProcessingStatementsForUserByYearAndMonth', () => {
    it('should not return draft or void certificates', async () => {
      await createDocument(null, 'DRAFT', testUser, 'test 1');
      await createDocument(null, 'COMPLETE', testUser, 'test 2');
      await createDocument(null, 'VOID', testUser, 'test 3');

      const result =
        await ProcessingStatementService.getAllProcessingStatementsForUserByYearAndMonth(
          '01-2020',
          testUser,
          testContact
        );

      expect(result).toHaveLength(1);
      expect(result[0].documentNumber).toBe('test 2');
    });

    it('should return all completed processing statements within the specified month and year with user references', async () => {
      await createDocument(
        null,
        'DRAFT',
        testUser,
        'test 1',
        'User Reference 1'
      );
      await createDocument(
        null,
        'VOID',
        testUser,
        'test 3',
        'User Reference 2'
      );
      await createDocument(
        null,
        'COMPLETE',
        testUser,
        'test 2',
        'User Reference 1'
      );
      await createDocument(
        null,
        'COMPLETE',
        testUser,
        'test 4',
        'User Reference 2'
      );

      const result =
        await ProcessingStatementService.getAllProcessingStatementsForUserByYearAndMonth(
          '01-2020',
          testUser,
          testContact
        );

      expect(result).toHaveLength(2);
      expect(result[0].userReference).toBe('User Reference 1');
      expect(result[1].userReference).toBe('User Reference 2');
    });

    it('should return all completed processing statements in createdAt descending order', async () => {
      await createDocument(
        null,
        'COMPLETE',
        testUser,
        'test 1',
        'ref 1',
        new Date('2020-01-01')
      );
      await createDocument(
        null,
        'COMPLETE',
        testUser,
        'test 3',
        'ref 3',
        new Date('2020-01-03')
      );
      await createDocument(
        null,
        'COMPLETE',
        testUser,
        'test 2',
        'ref 2',
        new Date('2020-01-02')
      );

      const result =
        await ProcessingStatementService.getAllProcessingStatementsForUserByYearAndMonth(
          '01-2020',
          testUser,
          testContact
        );

      expect(result).toHaveLength(3);
      expect(result[0].documentNumber).toBe('test 3');
      expect(result[1].documentNumber).toBe('test 2');
      expect(result[2].documentNumber).toBe('test 1');
    });
  });

  describe('deleteDraftStatement', () => {
    it('will delete a users draft', async () => {
      await Promise.all([
        createDocument(null, 'DRAFT', 'Bob', 'test 1'),
        createDocument(null, 'COMPLETED', 'Bob', 'test 2'),
        createDocument(null, 'DRAFT', 'John', 'test 3'),
        createDocument(null, 'COMPLETED', 'John', 'test 4'),
      ]);

      await ProcessingStatementService.deleteDraftStatement(
        'John',
        'test 3',
        testContact
      );

      const statements = await ProcessingStatementModel.find();
      const docNumbers = statements.map((ps) => ps.documentNumber);

      expect(statements.length).toBe(3);
      expect(docNumbers).toContain('test 1');
      expect(docNumbers).toContain('test 2');
      expect(docNumbers).toContain('test 4');
    });
  });

  describe('getExporterDetails', () => {
    let mockGet;
    let mockMap;

    beforeAll(() => {
      mockGet = jest.spyOn(ProcessingStatementService, 'getDraft');
      mockMap = jest.spyOn(
        FrontEndExporterSchema,
        'toFrontEndPsAndSdExporterDetails'
      );
    });

    afterAll(() => {
      mockGet.mockRestore();
      mockMap.mockRestore();
    });

    it('will return null if no draft is found', async () => {
      mockGet.mockResolvedValue(null);

      expect(
        await ProcessingStatementService.getExporterDetails(
          'Bob',
          undefined,
          testContact
        )
      ).toBeNull();
      expect(
        await ProcessingStatementService.getExporterDetails(
          'Bob',
          undefined,
          testContact
        )
      ).toBeNull();
    });

    it('will return null if the draft has no exporter', async () => {
      const draft = createDraft({
        consignmentDescription: '',
        healthCertificateNumber: '',
        healthCertificateDate: '',
        personResponsibleForConsignment: '',
        plantApprovalNumber: '',
        plantName: '',
        plantAddressOne: '',
        plantBuildingName: '',
        plantBuildingNumber: '',
        plantSubBuildingName: '',
        plantStreetName: '',
        plantCounty: '',
        plantCountry: '',
        plantTownCity: '',
        plantPostcode: '',
        dateOfAcceptance: '',
        exporterDetails: null,
        exportedTo: {
          officialCountryName: '',
          isoCodeAlpha2: '',
          isoCodeAlpha3: '',
          isoNumericCode: '',
        },
      });

      mockGet.mockResolvedValue(draft);

      expect(
        await ProcessingStatementService.getExporterDetails(
          'Bob',
          undefined,
          testContact
        )
      ).toBeNull();
    });

    it('will return a mapped exporter if the draft has an exporter', async () => {
      const draft = createDraft({
        consignmentDescription: '',
        healthCertificateNumber: '',
        healthCertificateDate: '',
        personResponsibleForConsignment: '',
        plantApprovalNumber: '',
        plantName: '',
        plantAddressOne: '',
        plantBuildingName: '',
        plantBuildingNumber: '',
        plantSubBuildingName: '',
        plantStreetName: '',
        plantCounty: '',
        plantCountry: '',
        plantTownCity: '',
        plantPostcode: '',
        dateOfAcceptance: '',
        exporterDetails: {
          contactId: 'a contact Id',
          accountId: 'an account id',
          exporterCompanyName: 'Exporter Co Ltd',
          addressOne: 'Building',
          addressTwo: 'Street',
          townCity: 'Town',
          postcode: 'NE1 1NE',
          _dynamicsAddress: { someData: 'original data' },
          _dynamicsUser: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        exportedTo: {
          officialCountryName: '',
          isoCodeAlpha2: '',
          isoCodeAlpha3: '',
          isoNumericCode: '',
        },
      });

      mockGet.mockResolvedValue(draft);
      mockMap.mockReturnValue({ mapped: true });

      const res = await ProcessingStatementService.getExporterDetails(
        'Bob',
        undefined,
        testContact
      );

      expect(mockMap).toHaveBeenCalledWith(draft.exportData.exporterDetails);
      expect(res).toStrictEqual({ mapped: true });
    });
  });

  describe('upsertExporterDetails', () => {
    const payload: FrontEndExporterSchema.Exporter = {
      model: {
        contactId: 'a contact Id',
        accountId: 'an account id',
        exporterCompanyName: 'Exporter Co Ltd',
        addressOne: 'Building',
        buildingNumber: '123',
        subBuildingName: ' Sub Building Name',
        buildingName: 'Building Name',
        streetName: 'Street',
        county: 'County',
        country: 'Country',
        townCity: 'Town',
        postcode: 'NE1 1NE',
        _dynamicsAddress: { someData: 'original data' },
        _dynamicsUser: {
          firstName: 'John',
          lastName: 'Doe',
        },
        user_id: '',
        currentUri: '',
        nextUri: '',
        journey: '',
      },
    };

    it('will convert to a back end exporter details model', async () => {
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantBuildingName: '',
          plantBuildingNumber: '',
          plantSubBuildingName: '',
          plantStreetName: '',
          plantCounty: '',
          plantCountry: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 1',
            addressOne: 'Building',
            buildingNumber: '123',
            subBuildingName: ' Sub Building Name',
            buildingName: 'Building Name',
            streetName: 'Street',
            county: 'County',
            country: 'Country',
            townCity: 'Town',
            postcode: 'NE1 1NE',
            _dynamicsAddress: { someData: 'original data' },
            _dynamicsUser: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
        'DRAFT',
        'Bob',
        'ZZZ-3444-3444-3444'
      );

      await ProcessingStatementService.upsertExporterDetails(
        'Bob',
        'ZZZ-3444-3444-3444',
        payload,
        testContact
      );

      const result = await ProcessingStatementModel.findOne(
        {
          createdBy: 'Bob',
          documentNumber: 'ZZZ-3444-3444-3444',
          status: 'DRAFT',
        },
        ['exportData'],
        { lean: true }
      );

      expect(result.exportData.exporterDetails).toStrictEqual(
        FrontEndExporterSchema.toBackEndPsAndSdExporterDetails(payload)
      );
    });
  });

  describe('upsertDraftData', () => {
    it('will upsert details based on a document number', async () => {
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantBuildingName: '',
          plantBuildingNumber: '',
          plantSubBuildingName: '',
          plantStreetName: '',
          plantCounty: '',
          plantCountry: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 1',
            addressOne: 'Building',
            addressTwo: 'Street',
            townCity: 'Town',
            postcode: 'NE1 1NE',
          },
        },
        'DRAFT',
        'Bob',
        'ZZZ-3444-3444-3444'
      );
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantBuildingName: '',
          plantBuildingNumber: '',
          plantSubBuildingName: '',
          plantStreetName: '',
          plantCounty: '',
          plantCountry: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 2',
            addressOne: 'Building',
            addressTwo: 'Street',
            townCity: 'Town',
            postcode: 'NE1 1NE',
          },
        },
        'DRAFT',
        'Bob',
        'GBR-3444-3444-3444'
      );

      await ProcessingStatementService.upsertDraftData(
        'Bob',
        'GBR-3444-3444-3444',
        {
          $set: {
            'exportData.exporterDetails.exporterCompanyName': 'MMO',
          },
        },
        testContact
      );

      const result = await ProcessingStatementService.getDraft(
        'Bob',
        'GBR-3444-3444-3444',
        testContact
      );

      expect(result.exportData.exporterDetails.exporterCompanyName).toEqual(
        'MMO'
      );
    });

    it('should not create a new certificate', async () => {
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantBuildingName: '',
          plantBuildingNumber: '',
          plantSubBuildingName: '',
          plantStreetName: '',
          plantCounty: '',
          plantCountry: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: {
            exporterCompanyName: 'Company 1',
            addressOne: 'Building',
            addressTwo: 'Street',
            townCity: 'Town',
            postcode: 'NE1 1NE',
          },
        },
        'DRAFT',
        'Bob',
        'ZZZ-3444-3444-3444'
      );

      await ProcessingStatementService.upsertDraftData(
        'Bob',
        'GBR-2020-CC-0E42C2DA5',
        {
          $set: {
            'exportData.transportation.exportedFrom': 'New York',
          },
        },
        testContact
      );

      const drafts = await ProcessingStatementModel.find({}, ['exportData'], {
        lean: true,
      });
      expect(drafts.length).toEqual(1);
    });
  });

  describe('completeDraft', () => {
    let mockDate;

    beforeAll(() => {
      mockDate = jest.spyOn(Date, 'now');
    });

    afterAll(() => {
      mockDate.mockRestore();
    });

    const getDraft = async (documentNumber: string) => {
      const query = { documentNumber: documentNumber };
      const projection = ['-_id', '-__t', '-__v', '-audit'];
      const options = { lean: true };

      return ProcessingStatementModel.findOne(query, projection, options);
    };

    const sampleDocument = (name: String, status, number) => {
      return {
        documentNumber: number,
        status: status,
        createdAt: new Date('2020-01-16'),
        createdBy: name,
        userReference: 'User Reference',
      };
    };

    it('should complete a draft certificate', async () => {
      const testDate = '2020-02-12';
      mockDate.mockReturnValue(testDate);

      await new ProcessingStatementModel(
        sampleDocument('test', 'DRAFT', 'GBR-2020-CC-0E42C2DA5')
      ).save();

      await ProcessingStatementService.completeDraft(
        'GBR-2020-CC-0E42C2DA5',
        'documentUri',
        'bob@bob.bob'
      );

      const updated = await getDraft('GBR-2020-CC-0E42C2DA5');

      expect(updated).toStrictEqual({
        documentNumber: 'GBR-2020-CC-0E42C2DA5',
        documentUri: 'documentUri',
        createdAt: new Date(testDate),
        createdBy: 'test',
        createdByEmail: 'bob@bob.bob',
        status: 'COMPLETE',
        userReference: defaultUserReference,
      });
    });

    it('should do nothing to a complete certificate', async () => {
      await new ProcessingStatementModel(
        sampleDocument('test', 'COMPLETE', 'ZZZ-2020-CC-0E42C2DA5')
      ).save();

      const original = await getDraft('ZZZ-2020-CC-0E42C2DA5');

      await ProcessingStatementService.completeDraft(
        'ZZZ-2020-CC-0E42C2DA5',
        'documentUri',
        'bob@bob.bob'
      );

      const updated = await getDraft('ZZZ-2020-CC-0E42C2DA5');

      expect(updated).toStrictEqual(original);
    });

    it('should not upsert if no document is found', async () => {
      await ProcessingStatementService.completeDraft(
        'test',
        'documentUri',
        'bob@bob.bob'
      );

      const draft = await getDraft('GBR-2020-CC-NON-EXISTENT');

      expect(draft).toBeNull();
    });
  });

  describe('getProcessingStatementDraftNumber', () => {
    const sampleDocument = (name: String) => {
      return {
        documentNumber: 'GBR-2020-CC-0E42C2DA5',
        status: 'DRAFT',
        createdAt: new Date('2020-01-16'),
        createdBy: name,
      };
    };

    it('should return a processing statement document number for a draft document', async () => {
      await new ProcessingStatementModel(sampleDocument('Bob')).save();

      const result = await ProcessingStatementService.getDraftCertificateNumber(
        'Bob',
        testContact
      );

      expect(result).toEqual('GBR-2020-CC-0E42C2DA5');
    });

    it('should return undefined if processing statement does not exist', async () => {
      await new ProcessingStatementModel(sampleDocument('Pete')).save();

      const result = await ProcessingStatementService.getDraftCertificateNumber(
        'Bob',
        testContact
      );

      expect(result).toEqual(undefined);
    });
  });

  describe('upsertUserReference', () => {
    it('will upsert a user reference', async () => {
      const documentNumber = 'doc1234';
      const userReference = 'ref1234';
      await new ProcessingStatementModel({
        documentNumber: documentNumber,
        status: 'DRAFT',
        createdBy: 'Juan',
      }).save();
      await ProcessingStatementService.upsertUserReference(
        'Juan',
        documentNumber,
        userReference,
        testContact
      );
      const draft = await ProcessingStatementService.getDraft(
        'Juan',
        documentNumber,
        testContact
      );
      expect(draft).not.toBeNull();
      expect(draft.userReference).toStrictEqual(userReference);
    });
  });

  describe('getExportLocation', () => {
    let mockGetDraft;

    beforeAll(() => {
      mockGetDraft = jest.spyOn(ProcessingStatementService, 'getDraft');
    });

    afterAll(() => {
      mockGetDraft.mockRestore();
    });

    it('should return null if there is no draft', async () => {
      mockGetDraft.mockResolvedValue(null);
      expect(
        await ProcessingStatementService.getExportLocation(
          testUser,
          undefined,
          testContact
        )
      ).toBeNull();
    });

    it('should return null if the draft has no exportData', async () => {
      const draft = createDraft(null);
      mockGetDraft.mockResolvedValue(draft);

      expect(
        await ProcessingStatementService.getExportLocation(
          testUser,
          undefined,
          testContact
        )
      ).toBeNull();
    });

    it('should map and return export location if transportation exists', async () => {
      const draft = createDraft({
        consignmentDescription: '',
        healthCertificateNumber: '',
        healthCertificateDate: '',
        personResponsibleForConsignment: '',
        plantApprovalNumber: '',
        plantName: '',
        plantAddressOne: '',
        plantBuildingName: '',
        plantBuildingNumber: '',
        plantSubBuildingName: '',
        plantStreetName: '',
        plantCounty: '',
        plantCountry: '',
        plantTownCity: '',
        plantPostcode: '',
        dateOfAcceptance: '',
        exporterDetails: null,
        exportedTo: {
          officialCountryName: 'Country Name',
          isoCodeAlpha2: 'A1',
          isoCodeAlpha3: 'A3',
          isoNumericCode: 'XX',
        },
      });

      mockGetDraft.mockResolvedValue(draft);

      const res = await ProcessingStatementService.getExportLocation(
        testUser,
        'GBR-3442-2344-23444',
        testContact
      );

      expect(mockGetDraft).toHaveBeenCalledWith(
        testUser,
        'GBR-3442-2344-23444',
        testContact
      );
      expect(res).toEqual({
        exportedTo: {
          officialCountryName: 'Country Name',
          isoCodeAlpha2: 'A1',
          isoCodeAlpha3: 'A3',
          isoNumericCode: 'XX',
        },
      });
    });
  });

  describe('upsertExportLocation', () => {
    it('should update exportData.exportedTo', async () => {
      await createDocument(
        {
          consignmentDescription: '',
          healthCertificateNumber: '',
          healthCertificateDate: '',
          personResponsibleForConsignment: '',
          plantApprovalNumber: '',
          plantName: '',
          plantAddressOne: '',
          plantBuildingName: '',
          plantBuildingNumber: '',
          plantSubBuildingName: '',
          plantStreetName: '',
          plantCounty: '',
          plantCountry: '',
          plantTownCity: '',
          plantPostcode: '',
          dateOfAcceptance: '',
          exporterDetails: null,
        },
        'DRAFT',
        testUser,
        'RJH-2020-PS-0E42C2DA5'
      );

      await ProcessingStatementService.upsertExportLocation(
        testUser,
        {
          exportedTo: {
            officialCountryName: 'SPAIN',
            isoCodeAlpha2: 'A1',
            isoCodeAlpha3: 'A3',
            isoNumericCode: 'SP',
          },
        },
        'RJH-2020-PS-0E42C2DA5',
        testContact
      );

      const ProcessingStatement = await ProcessingStatementModel.findOne(
        {
          createdBy: testUser,
          status: 'DRAFT',
          documentNumber: 'RJH-2020-PS-0E42C2DA5',
        },
        ['exportData'],
        { lean: true }
      );

      expect(ProcessingStatement.exportData.exportedTo).toStrictEqual({
        officialCountryName: 'SPAIN',
        isoCodeAlpha2: 'A1',
        isoCodeAlpha3: 'A3',
        isoNumericCode: 'SP',
      });
    });
  });

  describe('cloneProcessingStatement', () => {
    const originalDocNumber = 'ps1';
    const cloneDocNumber = 'ps2';
    const requestByAdmin = false;
    const voidOriginal = false;

    const original: ProcessingStatement = {
      createdBy: 'Bob',
      createdByEmail: 'bob@bob',
      createdAt: new Date('2020-01-01').toISOString(),
      status: 'DRAFT',
      documentNumber: originalDocNumber,
      exportData: {
        catches: [
          {
            species: 'Atlantic herring (HER)',
            id: '2342234-1610018899',
            catchCertificateNumber: '12345',
            totalWeightLanded: '34',
            exportWeightBeforeProcessing: '34',
            exportWeightAfterProcessing: '45',
            scientificName: 'scientificName',
          },
        ],
        exporterDetails: {
          contactId: 'a contact Id',
          accountId: 'an account id',
          exporterCompanyName: 'Exporter Fish Ltd',
          addressOne: 'London',
          addressTwo: 'London',
          townCity: 'London',
          postcode: 'SE37 6YH',
          _dynamicsAddress: {},
          _dynamicsUser: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        consignmentDescription: 'Commodity code',
        healthCertificateNumber: '45645',
        healthCertificateDate: '27/10/2019',
        personResponsibleForConsignment: 'Isaac',
        plantApprovalNumber: '12345',
        plantName: 'Plant Name',
        plantAddressOne: 'London',
        plantBuildingName: 'plantBuildingName',
        plantBuildingNumber: 'plantBuildingNumber',
        plantSubBuildingName: 'plantSubBuildingName',
        plantStreetName: 'plantStreetName',
        plantCountry: 'plantCountry',
        plantCounty: 'plantCounty',
        plantTownCity: 'London',
        plantPostcode: 'SE37 6YH',
        dateOfAcceptance: '10/02/2020',
        exportedTo: {
          officialCountryName: 'SPAIN',
          isoCodeAlpha2: 'A1',
          isoCodeAlpha3: 'A3',
          isoNumericCode: 'SP',
        },
      },
      requestByAdmin: false,
      documentUri: '',
      draftData: {},
    };

    beforeEach(async () => {
      jest
        .spyOn(DocumentNumberService, 'getUniqueDocumentNumber')
        .mockResolvedValue(cloneDocNumber);

      await new ProcessingStatementModel(original).save();
    });

    it('will throw an error if the ps can not be found', async () => {
      const invalidDocNumber = 'ps99';

      await expect(() =>
        ProcessingStatementService.cloneProcessingStatement(
          invalidDocNumber,
          'Bob',
          testContact,
          requestByAdmin,
          voidOriginal
        )
      ).rejects.toThrow(
        `Document ${invalidDocNumber} not found for user with userPrincipal: 'Bob' or contactId: 'contactBob'`
      );
    });

    it('will return the document number of the newly created copy', async () => {
      const result = await ProcessingStatementService.cloneProcessingStatement(
        originalDocNumber,
        'Bob',
        testContact,
        requestByAdmin,
        voidOriginal
      );

      expect(result).toBe(cloneDocNumber);
    });

    it('will clone an existing ps', async () => {
      await ProcessingStatementService.cloneProcessingStatement(
        originalDocNumber,
        'Bob',
        testContact,
        requestByAdmin,
        voidOriginal
      );

      const clone = await ProcessingStatementService.getDocument(
        cloneDocNumber,
        'Bob',
        testContact
      );

      expect(clone).not.toBeNull();
    });

    it('will not link the clone with the original - changes to one do not effect the other', async () => {
      await ProcessingStatementService.cloneProcessingStatement(
        originalDocNumber,
        'Bob',
        testContact,
        requestByAdmin,
        voidOriginal
      );

      await ProcessingStatementService.upsertDraftData(
        'Bob',
        originalDocNumber,
        {
          $set: {
            'exportData.exporterDetails.exporterCompanyName': 'Modified',
          },
        },
        testContact
      );

      const updated = await ProcessingStatementService.getDocument(
        originalDocNumber,
        'Bob',
        testContact
      );

      expect(updated.exportData.exporterDetails.exporterCompanyName).toBe(
        'Modified'
      );

      const cloned = await ProcessingStatementService.getDocument(
        cloneDocNumber,
        'Bob',
        testContact
      );

      expect(cloned.exportData.exporterDetails.exporterCompanyName).toBe(
        original.exportData.exporterDetails.exporterCompanyName
      );

      expect(cloned.requestByAdmin).toBe(false);
    });
  });

  describe('voidProcessingStatement', () => {
    const documentNumber = 'GBR-XXXX-PS-XXXXXXXX';
    const contactId = 'contactBob';

    let mockVoidProcessingStatement;

    beforeEach(() => {
      mockVoidProcessingStatement = jest.spyOn(
        ManageCertsService,
        'voidCertificate'
      );
      mockVoidProcessingStatement.mockResolvedValue(true);
    });

    it('will void the Processing Statement matching the given document number', async () => {
      const result = await ProcessingStatementService.voidProcessingStatement(
        documentNumber,
        testUser,
        contactId
      );

      expect(mockVoidProcessingStatement).toHaveBeenCalledWith(
        documentNumber,
        testUser,
        contactId
      );
      expect(mockVoidProcessingStatement).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('will throw an error if the Processing Statement can not be void', async () => {
      mockVoidProcessingStatement.mockResolvedValue(false);

      await expect(() =>
        ProcessingStatementService.voidProcessingStatement(
          documentNumber,
          testUser,
          contactId
        )
      ).rejects.toThrow(
        `Document ${documentNumber} not be voided by user ${testUser}`
      );
    });
  });

  describe('checkDocument', () => {
    it('will return a document if a match exists', async () => {
      await createDocument(null, 'COMPLETE', testUser, 'doc1');

      const result = await ProcessingStatementService.checkDocument(
        'doc1',
        testUser,
        testContact
      );

      expect(result).toBeTruthy();
    });

    it('will return null if no document can be found', async () => {
      const result = await ProcessingStatementService.checkDocument(
        'doc1',
        testUser,
        testContact
      );

      expect(result).toBeFalsy();
    });
  });

  const createDraft = (exportData: ExportData): ProcessingStatement => {
    return {
      documentNumber: 'X',
      status: 'DRAFT',
      createdAt: '',
      createdBy: testUser,
      createdByEmail: '',
      draftData: null,
      exportData: exportData,
      documentUri: '',
      userReference: '',
      requestByAdmin: true,
    };
  };
});
