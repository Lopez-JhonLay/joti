import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { mobileAuthResponse } from './lib/mobile_auth';

const http = httpRouter();
http.route({
  path: '/mobile-auth/complete',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => mobileAuthResponse(request)),
});
export default http;
