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
        containerNumbers: ['CONT001', 'CONT002', 'CONT003'],
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
      expect(error?.message).toContain('containerNumbers[0]');
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
      expect(error?.message).toContain('containerNumbers[0]');
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
      expect(error?.message).toContain('containerNumbers[0]');
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
      expect(error?.message).toContain('containerNumbers[0]');
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

  describe('when vehicle is not truck', () => {

    it('should forbid containerNumbers for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT123',
        containerNumbers: ['ABCD1234567'],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers');
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

    it('should accept valid containerNumber in ISO 6346 format', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'ABCU1234567',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerNumber with U, J, Z, or R category', () => {
      const testCases = ['ABCU1234567', 'ABCJ1234567', 'ABCZ1234567', 'ABCR1234567'];
      
      testCases.forEach(containerNumber => {
        const payload = {
          id: 'transport-123',
          vehicle: 'containerVessel',
          vesselName: 'Ship Name',
          flagState: 'UK',
          containerNumber: containerNumber,
          departurePlace: 'Port'
        };

        const { error } = catchCertificateTransportDetailsSchema.validate(payload);

        expect(error).toBeUndefined();
      });
    });

    it('should reject containerNumber with invalid format', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'CONT123',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerNumber.string.pattern.base');
    });

    it('should reject containerNumber with spaces', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'ABC U123 4567',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerNumber.string.pattern.base');
    });

    it('should reject containerNumber with lowercase letters', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'abcu1234567',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerNumber.string.pattern.base');
    });

    it('should reject containerNumber with wrong length', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'ABCU123456',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerNumber.string.pattern.base');
    });

    it('should reject containerNumber with invalid category', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'ABCA1234567',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerNumber.string.pattern.base');
    });
  });

  describe('when vehicle is plane', () => {

    it('should accept valid containerNumber in alphanumeric format for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT123',
        departurePlace: 'Airport'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject containerNumber with special characters for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT@123',
        departurePlace: 'Airport'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
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

  it('should reject containerIdentificationNumber with invalid format', () => {
    const payload = {
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: 'ABC!@#123',
      departurePlace: 'Dover'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeDefined();
    expect(error?.details[0].message).toMatch(/pattern|match/i);
  });

  it('should reject containerIdentificationNumber with spaces', () => {
    const payload = {
      vehicle: 'truck',
      containerIdentificationNumber: 'ABC 123 XYZ'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeDefined();
    expect(error?.details[0].message).toMatch(/pattern|match/i);
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

