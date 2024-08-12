import { validateCommodityCode } from './pssdCommodityCode.validator';
import ApplicationConfig from '../applicationConfig';
import * as HttpHelper from "./httpHelper";

describe('commodityCode.validator',() => {
  const refUrl = ApplicationConfig.getReferenceServiceUrl();

  let mockValidatePSSDCommodityCode;

  beforeEach(() => {
    mockValidatePSSDCommodityCode = jest.spyOn(HttpHelper, "validatePSSDCommodityCode");
    mockValidatePSSDCommodityCode.mockResolvedValue({ isError: true });
  })

  afterEach(() => {
    mockValidatePSSDCommodityCode.mockRestore();
  })

  it('should return an error if the commodity code does not exist', async () => {
    const result = await validateCommodityCode('', refUrl);
    expect(result.isError).toEqual(true);
  });

  it('should return an error if a country destination is not given', async () => {
    const result = await validateCommodityCode(undefined, refUrl);
    expect(result.isError).toEqual(true);
  });

  it('should return isError: false and error:null if the commodity code exists', async () => {
    mockValidatePSSDCommodityCode.mockResolvedValue({ isError: false });

    const result = await validateCommodityCode('0123456', refUrl);
    expect(result.isError).toEqual(false);
  });

  it('should call validate commodityCode with correct error property', async () => {
    const result = await validateCommodityCode('invalid', refUrl);

    expect(mockValidatePSSDCommodityCode).toHaveBeenCalledWith('invalid', refUrl, 'commodityCode');
    expect(result.isError).toEqual(true);
  });

  it('should call validate commodityCode with given error property', async () => {
    const propertyError = 'pssdCommodityCode';

    const result = await validateCommodityCode('0123456', refUrl, propertyError);
    expect(mockValidatePSSDCommodityCode).toHaveBeenCalledWith('0123456', refUrl, propertyError);
    expect(result.isError).toEqual(true);
  });

});
