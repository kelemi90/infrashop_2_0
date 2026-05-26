(async () => {
  const fetch = global.fetch || (await import('node-fetch')).default;
  const API = process.env.API_URL || 'http://localhost:3000';
  const email = process.env.TEST_EMAIL;
  const currentPassword = process.env.TEST_PASSWORD;
  const newPassword = process.env.TEST_NEW_PASSWORD || `${currentPassword || ''}__tmp1`;

  function fail(message, detail) {
    console.error(message);
    if (detail) console.error(detail);
    process.exit(1);
  }

  async function postJson(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { res, data };
  }

  async function login(password) {
    const { res, data } = await postJson(`${API}/api/auth/login`, { email, password });
    if (!res.ok) return null;
    return data;
  }

  if (!email || !currentPassword) {
    fail('Missing TEST_EMAIL or TEST_PASSWORD env vars');
  }

  if (newPassword === currentPassword) {
    fail('TEST_NEW_PASSWORD must differ from TEST_PASSWORD');
  }

  try {
    const firstLogin = await login(currentPassword);
    if (!firstLogin || !firstLogin.token || !firstLogin.user) {
      fail('Initial login failed. Ensure TEST_EMAIL/TEST_PASSWORD are valid.');
    }

    const role = firstLogin.user.role;
    if (role !== 'admin' && role !== 'moderator') {
      fail(`User role ${role} is not allowed to change password by this endpoint`);
    }

    const change1 = await postJson(
      `${API}/api/auth/change-password`,
      { currentPassword, newPassword },
      firstLogin.token
    );
    if (!change1.res.ok) {
      fail('Password change request failed', change1.data || (await change1.res.text()));
    }

    const loginWithNew = await login(newPassword);
    if (!loginWithNew || !loginWithNew.token) {
      fail('Login with new password failed after change');
    }

    // Restore original password to keep environment stable for repeated test runs.
    const rollback = await postJson(
      `${API}/api/auth/change-password`,
      { currentPassword: newPassword, newPassword: currentPassword },
      loginWithNew.token
    );
    if (!rollback.res.ok) {
      fail('Rollback password change failed', rollback.data || (await rollback.res.text()));
    }

    const finalLogin = await login(currentPassword);
    if (!finalLogin || !finalLogin.token) {
      fail('Final login with original password failed after rollback');
    }

    console.log('test_auth_change_password passed');
    process.exit(0);
  } catch (err) {
    fail('Unexpected test error', err && err.stack ? err.stack : err);
  }
})();
