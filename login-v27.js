(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const form = $('#auth-form');
  const message = $('#auth-message');

  if (!form) return;

  const language = () =>
    localStorage.getItem('lws_language') ||
    localStorage.getItem('lws_lang') ||
    'lo';

  const text = {
    lo: {
      connecting: 'ກຳລັງກວດການເຊື່ອມຕໍ່...',
      signingIn: 'ກຳລັງເຂົ້າລະບົບ...',
      notConfigured: 'Supabase ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ',
      invalid: 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ',
      unconfirmed: 'ກະລຸນາຢືນຢັນອີເມວກ່ອນ',
      noPermission: 'ບັນຊີນີ້ບໍ່ມີສິດເຂົ້າ Admin',
      failed: 'ບໍ່ສາມາດເຂົ້າລະບົບໄດ້',
      profileError: 'ເຂົ້າບັນຊີໄດ້ ແຕ່ບໍ່ພົບສິດ Admin'
    },
    th: {
      connecting: 'กำลังตรวจการเชื่อมต่อ...',
      signingIn: 'กำลังเข้าสู่ระบบ...',
      notConfigured: 'ยังไม่ได้ตั้งค่า Supabase',
      invalid: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      unconfirmed: 'กรุณายืนยันอีเมลก่อน',
      noPermission: 'บัญชีนี้ไม่มีสิทธิ์เข้า Admin',
      failed: 'ไม่สามารถเข้าสู่ระบบได้',
      profileError: 'เข้าสู่บัญชีได้ แต่ไม่พบสิทธิ์ Admin'
    },
    en: {
      connecting: 'Checking connection...',
      signingIn: 'Signing in...',
      notConfigured: 'Supabase is not configured',
      invalid: 'Invalid email or password',
      unconfirmed: 'Please confirm your email first',
      noPermission: 'This account has no Admin permission',
      failed: 'Unable to sign in',
      profileError: 'Signed in, but no Admin profile was found'
    }
  };

  const tr = key => text[language()]?.[key] || text.en[key] || key;

  function show(value, type = 'error') {
    message.textContent = value;
    message.dataset.type = type;
    message.style.color = type === 'success' ? '#067647' : '#b42318';
    message.style.fontWeight = '700';
    message.style.marginTop = '14px';
  }

  function friendlyAuthError(error) {
    const raw = String(error?.message || error || '').toLowerCase();
    if (
      raw.includes('invalid login credentials') ||
      raw.includes('invalid credentials')
    ) return tr('invalid');

    if (
      raw.includes('email not confirmed') ||
      raw.includes('email_not_confirmed')
    ) return tr('unconfirmed');

    return `${tr('failed')}: ${error?.message || error}`;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!window.lwsSupabase) {
      show(tr('notConfigured'));
      return;
    }

    const email = $('#auth-email').value.trim().toLowerCase();
    const password = $('#auth-password').value;

    show(tr('signingIn'), 'success');
    form.querySelector('button').disabled = true;

    try {
      const { data, error } =
        await window.lwsSupabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        show(friendlyAuthError(error));
        return;
      }

      if (!data?.user) {
        show(tr('failed'));
        return;
      }

      const customer = document.body.dataset.portal === 'customer';

      // Customer accounts do not require an Admin role.
      if (customer) {
        location.replace('customer-portal.html');
        return;
      }

      let { data: profile, error: profileError } =
        await window.lwsSupabase
          .from('profiles')
          .select('id,email,full_name,role,is_active')
          .eq('id', data.user.id)
          .maybeSingle();

      // V2.9.1 can repair a missing profile through a restricted RPC.
      if (!profile && !profileError) {
        const repair = await window.lwsSupabase.rpc(
          'lws_ensure_my_profile'
        );

        if (!repair.error) {
          const retry = await window.lwsSupabase
            .from('profiles')
            .select('id,email,full_name,role,is_active')
            .eq('id', data.user.id)
            .maybeSingle();

          profile = retry.data || null;
          profileError = retry.error || null;
        }
      }

      if (profileError) {
        console.error('[profile]', profileError);
        show(`${tr('profileError')}: ${profileError.message}`);
        return;
      }

      if (
        profile &&
        profile.is_active !== false &&
        ['owner', 'manager', 'staff'].includes(profile.role)
      ) {
        location.replace('admin.html');
        return;
      }

      await window.lwsSupabase.auth.signOut();
      show(tr('noPermission'));
    } catch (error) {
      console.error('[login]', error);
      show(friendlyAuthError(error));
    } finally {
      form.querySelector('button').disabled = false;
    }
  });
})();
