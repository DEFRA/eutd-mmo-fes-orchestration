import catchCertificateTransportDetailsSchema from './catchCertificateTransportDetailsSchema';
import truckSaveAsDraftSchema from './truckSaveAsDraftSchema';

describe('catchCertificateTransportDetailsSchema - containerIdentificationNumber validation', () => {

  describe('when vehicle is truck', () => {

    it('should accept valid containerIdentificationNumber with letters, numbers and spaces', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABCD1234567',
        departurePlace: 'Dover',
        freightBillNumber: 'FB123'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept containerIdentificationNumber with spaces', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABC 123 XYZ',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept empty containerIdentificationNumber', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: '',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept null containerIdentificationNumber', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: null,
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should accept missing containerIdentificationNumber', () => {
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

    it('should reject containerIdentificationNumber exceeding 150 characters', () => {
      const longValue = 'A'.repeat(151);
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: longValue,
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.max');
    });

    it('should reject containerIdentificationNumber with special characters', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABC!@#123',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should reject containerIdentificationNumber with hyphens', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABC-123',
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('error.containerIdentificationNumber.string.pattern.base');
    });

    it('should reject containerIdentificationNumber with underscores', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerIdentificationNumber: 'ABC_123',
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
        containerIdentificationNumber: '  ABCD1234567  ',
        departurePlace: 'Dover'
      };

      const { error, value } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
      expect(value.containerIdentificationNumber).toBe('ABCD1234567');
    });
  });

  describe('when vehicle is not truck', () => {

    it('should forbid containerIdentificationNumber for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT123',
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
        containerIdentificationNumber: 'ABCD1234567',
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
      expect(error?.message).toContain('error.containerIdentificationNumber.string.max');
    });

    it('should accept containerIdentificationNumber for train with spaces', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerIdentificationNumber: 'ABC 123',
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
        containerNumber: 'CONT123',
        containerIdentificationNumber: 'ABCD1234567',
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerIdentificationNumber');
    });
  });
});

describe('catchCertificateTransportDetailsSchema - containerNumbers validation', () => {

  describe('when vehicle is truck', () => {

    it('should accept valid containerNumbers array with alphanumeric values', () => {
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

    it('should accept containerNumbers array with max 10 items', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject containerNumbers array exceeding 10 items', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers');
    });

    it('should accept each containerNumber with max 50 characters', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['A'.repeat(50)],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should reject containerNumber exceeding 50 characters', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['A'.repeat(51)],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers[0]');
    });

    it('should reject containerNumbers with special characters', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['CONT@#$'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers[0]');
    });

    it('should reject containerNumbers with spaces', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['CONT 001'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers[0]');
    });

    it('should reject containerNumbers with hyphens', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['CONT-001'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers[0]');
    });

    it('should accept empty containerNumbers array', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: [],
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

    it('should trim whitespace from each containerNumber', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['  CONT001  ', '  CONT002  '],
        departurePlace: 'Dover'
      };

      const { error, value } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
      expect(value.containerNumbers).toEqual(['CONT001', 'CONT002']);
    });

    it('should allow empty string in containerNumbers array', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['CONT001', ''],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeUndefined();
    });

    it('should validate each containerNumber individually and return specific error keys', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'truck',
        nationalityOfVehicle: 'United Kingdom',
        registrationNumber: 'ABC123',
        containerNumbers: ['CONT001', 'CONT@@@', 'CONT003'],
        departurePlace: 'Dover'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers[1]');
    });
  });

  describe('when vehicle is not truck', () => {

    it('should forbid containerNumbers for plane', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'plane',
        flightNumber: 'FL123',
        containerNumber: 'CONT123',
        containerNumbers: ['CONT001'],
        departurePlace: 'Heathrow'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers');
    });

    it('should forbid containerNumbers for train', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'train',
        railwayBillNumber: 'RB123',
        containerNumbers: ['CONT001'],
        departurePlace: 'Station'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers');
    });

    it('should forbid containerNumbers for containerVessel', () => {
      const payload = {
        id: 'transport-123',
        vehicle: 'containerVessel',
        vesselName: 'Ship Name',
        flagState: 'UK',
        containerNumber: 'CONT123',
        containerNumbers: ['CONT001'],
        departurePlace: 'Port'
      };

      const { error } = catchCertificateTransportDetailsSchema.validate(payload);

      expect(error).toBeDefined();
      expect(error?.message).toContain('containerNumbers');
    });
  });
});

describe('truckSaveAsDraftSchema - containerIdentificationNumber validation', () => {

  it('should accept valid containerIdentificationNumber', () => {
    const payload = {
      vehicle: 'truck',
      nationalityOfVehicle: 'United Kingdom',
      registrationNumber: 'ABC123',
      containerIdentificationNumber: 'ABCD1234567',
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

  it('should reject containerIdentificationNumber with invalid characters', () => {
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

  it('should allow containerIdentificationNumber with spaces', () => {
    const payload = {
      vehicle: 'truck',
      containerIdentificationNumber: 'ABC 123 XYZ'
    };

    const { error } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined();
  });

  it('should trim whitespace from containerIdentificationNumber', () => {
    const payload = {
      vehicle: 'truck',
      containerIdentificationNumber: '  ABCD1234567  '
    };

    const { error, value } = truckSaveAsDraftSchema.validate(payload);

    expect(error).toBeUndefined();
    expect(value.containerIdentificationNumber).toBe('ABCD1234567');
  });
});

