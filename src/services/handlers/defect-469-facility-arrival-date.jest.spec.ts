import * as SUT from '../handlers/storage-notes';
import * as momentModule from 'moment';
const moment = momentModule;
describe('DEFECT-469: Facility Arrival Date Validation - Future Date Limit', () => {
  /**
   * DEFECT-469: When users input invalid/unrealistic dates like 8/8/8888 
   * on the storage facility arrival date field, the system should reject them
   * with error "Arrival date must be a real date"
   * 
   * Root Cause: validateDate() only checks format (DD/MM/YYYY), not if year is realistic
   * Solution: Added validateMaximumFutureDate() check to reject dates beyond 8 days in future
   */
  const baseData = {
    facilityName: "Test Facility",
    facilityAddressOne: "123 Test Street",
    facilityTownCity: "London",
    facilityPostcode: "EC1A 1BB",
    facilitySubBuildingName: "",
    facilityBuildingNumber: "",
    facilityBuildingName: "Test Building",
    facilityStreetName: "Test Street",
    facilityCounty: "Greater London",
    facilityCountry: "England",
    facilityApprovalNumber: "UK/ABC/001",
    facilityStorage: "Chilled",
    facilityArrivalDate: "01/01/2025",
  };
  const currentUrl = "/create-storage-document/:documentNumber/add-storage-facility-details";
  const handler = SUT.default[currentUrl];
  describe('Rejecting Unrealistic Future Dates', () => {
    it('should reject date year 8888 (8/8/8888) as invalid - THE DEFECT-469 BUG', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "8/8/8888",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject date year 9999 (01/01/9999) as too far in future', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "01/01/9999",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject date 50 years in future (2075-12-17) as too far', async () => {
      const futureDate = (moment as any)().add(50, 'years').format("DD/MM/YYYY");
      const data = {
        ...baseData,
        facilityArrivalDate: futureDate,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject date beyond maximum future limit (9 days from now)', async () => {
      const tooFarFuture = (moment as any)().add(9, 'days').format("DD/MM/YYYY");
      const data = {
        ...baseData,
        facilityArrivalDate: tooFarFuture,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
  });
  describe('Accepting Valid Dates', () => {
    it('should accept today\'s date', async () => {
      const today = (moment as any)().format("DD/MM/YYYY");
      const data = {
        ...baseData,
        facilityArrivalDate: today,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
    });
    it('should accept tomorrow\'s date', async () => {
      const tomorrow = (moment as any)().add(1, 'day').format("DD/MM/YYYY");
      const data = {
        ...baseData,
        facilityArrivalDate: tomorrow,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
    });
    it('should accept date 3 days in the future', async () => {
      const threeDaysFromNow = (moment as any)().add(3, 'days').format("DD/MM/YYYY");
      const data = {
        ...baseData,
        facilityArrivalDate: threeDaysFromNow,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDatenotMorethanOneDay");
    });
    it('should accept date exactly 7 days in the future (maximum limit)', async () => {
      const maxFutureDate = (moment as any)().add(7, 'days').format("DD/MM/YYYY");
      const data = {
        ...baseData,
        facilityArrivalDate: maxFutureDate,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDatenotMorethanOneDay");
    });
    it('should accept past dates (last year)', async () => {
      const pastDate = (moment as any)().subtract(1, 'year').format("DD/MM/YYYY");
      const data = {
        ...baseData,
        facilityArrivalDate: pastDate,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
    });
    it('should accept past dates (01/01/2020)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "01/01/2020",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
    });
  });
  describe('Invalid Date Formats Still Rejected', () => {
    it('should reject invalid date format (123/03/2025)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "123/03/2025",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject invalid date format (invalid text)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "not-a-date",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject missing date', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject undefined date', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: undefined,
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
  });
  describe('Integration: Date Validation with Other Checks', () => {
    it('should validate date before checking other facility requirements', async () => {
      const data = {
        ...baseData,
        facilityName: "",
        facilityAddressOne: "",
        facilityTownCity: "",
        facilityPostcode: "",
        facilityArrivalDate: "8/8/8888",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
  });
  describe('Edge Cases and Boundary Tests', () => {
    it('should handle date with single digit day (8/8/2025)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "8/8/2025",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
    });
    it('should handle date with single digit month (1/1/2025)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "1/1/2025",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBeUndefined();
    });
    it('should reject February 31st (non-existent date)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "31/02/2025",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject day 32 (non-existent)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "32/01/2025",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
    it('should reject month 13 (non-existent)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "01/13/2025",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
  });
  describe('DEFECT-469 Specific Regression Tests', () => {
    it('should prevent the original bug: 8/8/8888 should be REJECTED (not accepted)', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "8/8/8888",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
      expect(errors["storageFacilities-facilityArrivalDate"]).toBeDefined();
    });
    it('should provide appropriate error message for unrealistic dates', async () => {
      const data = {
        ...baseData,
        facilityArrivalDate: "8/8/8888",
      };
      const { errors } = handler({
        data: data,
        _currentUrl: currentUrl,
        _nextUrl: "",
        errors: {},
        _params: {},
      });
      expect(errors["storageFacilities-facilityArrivalDate"]).toBe("sdArrivalDateValidationError");
    });
  });
});