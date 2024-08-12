import applicationConfig from "../applicationConfig";

export const defineAuthStrategies = () => {
  if (applicationConfig._disableAuth) {
    return null;
  }
  return {
    strategies: ['fesApi', 'jwt'],
  };
};
