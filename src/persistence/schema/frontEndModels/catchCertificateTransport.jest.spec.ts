
import * as BackEndModels from "../../schema/catchCert";
import * as FrontEndTransport from "./catchCertificateTransport";

describe("When mapping from a front end transport to a backend transport", () => {

  it("if vehicle is truck then it should contain all relevant properties for truck", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.truck,
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.truck,
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if vehicle is plane then it should contain all relevant properties for plane", () => {

    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumbers: ["Cont Number"],
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumbers: "Cont Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is train then it should contain all relevant properties for train", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if vehicle is container vessel then it should contain all relevant properties for container vessel", () => {

    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumbers: ["Cont Number"],
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState : "UK",
      containerNumbers : "Cont Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is fishing vessel then it should contain all relevant properties for fishing vessel", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.truck
    };

    const expectedResult: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.truck
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if no valid transport vehicle should return null", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: "no valid vehicle type"
    };

    expect(FrontEndTransport.toBackEndTransport(transport)).toStrictEqual(null);

  });

  it("if the optional property  exportDate is included then it should be returned", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if exportLocation property is not provided exportFrom should not be populated", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).not.toHaveProperty('exportFrom');
  });

  it("if exportDate property is not provided it should not be returned", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).not.toHaveProperty('exportDate');
  });

  it("if CMR is not defined for truck transport it should not be mapped", () => {
    const input: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.truck,
    };

    const result = FrontEndTransport.toBackEndTransport(input);

    expect(result).toStrictEqual({
      id: 0,
      vehicle: input.vehicle
    });
  });

  it("if CMR is defined for truck transport it should be converted to boolean for backend storage", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.truck,
      cmr: 'false',
    };
    const result = FrontEndTransport.toBackEndTransport(transport);
    expect(result).toHaveProperty('cmr', false);
  });

  it("if CMR is defined for truck transport and is true it should not map vehicle details", () => {
    const transport: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.truck,
      cmr: 'true',
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.truck,
      cmr: true,
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

});

describe("When mapping from a backend transport to front end transport", () => {

  it("if vehicle is valid", () => {

    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: 'blah'
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toBeNull();
  });

  it("if vehicle is truck then it should contain all the relevant properties for a truck", () => {

    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.truck,
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.truck,
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is plane then it should contain all the relevant properties for a plane", () => {

    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.plane,
      flightNumber: "123456",
      containerNumbers: "123456",
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.plane,
      flightNumber: "123456",
      containerNumbers: ["123456"],
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is train then it should contain all the relevant properties for a train", () => {

    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "12345",
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "12345",
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is container vessel then it should contain all the relevant properties for a container vessel", () => {

    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.containerVessel,
      containerNumbers: "12345",
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      vesselName: "Vessel Name",
      flagState: "UK",
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumbers: ["12345"],
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is fishing vessel then it should contain all the relevant properties for a fishing vessel", () => {

    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.truck
    };

    const expectedResult: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.truck
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if no valid transport vehicle should return null", () => {
    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: "Not a valid vehicle",
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(null);
  });

  it("if valid transport vehicle should return expected results", () => {

    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.containerVessel,
      containerNumbers: "12345",
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      vesselName: "Vessel Name",
      flagState: "UK",
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const expectedResult: FrontEndTransport.CatchCertificateTransport = {
      id: '0',
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumbers: ["12345"],
      departurePlace: "London",
      freightBillNumber: 'AA1234567',
      documents: [{ name: 'name', reference: 'reference' }]
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if CMR is not defined for truck transport it should not be mapped", () => {
    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.truck,
    };

    const actual = FrontEndTransport.toFrontEndTransport(transport);
    expect(actual).toStrictEqual({
      id: '0',
      vehicle: FrontEndTransport.truck,
    });
  });

  it("if CMR is defined it should be converted to string for frontend", () => {
    const transport: BackEndModels.CatchCertificateTransport = {
      id: 0,
      vehicle: FrontEndTransport.truck,
      cmr: true,
    };
    const result = FrontEndTransport.toFrontEndTransport(transport);
    expect(result).toHaveProperty('cmr', 'true');
  });

  it("if CMR is defined and is true it should not map existing vehicle details", () => {
    const transport: BackEndModels.CatchCertificateTruck = {
      id: 0,
      vehicle: FrontEndTransport.truck,
      cmr: true,
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      freightBillNumber: 'AA1234567',
      transportDocuments: [{ name: 'name', reference: 'reference' }]
    };

    const result = FrontEndTransport.toFrontEndTransport(transport);
    expect(result).toStrictEqual({
      id: '0',
      vehicle: FrontEndTransport.truck,
      cmr: 'true',
    });
  });

  it("should split containerIdentificationNumber string to containerNumbers array for truck with multiple containers", () => {
    const transport: BackEndModels.CatchCertificateTruck = {
      id: 0,
      vehicle: FrontEndTransport.truck,
      containerNumbers: "ABCU1234567 DEFJ2345678 GHIZ3456789",
      nationalityOfVehicle: "UK",
      registrationNumber: "ABC123",
      departurePlace: "Dover",
      freightBillNumber: 'FB123',
      transportDocuments: []
    };

    const result = FrontEndTransport.toFrontEndTransport(transport);
    
    expect(result).toHaveProperty('containerNumbers', ["ABCU1234567", "DEFJ2345678", "GHIZ3456789"]);
  });

  it("should split containerNumber string to containerNumbers array for plane with multiple containers", () => {

    const transport: BackEndModels.CatchCertificatePlane = {
      id: 0,
      vehicle: FrontEndTransport.plane,
      flightNumber: "FL123",
      containerNumbers: "ABCU1234567 DEFJ2345678",
      departurePlace: "Heathrow",
      freightBillNumber: 'FB456',
      transportDocuments: []
    };

    const result = FrontEndTransport.toFrontEndTransport(transport);
    
    expect(result).toHaveProperty('containerNumbers', ["ABCU1234567", "DEFJ2345678"]);
  });

  it("should split containerIdentificationNumber string to containerNumbers array for train with multiple containers", () => {

    const transport: BackEndModels.CatchCertificateTrain = {
      id: 0,
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "RB123",
      containerNumbers: "ABCU1234567 DEFJ2345678 GHIZ3456789",
      departurePlace: "Station",
      freightBillNumber: 'FB789',
      transportDocuments: []
    };

    const result = FrontEndTransport.toFrontEndTransport(transport);
    
    expect(result).toHaveProperty('containerNumbers', ["ABCU1234567", "DEFJ2345678", "GHIZ3456789"]);
  });

  it("should split containerNumber string to containerNumbers array for containerVessel with multiple containers", () => {

    const transport: BackEndModels.CatchCertificateContainerVessel = {
      id: 0,
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Ship Name",
      flagState: "UK",
      containerNumbers: "ABCU1234567 DEFJ2345678",
      departurePlace: "Port",
      freightBillNumber: 'FB999',
      transportDocuments: []
    };

    const result = FrontEndTransport.toFrontEndTransport(transport);
    
    expect(result).toHaveProperty('containerNumbers', ["ABCU1234567", "DEFJ2345678"]);
  });

});