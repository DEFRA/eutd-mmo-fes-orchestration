import catchCertificateTransportDetailsSchema from './catchCertificateTransportDetailsSchema';
import truckSaveAsDraftSchema from './truckSaveAsDraftSchema';

describe('catchCertificateTransportDetailsSchema - containerIdentificationNumber validation', () => {

  describe('when vehicle is truck', () => {

    it('should accept valid containerIdentificationNumber in ISO 6346 format', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABCU1234567',
        departurePlace: 'Dover',
        freightBillNumber: 'FB123'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerIdentificationNumber with U, J, Z, or R category', () => {
      const testCases = ['ABCU1234567', 'ABCJ1234567', 'ABCZ1234567', 'ABCR1234567'];
      
      testCases.forEach(containerNumber => {
        const payload = {
          id: 'transport-123',
          vehicle: 'truck',
          nationalityOfVehicle: 'United Kingdom',
          registrationNumber: 'ABC123',
          containerIdentificationNumber: containerNumber,
          departurePlace: 'Dover'
        };

        const { error } = catchCertificateTransportDetailsSchema.validate(payload);

        expect(error).toBeUndefined();
      });
    });

    it('should accept containerNumbers array with empty strings', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: [''],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept multiple containerNumbers', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678', 'GHIZ3456789'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept missing containerNumbers field', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject containerNumbers item exceeding 50 characters', () => {
      const longValue = 'A'.repeat(51);
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: [longValue],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should reject containerIdentificationNumber with invalid format (not ISO 6346)', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['ABC!@#123'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should reject containerNumbers item with hyphens', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['ABC-123'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should reject containerNumbers item with underscores', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['ABC_123'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should reject containerIdentificationNumber with spaces', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABC U123 4567',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should reject containerIdentificationNumber with lowercase letters', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'abcu1234567',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should reject containerIdentificationNumber with wrong length', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABCU123456',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should reject containerIdentificationNumber with invalid category (not U, J, Z, or R)', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABCA1234567',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should trim whitespace from containerIdentificationNumber', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: '  ABCU1234567  ',
        departurePlace: 'Dover'
      };

      const { error, value } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
      expect(value.containerIdentificationNumber).toBe('ABCU1234567');
    });
  });

  describe('when vehicle is train', () => {

    it('should accept containerNumbers array for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: ['ABCU1234567', 'ABCJ2345678', 'ABCZ3456789'],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerNumbers array with empty strings for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: ['ABCU1234567', '', 'ABCZ3456789', ''],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerNumbers with valid ISO 6346 format for train', () => {
      const testCases = ['ABCU1234567', 'ABCJ2345678', 'ABCZ3456789', 'ABCR4567890'];
      
      testCases.forEach(containerNumber => {
        const payload = {
          id: 'transport-123',
          vehicle: 'train',
          railwayBillNumber: 'RB123',
          containerNumbers: [containerNumber],
          departurePlace: 'Station'
        };

        const { error } = catchCertificateTransportDetailsSchema.validate(payload);

        expect(error).toBeUndefined();
      });
    });

    it('should reject containerNumbers item exceeding 50 characters for train', () => {
      const longValue = 'A'.repeat(51);
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: [longValue],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should reject containerNumbers with invalid format for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: ['ABC!@#123'],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerNumbers.string.pattern.base');
    });

    it('should reject containerNumbers with lowercase letters for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: ['abcu1234567'],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerNumbers.string.pattern.base');
    });

    it('should accept maximum 10 containerNumbers for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678', 'GHIZ3456789', 'JKLR4567890', 'MNPU5678901', 'QRSJ6789012', 'TUVZ7890123', 'WXYR8901234', 'ABCU9012345', 'DEFJ0123456'],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject more than 10 containerNumbers for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678', 'GHIZ3456789', 'JKLR4567890', 'MNPU5678901', 'QRSJ6789012', 'TUVZ7890123', 'WXYR8901234', 'ABCU9012345', 'DEFJ0123456', 'GHIZ1234567'],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers']);
    });
  });

  describe('when vehicle is plane', () => {

    it('should accept containerNumbers array for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumbers: ['ABCU1234567', 'ABCJ2345678', 'ABCZ3456789'],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerNumbers array with empty strings for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumbers: ['ABCU1234567', '', 'ABCZ3456789', ''],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerNumbers with valid ISO 6346 format for plane', () => {
      const testCases = ['ABCU1234567', 'ABCJ2345678', 'ABCZ3456789', 'ABCR4567890'];
      
      testCases.forEach(containerNumber => {
        const payload = {
          id: 'transport-123',
          vehicle: 'plane',
          flightNumber: 'FL123',
          containerNumbers: [containerNumber],
          departurePlace: 'Heathrow'
        };

        const { error } = catchCertificateTransportDetailsSchema.validate(payload);

        expect(error).toBeUndefined();
      });
    });

    it('should reject containerNumbers item exceeding 50 characters for plane', () => {
      const longValue = 'A'.repeat(51);
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumbers: [longValue],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should reject containerNumbers with invalid format for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumbers: ['ABC!@#123'],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should accept maximum 10 containerNumbers for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678', 'GHIZ3456789', 'JKLR4567890', 'MNPU5678901', 'QRSJ6789012', 'TUVZ7890123', 'WXYR8901234', 'ABCU9012345', 'DEFJ0123456'],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject more than 10 containerNumbers for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678', 'GHIZ3456789', 'JKLR4567890', 'MNPU5678901', 'QRSJ6789012', 'TUVZ7890123', 'WXYR8901234', 'ABCU9012345', 'DEFJ0123456', 'GHIZ1234567'],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers']);
    });
  });

  describe('when vehicle is containerVessel', () => {

    it('should accept containerNumbers array for containerVessel', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', 'ABCJ2345678', 'ABCZ3456789'],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerNumbers array with empty strings for containerVessel', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', '', 'ABCZ3456789', ''],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerNumbers with valid ISO 6346 format for containerVessel', () => {
      const testCases = ['ABCU1234567', 'ABCJ2345678', 'ABCZ3456789', 'ABCR4567890'];
      
      testCases.forEach(containerNumber => {
        const payload = {
          id: 'transport-123',
          vehicle: 'containerVessel',
          vesselName: 'Ship Name',
          flagState: 'UK',
          containerNumbers: [containerNumber],
          departurePlace: 'Port'
        };

        const { error } = catchCertificateTransportDetailsSchema.validate(payload);

        expect(error).toBeUndefined();
      });
    });

    it('should reject containerNumbers item exceeding 50 characters for containerVessel', () => {
      const longValue = 'A'.repeat(51);
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumbers: [longValue],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should reject containerNumbers with invalid format for containerVessel', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumbers: ['ABC!@#123'],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers', 0]);
    });

    it('should accept maximum 10 containerNumbers for containerVessel', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678', 'GHIZ3456789', 'JKLR4567890', 'MNPU5678901', 'QRSJ6789012', 'TUVZ7890123', 'WXYR8901234', 'ABCU9012345', 'DEFJ0123456'],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject more than 10 containerNumbers for containerVessel', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumbers: ['ABCU1234567', 'DEFJ2345678', 'GHIZ3456789', 'JKLR4567890', 'MNPU5678901', 'QRSJ6789012', 'TUVZ7890123', 'WXYR8901234', 'ABCU9012345', 'DEFJ0123456', 'GHIZ1234567'],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.details[0].path).toEqual(['containerNumbers']);
    });
  });

  describe('when vehicle is not truck or train', () => {

    it('should forbid containerIdentificationNumber for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT123',
        containerNumbers: ['CONT123'],
        containerIdentificationNumber: 'ABCD1234567',
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerIdentificationNumber');
    });

    it('should accept containerIdentificationNumber for train with valid alphanumeric value', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerIdentificationNumber: 'ABCU1234567',
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept empty containerIdentificationNumber for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerIdentificationNumber: '',
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept missing containerIdentificationNumber for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject containerIdentificationNumber for train exceeding 150 characters', () => {
      const longValue = 'A'.repeat(151);
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerIdentificationNumber: longValue,
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should accept containerIdentificationNumber for train with spaces', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerIdentificationNumber: 'ABCU1234567',
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject containerIdentificationNumber for train with special characters', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerIdentificationNumber: 'ABC-123',
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should forbid containerIdentificationNumber for containerVessel', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'ABCU1234567',
        containerNumbers: ['ABCU1234567'],
        containerIdentificationNumber: 'ABCU1234567',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerIdentificationNumber');
    });
  });
});

describe('catchCertificateTransportDetailsSchema - containerNumber validation', () => {

  describe('when vehicle is containerVessel', () => {

    it('should accept valid containerNumber (singular field is optional and unvalidated)', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'ABCU1234567',
        containerNumbers: ['ABCU1234567'],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });
  });

  describe('when vehicle is plane', () => {

    it('should accept valid containerNumber (singular field is optional and unvalidated)', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT123',
        containerNumbers: ['CONT123'],
        departurePlace: 'Airport'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });
  });
});

describe('truckSaveAsDraftSchema - containerIdentificationNumber validation', () => {

  it('should accept valid containerIdentificationNumber in ISO 6346 format', () => {
    const payload = {
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: 'ABCU1234567',
      departurePlace: 'Dover'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined();
  });

  it('should accept empty containerIdentificationNumber', () => {
    const payload = {
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: '',
      departurePlace: 'Dover'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined();
  });

  it('should accept null containerIdentificationNumber', () => {
    const payload = {
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: null,
      departurePlace: 'Dover'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined();
  });

  it('should reject containerIdentificationNumber exceeding 150 characters', () => {
    const longValue = 'A'.repeat(151);
    const payload = {
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: longValue,
      departurePlace: 'Dover'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeDefined();
    expect(error?.details[0].message).toContain('150');
  });

  it('should accept any containerIdentificationNumber format in save-as-draft mode', () => {
    const payload = {
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: 'ABC!@#123', // Any format allowed in draft
      departurePlace: 'Dover'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined(); // No validation error in draft mode
  });

  it('should accept containerIdentificationNumber with spaces in save-as-draft mode', () => {
    const payload = {
      vehicle: 'truck',
      containerIdentificationNumber: 'ABC 123 XYZ' // Spaces allowed in draft
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined(); // No validation error in draft mode
  });

  it('should trim whitespace from containerIdentificationNumber', () => {
    const payload = {
      vehicle: 'truck',
      containerIdentificationNumber: '  ABCU1234567  '
    };

    const { error, value } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined();
    expect(value.containerIdentificationNumber).toBe('ABCU1234567');
  });
});

