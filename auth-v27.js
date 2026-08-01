(() => {
  'use strict';

  const publicPages = ['admin-login.html', 'customer-login.html'];
  const page = location.pathname.split('/').pop() || 'index.html';
  const isAdmin = page.startsWith('admin') && !publicPages.includes(page);

  async function profile() {
    const sb = window.lwsSupabase;
    if (!sb) return null;

    const { data: { user }, error: userError } = await sb.auth.getUser();
    if (userError || !user) return null;

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[profile guard]', error);
      return null;
    }

    return data || {
      id: user.id,
      email: user.email,
      role: 'customer',
      is_active: true
    };
  }

  async function guard() {
    const sb = window.lwsSupabase;

    if (!sb) {
      if (isAdmin || page === 'customer-portal.html') {
        location.replace('system-check.html?reason=not-configured');
      }
      return;
    }

    const { data: { session }, error } = await sb.auth.getSession();
    if (error) console.error('[session]', error);

    if (isAdmin) {
      if (!session) {
        location.replace('admin-login.html');
        return;
      }

      const currentProfile = await profile();
      if (
        !currentProfile ||
        currentProfile.is_active === false ||
        !['owner', 'manager', 'staff'].includes(currentProfile.role)
      ) {
        await sb.auth.signOut();
        location.replace('admin-login.html?denied=1');
      }
    }

    if (page === 'customer-portal.html' && !session) {
      location.replace('customer-login.html');
    }
  }

  window.lwsGetProfile = profile;
  window.lwsSignOut = async () => {
    if (window.lwsSupabase) {
      await window.lwsSupabase.auth.signOut();
    }
    location.replace(
      page === 'customer-portal.html'
        ? 'customer-login.html'
        : 'admin-login.html'
    );
  };

  guard();
})();
