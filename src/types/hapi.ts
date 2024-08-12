import * as Hapi from '@hapi/hapi';

export interface JwtClaims {
  sub: string;
  contactId: string;
  email: string;
  roles: string[];
  fesApi: boolean;
  auth_time: number;
}

export interface HapiRequestApplicationStateExtended extends Hapi.RequestApplicationState {
  claims: Partial<JwtClaims>
}
