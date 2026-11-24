import { mobileAuthResponse } from '../convex/lib/mobile_auth';

test('bridges only a one-time code to the fixed Joti route with no caching or referrers', async () => {
  const response = mobileAuthResponse(
    new Request(
      'https://deployment.convex.site/mobile-auth/complete?convexAuthCode=one-time-code&redirectTo=https://attacker.example',
    ),
  );
  const html = await response.text();
  expect(html).toContain('joti://auth-callback?convexAuthCode=one-time-code');
  expect(html).not.toContain('attacker.example');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
});

test('escapes hostile callback input rather than inserting markup', async () => {
  const value = '"><script>alert(1)</script>';
  const response = mobileAuthResponse(
    new Request(
      `https://deployment.convex.site/mobile-auth/complete?convexAuthCode=${encodeURIComponent(value)}`,
    ),
  );
  expect(await response.text()).not.toContain('<script>');
});

test.each([
  '',
  '?redirectTo=https://attacker.example',
  '?convexAuthError=arbitrary',
  '?convexAuthCode=x&convexAuthError=arbitrary',
])('rejects invalid bridge results: %s', (query) => {
  expect(
    mobileAuthResponse(
      new Request(
        `https://deployment.convex.site/mobile-auth/complete${query}`,
      ),
    ).status,
  ).toBe(400);
});
