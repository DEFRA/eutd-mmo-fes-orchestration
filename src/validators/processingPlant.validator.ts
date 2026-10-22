import { isEmpty } from 'lodash';
import { buildErrorForClient, BusinessError } from './validationErrors';

const SELECT_PLANT_ERROR = 'psAddProcessingPlantErrorSelectPlant';

export const validateProcessingPlant = (
  plantName: string,
  plantApprovalNumber: string,
  propertyName: string = 'plantName'
): BusinessError => {
  if (isEmpty(plantName?.trim()) || isEmpty(plantApprovalNumber?.trim())) {
    return {
      isError: true,
      error: buildErrorForClient(SELECT_PLANT_ERROR, propertyName)
    };
  }

  return {
    isError: false,
    error: null
  };
};