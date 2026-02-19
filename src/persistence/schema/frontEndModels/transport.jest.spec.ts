import * as FrontEndTransport from "./transport"
import * as BackEndModels from "../common"


describe("When mapping from a front end transport to a backend transport", () => {

  it("if vehicle is truck then it should contain all relevant properties for truck", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };


    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: false,
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is truck then it should contain all relevant properties for truck with exported to", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: undefined
    };


    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: false,
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here"
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is plane then it should contain all relevant properties for plane", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is plane then it should contain all relevant properties for plane no exportedTo", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: undefined
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      departurePlace: "here"
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is plane then it should contain all relevant fields when provided", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      airwayBillNumber: "AWB123456",
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      containerNumbers: ["CONT1", "CONT2", "CONT3"],
      freightBillNumber: "FB789",
      departurePlace: "here",
      departureCountry: "United Kingdom",
      departurePort: "London Heathrow",
      departureDate: "01/09/2025",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.plane,
      airwayBillNumber: "AWB123456",
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      containerNumbers: "CONT1,CONT2,CONT3",
      freightBillNumber: "FB789",
      departurePlace: "here",
      departureCountry: "United Kingdom",
      departurePort: "London Heathrow",
      departureDate: "01/09/2025",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if vehicle is plane and containerNumbers is empty array then it should not include containerNumbers in backend", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      containerNumbers: [],
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "Fl Number",
      containerNumber: "Cont Number",
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if vehicle is train then it should contain all relevant properties for train", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is train then it should contain all relevant properties for train no exportedTo", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: undefined
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is container vessel then it should contain all relevant properties for container vessel", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumber: "Cont Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumber: "Cont Number",
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is container vessel then it should contain all relevant properties for container vessel and container numbers list", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumbers: ["Cont Number"],
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumbers: "Cont Number",
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is container vessel then it should contain all relevant properties for container vessel exportedTo", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumber: "Cont Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: undefined
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumber: "Cont Number",
      departurePlace: "here"
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is fishing vessel then it should contain all relevant properties for fishing vessel", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.fishingVessel,
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.fishingVessel,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if vehicle is fishing vessel then it should contain all relevant properties for fishing vessel no exported to", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.fishingVessel,
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: undefined
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.fishingVessel
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if no valid transport vehicle should return null", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: "no valid vehicle type",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    expect(FrontEndTransport.toBackEndTransport(transport)).toStrictEqual(null);

  });

  it("if the optional property  exportDate is included then it should be returned", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportDate: " some date ",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      exportDate: " some date ",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);

  });

  it("if exportLocation property is not provided exportFrom should not be populated", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
      exportDate: " some date ",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).not.toHaveProperty('exportFrom');
  });

  it("if exportDate property is not provided it should not be returned", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "Rwy Number",
      departurePlace: "here",
      user_id: "UID",
      journey: "Journey",
      currentUri: "some/uri",
      nextUri: "next/uri",
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).not.toHaveProperty('exportDate');
  });

  it("if CMR is not defined it should not be returned", () => {
    const input: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(input);

    expect(result).toStrictEqual({
      vehicle: input.vehicle,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
  });

  it("if CMR is anything other than 'true' it should be false", () => {
    const input: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: 'yes',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(input);

    expect(result).toStrictEqual({
      vehicle: input.vehicle,
      cmr: false,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
  });

  it("if CMR is true, we should remove the nationalityOfVehicle, registrationNumber, and departurePlace properties", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "true",
      nationalityOfVehicle: "UK",
      registrationNumber: "REG Number",
      departurePlace: "here",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };


    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: true,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if vehicle is truck with containerIdentificationNumber then it should be included in backend transport", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "UK",
      registrationNumber: "REG123",
      containerIdentificationNumber: "ABCD1234567",
      departurePlace: "Dover",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "ES",
        isoCodeAlpha3: "ESP",
        isoNumericCode: "724"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: false,
      nationalityOfVehicle: "UK",
      registrationNumber: "REG123",
      containerIdentificationNumber: "ABCD1234567",
      departurePlace: "Dover",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "ES",
        isoCodeAlpha3: "ESP",
        isoNumericCode: "724"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
  });

  it("if vehicle is truck without containerIdentificationNumber then it should not be in backend transport", () => {
    const transport: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "UK",
      registrationNumber: "REG123",
      departurePlace: "Dover",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "ES",
        isoCodeAlpha3: "ESP",
        isoNumericCode: "724"
      }
    };

    const expectedResult: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: false,
      nationalityOfVehicle: "UK",
      registrationNumber: "REG123",
      departurePlace: "Dover",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "ES",
        isoCodeAlpha3: "ESP",
        isoNumericCode: "724"
      }
    };

    const result = FrontEndTransport.toBackEndTransport(transport);

    expect(result).toStrictEqual(expectedResult);
    expect(result).not.toHaveProperty('containerIdentificationNumber');
  });
});

describe("When mapping from a backend transport to front end transport", () => {

  it("should return empty object if transport is undefined", () => {
    const transport = undefined;

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual({
      vehicle: '',
      exportedTo: {
        officialCountryName: '',
        isoCodeAlpha2: '',
        isoCodeAlpha3: '',
        isoNumericCode: '',
      },
      exportDate: '',
      departureDate: '',
      containerNumbers: []
    });
  });

  it("if vehicle is truck and cmr is true then it should contain all the relevant properties for a truck", () => {
    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
      exportedFrom: "United Kingdom",
      cmr: true,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "true",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      exportDate: "",
      departureDate: "",
      containerNumbers: []
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is truck and cmr is false then it should contain all the relevant properties for a truck", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      exportedFrom: "United Kingdom",
      cmr: false,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      exportDate: "",
      departureDate: "",
      containerNumbers: []
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is plane then it should contain all the relevant properties for a plane", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "123456",
      containerNumber: "123456",
      departurePlace: "London",
      exportedFrom: "United Kingdom",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "123456",
      containerNumber: "123456",
      departurePlace: "London",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      exportDate: "",
      departureDate: "",
      containerNumbers: []
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is plane then it should contain all relevant fields when present", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "123456",
      containerNumber: "123456",
      containerNumbers: "CONT1,CONT2,CONT3",
      departurePlace: "London",
      departureCountry: "United Kingdom",
      departurePort: "London Heathrow",
      departureDate: "01/09/2025",
      airwayBillNumber: "AWB123456",
      freightBillNumber: "FB789",
      exportDate: "02/09/2025",
      exportedFrom: "United Kingdom",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: "123456",
      airwayBillNumber: "AWB123456",
      freightBillNumber: "FB789",
      containerNumber: "123456",
      containerNumbers: ["CONT1", "CONT2", "CONT3"],
      departurePlace: "London",
      exportDate: "02/09/2025",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      departureCountry: "United Kingdom",
      departurePort: "London Heathrow",
      departureDate: "01/09/2025"
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is train then it should contain all the relevant properties for a train", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "12345",
      departurePlace: "London",
      exportedFrom: "United Kingdom",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: "12345",
      departurePlace: "London",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      exportDate: "",
      departureDate: "",
      containerNumbers: []
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is container vessel then it should contain all the relevant properties for a container vessel", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      containerNumber: "12345",
      departurePlace: "London",
      exportedFrom: "United Kingdom",
      vesselName: "Vessel Name",
      flagState: "UK",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumber: "12345",
      departurePlace: "London",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      exportDate: "",
      departureDate: "",
      containerNumbers: []
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is container vessel then it should contain all the relevant properties for a container vessel with container numbers", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      containerNumbers: "12345",
      departurePlace: "London",
      exportedFrom: "United Kingdom",
      vesselName: "Vessel Name",
      flagState: "UK",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumbers: ["12345"],
      departurePlace: "London",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      exportDate: "",
      departureDate: ""
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if vehicle is fishing vessel then it should contain all the relevant properties for a fishing vessel", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.fishingVessel,
      exportedFrom: "somewhere",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.fishingVessel,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      exportDate: ""
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if no valid transport vehicle should return null", () => {
    const transport: BackEndModels.Transport = {
      vehicle: "Not a valid vehicle",
      exportedFrom: "somewhere",
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(null);
  });

  it("if valid transport vehicle should return expected results", () => {

    const transport: BackEndModels.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      containerNumber: "12345",
      departurePlace: "London",
      exportedFrom: "United Kingdom",
      vesselName: "Vessel Name",
      flagState: "UK",
      exportDate: "02/09/2025",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    const expectedResult: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: "Vessel Name",
      flagState: "UK",
      containerNumber: "12345",
      departurePlace: "London",
      exportDate: "02/09/2025",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      },
      departureDate: "",
      containerNumbers: []
    };

    expect(FrontEndTransport.toFrontEndTransport(transport)).toStrictEqual(expectedResult);
  });

  it("if CMR is not defined it should not be returned", () => {
    const input: BackEndModels.Transport = {
      vehicle: FrontEndTransport.truck,
    };

    const result = FrontEndTransport.toFrontEndTransport(input);

    expect(result).not.toHaveProperty('cmr');
  });

});

describe('checkTransportDataFrontEnd', () => {

  it('should return an empty transport object', () => {
    expect(FrontEndTransport.checkTransportDataFrontEnd(undefined)).toStrictEqual({
      vehicle: '',
      exportedTo: {
        officialCountryName: '',
        isoCodeAlpha2: '',
        isoCodeAlpha3: '',
        isoNumericCode: '',
      }
    })
  });

  it('should return null', () => {
    expect(FrontEndTransport.checkTransportDataFrontEnd({ vehicle: '' })).toBeNull()
  });

  const shouldReturnFullObject = (fullObject: FrontEndTransport.Transport) =>
    it('should return full object when all data is valid', () => {
      expect(FrontEndTransport.checkTransportDataFrontEnd(fullObject)).toStrictEqual(fullObject)
    });

  const shouldReturnBaseValidObject = (baseValidObject: FrontEndTransport.Transport, incompleteObject: FrontEndTransport.Transport) =>
    it('should return base valid object if data is incomplete', () => {
      expect(FrontEndTransport.checkTransportDataFrontEnd(incompleteObject)).toStrictEqual(baseValidObject)
    });

  describe('when vehicle type is Truck', () => {

    const fullValidObjectNoCmr: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      exportDate: "some date",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };
    const fullValidObjectWithCmr: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "true",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };
    const baseValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };
    const baseValidCmrObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    shouldReturnFullObject(fullValidObjectNoCmr);
    shouldReturnFullObject(fullValidObjectWithCmr);
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.truck,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidCmrObject, {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      registrationNumber: "WE78ERF",
      departurePlace: "London",
      exportDate: "some date",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidCmrObject, {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "British",
      departurePlace: "London",
      exportDate: "some date",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidCmrObject, {
      vehicle: FrontEndTransport.truck,
      cmr: "false",
      nationalityOfVehicle: "British",
      registrationNumber: "WE78ERF",
      exportDate: "some date",
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });

    it('should return base valid object when cmr is undefined and required fields are complete', () => {
      const fullValidObjectNoCmrUndefined: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.truck,
        nationalityOfVehicle: "British",
        registrationNumber: "WE78ERF",
        departurePlace: "London",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      };
      expect(FrontEndTransport.checkTransportDataFrontEnd(fullValidObjectNoCmrUndefined)).toStrictEqual(fullValidObjectNoCmrUndefined);
    });

    it('should return base valid object when cmr is undefined and some required fields are missing', () => {
      const incompleteObjectNoCmrUndefined: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.truck,
        nationalityOfVehicle: "British",
        registrationNumber: "WE78ERF",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      };
      const expectedBaseObject: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.truck,
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "A1",
          isoCodeAlpha3: "A3",
          isoNumericCode: "SP"
        }
      };
      expect(FrontEndTransport.checkTransportDataFrontEnd(incompleteObjectNoCmrUndefined)).toStrictEqual(expectedBaseObject);
    });
  });

  describe('when vehicle type is plane', () => {

    const fullValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      flightNumber: 'flight number',
      containerNumber: 'cont. number',
      containerNumbers: ['cont. number'],
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };
    const baseValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.plane,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    shouldReturnFullObject(fullValidObject);
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.plane,
      containerNumber: 'cont. number',
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.plane,
      flightNumber: 'flight number',
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.plane,
      flightNumber: 'flight number',
      containerNumber: 'cont. number',
      containerNumbers: ['cont. number'],
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
  });

  describe('when vehicle type is train', () => {

    const fullValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: 'rail way num',
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };
    const baseValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.train,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    shouldReturnFullObject(fullValidObject);
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.train,
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.train,
      railwayBillNumber: 'rail way num',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
  });

  describe('when vehicle type is container vessel', () => {

    const fullValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: 'vessel name',
      flagState: 'some flag name',
      containerNumber: 'container number',
      containerNumbers: ['cont. number'],
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };
    const baseValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.containerVessel,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    shouldReturnFullObject(fullValidObject);
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.containerVessel,
      flagState: 'some flag name',
      containerNumber: 'container number',
      containerNumbers: ['cont. number'],
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: 'vessel name',
      containerNumber: 'container number',
      containerNumbers: ['cont. number'],
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: 'vessel name',
      flagState: 'some flag name',
      departurePlace: 'here or there',
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.containerVessel,
      vesselName: 'vessel name',
      flagState: 'some flag name',
      containerNumber: 'container number',
      containerNumbers: ['cont. number'],
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
  });

  describe('when vehicle type is fishing vessel', () => {

    const fullValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.fishingVessel,
      exportDate: 'some date',
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };
    const baseValidObject: FrontEndTransport.Transport = {
      vehicle: FrontEndTransport.fishingVessel,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    };

    shouldReturnFullObject(fullValidObject);
    shouldReturnBaseValidObject(baseValidObject, {
      vehicle: FrontEndTransport.fishingVessel,
      exportedTo: {
        officialCountryName: "SPAIN",
        isoCodeAlpha2: "A1",
        isoCodeAlpha3: "A3",
        isoNumericCode: "SP"
      }
    });
  })
});

describe("When mapping transport with pointOfDestination field", () => {

  describe("truck transport", () => {
    it("should include pointOfDestination in backend transport when provided", () => {
      const transport: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.truck,
        cmr: "false",
        nationalityOfVehicle: "UK",
        registrationNumber: "REG123",
        departurePlace: "London",
        pointOfDestination: "Port of Rotterdam",
        user_id: "UID",
        journey: "Journey",
        currentUri: "some/uri",
        nextUri: "next/uri",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "ES",
          isoCodeAlpha3: "ESP",
          isoNumericCode: "724"
        }
      };

      const expectedResult: BackEndModels.Transport = {
        vehicle: FrontEndTransport.truck,
        cmr: false,
        nationalityOfVehicle: "UK",
        registrationNumber: "REG123",
        departurePlace: "London",
        pointOfDestination: "Port of Rotterdam",
        exportedTo: {
          officialCountryName: "SPAIN",
          isoCodeAlpha2: "ES",
          isoCodeAlpha3: "ESP",
          isoNumericCode: "724"
        }
      };

      const result = FrontEndTransport.toBackEndTransport(transport);
      expect(result).toStrictEqual(expectedResult);
    });

    it("should omit pointOfDestination from backend transport when not provided", () => {
      const transport: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.truck,
        cmr: "true",
        nationalityOfVehicle: "FR",
        registrationNumber: "FR456",
        departurePlace: "Paris",
        user_id: "UID",
        journey: "Journey",
        currentUri: "some/uri",
        nextUri: "next/uri"
      };

      const result = FrontEndTransport.toBackEndTransport(transport);
      expect(result.pointOfDestination).toBeUndefined();
    });
  });

  describe("plane transport", () => {
    it("should include pointOfDestination in backend transport when provided", () => {
      const transport: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.plane,
        flightNumber: "FL123",
        containerNumber: "CONT456",
        departurePlace: "London Heathrow",
        pointOfDestination: "Charles de Gaulle Airport",
        user_id: "UID",
        journey: "Journey",
        currentUri: "some/uri",
        nextUri: "next/uri",
        exportedTo: {
          officialCountryName: "FRANCE",
          isoCodeAlpha2: "FR",
          isoCodeAlpha3: "FRA",
          isoNumericCode: "250"
        }
      };

      const expectedResult: BackEndModels.Transport = {
        vehicle: FrontEndTransport.plane,
        flightNumber: "FL123",
        containerNumber: "CONT456",
        departurePlace: "London Heathrow",
        pointOfDestination: "Charles de Gaulle Airport",
        exportedTo: {
          officialCountryName: "FRANCE",
          isoCodeAlpha2: "FR",
          isoCodeAlpha3: "FRA",
          isoNumericCode: "250"
        }
      };

      const result = FrontEndTransport.toBackEndTransport(transport);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe("train transport", () => {
    it("should include pointOfDestination in backend transport when provided", () => {
      const transport: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.train,
        railwayBillNumber: "RB789",
        departurePlace: "London St Pancras",
        pointOfDestination: "Gare du Nord Paris",
        user_id: "UID",
        journey: "Journey",
        currentUri: "some/uri",
        nextUri: "next/uri",
        exportedTo: {
          officialCountryName: "FRANCE",
          isoCodeAlpha2: "FR",
          isoCodeAlpha3: "FRA",
          isoNumericCode: "250"
        }
      };

      const expectedResult: BackEndModels.Transport = {
        vehicle: FrontEndTransport.train,
        railwayBillNumber: "RB789",
        departurePlace: "London St Pancras",
        pointOfDestination: "Gare du Nord Paris",
        exportedTo: {
          officialCountryName: "FRANCE",
          isoCodeAlpha2: "FR",
          isoCodeAlpha3: "FRA",
          isoNumericCode: "250"
        }
      };

      const result = FrontEndTransport.toBackEndTransport(transport);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe("containerVessel transport", () => {
    it("should include pointOfDestination in backend transport when provided", () => {
      const transport: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.containerVessel,
        vesselName: "MS Maersk",
        flagState: "Denmark",
        containerNumber: "CONT123",
        departurePlace: "Port of Southampton",
        pointOfDestination: "Port of Le Havre",
        user_id: "UID",
        journey: "Journey",
        currentUri: "some/uri",
        nextUri: "next/uri",
        exportedTo: {
          officialCountryName: "FRANCE",
          isoCodeAlpha2: "FR",
          isoCodeAlpha3: "FRA",
          isoNumericCode: "250"
        }
      };

      const expectedResult: BackEndModels.Transport = {
        vehicle: FrontEndTransport.containerVessel,
        vesselName: "MS Maersk",
        flagState: "Denmark",
        containerNumber: "CONT123",
        departurePlace: "Port of Southampton",
        pointOfDestination: "Port of Le Havre",
        exportedTo: {
          officialCountryName: "FRANCE",
          isoCodeAlpha2: "FR",
          isoCodeAlpha3: "FRA",
          isoNumericCode: "250"
        }
      };

      const result = FrontEndTransport.toBackEndTransport(transport);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe("fishingVessel transport", () => {
    it("should not include pointOfDestination (not applicable to fishing vessels)", () => {
      const transport: FrontEndTransport.Transport = {
        vehicle: FrontEndTransport.fishingVessel,
        exportDate: '01/01/2020',
        exportedTo: {
          officialCountryName: "FRANCE",
          isoCodeAlpha2: "FR",
          isoCodeAlpha3: "FRA",
          isoNumericCode: "250"
        }
      };

      const result = FrontEndTransport.toBackEndTransport(transport);
      expect(result.pointOfDestination).toBeUndefined();
    });
  });
});

describe("When mapping from backend to frontend transport with pointOfDestination", () => {

  describe("truck backend model", () => {
    it("should include pointOfDestination in frontend transport when present in backend", () => {
      const backendTransport: BackEndModels.Transport = {
        vehicle: FrontEndTransport.truck,
        cmr: false,
        nationalityOfVehicle: "UK",
        registrationNumber: "REG123",
        departurePlace: "London",
        pointOfDestination: "Port of Rotterdam"
      };

      const result = FrontEndTransport.toFrontEndTransport(backendTransport);
      expect(result).toMatchObject({
        vehicle: FrontEndTransport.truck,
        pointOfDestination: "Port of Rotterdam"
      });
    });

    it("should handle missing pointOfDestination in backend transport", () => {
      const backendTransport: BackEndModels.Transport = {
        vehicle: FrontEndTransport.truck,
        cmr: true,
        nationalityOfVehicle: "FR",
        registrationNumber: "FR456",
        departurePlace: "Paris"
      };

      const result = FrontEndTransport.toFrontEndTransport(backendTransport);
      expect(result?.pointOfDestination).toBeUndefined();
    });
  });

  describe("plane backend model", () => {
    it("should include pointOfDestination in frontend transport when present in backend", () => {
      const backendTransport: BackEndModels.Transport = {
        vehicle: FrontEndTransport.plane,
        flightNumber: "FL123",
        containerNumber: "CONT456",
        departurePlace: "London Heathrow",
        pointOfDestination: "Charles de Gaulle Airport"
      };

      const result = FrontEndTransport.toFrontEndTransport(backendTransport);
      expect(result).toMatchObject({
        vehicle: FrontEndTransport.plane,
        pointOfDestination: "Charles de Gaulle Airport"
      });
    });
  });

  describe("train backend model", () => {
    it("should include pointOfDestination in frontend transport when present in backend", () => {
      const backendTransport: BackEndModels.Transport = {
        vehicle: FrontEndTransport.train,
        railwayBillNumber: "RB789",
        departurePlace: "London St Pancras",
        pointOfDestination: "Gare du Nord Paris"
      };

      const result = FrontEndTransport.toFrontEndTransport(backendTransport);
      expect(result).toMatchObject({
        vehicle: FrontEndTransport.train,
        pointOfDestination: "Gare du Nord Paris"
      });
    });
  });

  describe("containerVessel backend model", () => {
    it("should include pointOfDestination in frontend transport when present in backend", () => {
      const backendTransport: BackEndModels.Transport = {
        vehicle: FrontEndTransport.containerVessel,
        vesselName: "MS Maersk",
        flagState: "Denmark",
        containerNumber: "CONT123",
        departurePlace: "Port of Southampton",
        pointOfDestination: "Port of Le Havre"
      };

      const result = FrontEndTransport.toFrontEndTransport(backendTransport);
      expect(result).toMatchObject({
        vehicle: FrontEndTransport.containerVessel,
        pointOfDestination: "Port of Le Havre"
      });
    });
  });
});
