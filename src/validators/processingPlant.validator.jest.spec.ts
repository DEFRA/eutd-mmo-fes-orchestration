import { validateProcessingPlant } from './processingPlant.validator';

describe('processingPlant.validator', () => {
  it.each<[string, string]>([
    ['', ''],
    ['', 'UK/ABC/001'],
    ['Plant Alpha', ''],
    ['   ', 'UK/ABC/001'],
    ['Plant Alpha', '   '],
  ])('should return an error when plantName="%s" and plantApprovalNumber="%s"', (plantName, plantApprovalNumber) => {
    const result = validateProcessingPlant(plantName, plantApprovalNumber);

    expect(result.isError).toEqual(true);
    expect(result.error.message).toEqual('psAddProcessingPlantErrorSelectPlant');
  });

  it('should return no error when plant name and approval number are present', () => {
    const result = validateProcessingPlant('Plant Alpha', 'UK/ABC/001');

    expect(result.isError).toEqual(false);
    expect(result.error).toBeNull();
  });
});