import applicationConfig from "../applicationConfig";

export const defineAuthStrategies = () => {
  if (applicationConfig._disableAuth) {
    return null;
  }
  return {
    strategies: ['fesApi', 'jwt'],
  };
};

export const isRequestByAdmin = (roles) =>  roles ?
  roles.includes('MMO-ECC-Service-Management')
  || roles.includes('MMO-ECC-Support-User')
  || roles.includes('MMO-ECC-IUU-Single-Liaison-Officer')
  || roles.includes('MMO-ECC-Regulatory-User') : false;