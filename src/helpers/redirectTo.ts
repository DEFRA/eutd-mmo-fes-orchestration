import * as Hapi from '@hapi/hapi';
import acceptsHtml from './acceptsHtml';
import { find } from 'lodash';

export function redirectTo(req: Hapi.Request): string | null {
  if (acceptsHtml(req.headers)) {
    const redirectUri = find(req.payload as any, (value, key) => {
      return key.indexOf('redirect') !== -1;
    });

    return redirectUri === undefined ? null : redirectUri;
  }
  return null;
}