(() => {
  'use strict';

  const url = String(window.LWS_SUPABASE_URL || '').trim();
  const key = String(window.LWS_SUPABASE_ANON_KEY || '').trim();

  const configured =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
    key.length > 20 &&
    !url.includes('PASTE_') &&
    !key.includes('PASTE_');

  window.LWS_SUPABASE_CONFIGURED = configured;
  window.LWS_SUPABASE_PROJECT_REF = configured
    ? new URL(url).hostname.split('.')[0]
    : '';

  window.lwsSupabase =
    configured && window.supabase
      ? window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
          },
          global: {
            headers: {
              'x-application-name': 'lao-web-studio-v2.9.1'
            }
          }
        })
      : null;

  window.lwsSupabaseHealthCheck = async function () {
    if (!window.lwsSupabase) {
      return {
        ok: false,
        version: '2.9.1',
        code: 'NOT_CONFIGURED',
        projectRef: window.LWS_SUPABASE_PROJECT_REF
      };
    }

    try {
      const { data, error } = await window.lwsSupabase.rpc(
        'lws_public_health_check'
      );

      return {
        ok: !error && ['2.9.0', '2.9.1'].includes(data?.version),
        version: '2.9.1',
        data: data || null,
        error: error?.message || null,
        projectRef: window.LWS_SUPABASE_PROJECT_REF
      };
    } catch (error) {
      return {
        ok: false,
        version: '2.9.1',
        error: error?.message || String(error),
        projectRef: window.LWS_SUPABASE_PROJECT_REF
      };
    }
  };
})();
