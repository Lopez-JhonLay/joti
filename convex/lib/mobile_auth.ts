// Fixed destinations prevent this endpoint from becoming an open redirect.
export const MOBILE_AUTH_RETURN = 'joti://auth-callback';

export function mobileAuthResponse(request: Request): Response {
  const source = new URL(request.url);
  const code = source.searchParams.get('convexAuthCode');
  const error = source.searchParams.get('convexAuthError');
  const target = new URL(MOBILE_AUTH_RETURN);
  if (code && code.length <= 2048 && !error) {
    target.searchParams.set('convexAuthCode', code);
  } else if (
    error &&
    ['access_denied', 'expired', 'oauth_error'].includes(error)
  ) {
    target.searchParams.set('convexAuthError', error);
  } else {
    return new Response(
      'Invalid sign-in result. Return to Joti and try again.',
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer',
        },
      },
    );
  }
  // A user-activated link also works when Chrome blocks automatic app redirects.
  // URL encoding plus HTML escaping keeps arbitrary query input out of markup.
  const href = target
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Return to Joti</title><body><h1>Return to Joti</h1><p>Continue in the app to finish signing in.</p><p><a href="${href}">Continue to Joti</a></p></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy':
          "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
