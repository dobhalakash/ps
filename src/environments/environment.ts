// Used by `ng serve` and as the default Capacitor dev source.
// For the Android emulator, 10.0.2.2 reaches your computer's localhost.
// For a real device on the same Wi-Fi, use your computer's LAN IP
// (e.g. http://192.168.1.50:8080/api) instead of localhost.
export const environment = {
  // 'basic' | 'standard' | 'premium' - controls which features are enabled
  edition: 'premium' as 'basic' | 'standard' | 'premium',
  production: false,
  apiUrl: "https://backendparas-production.up.railway.app",
  // Publishable OAuth client IDs only (safe to expose in frontend code -
  // these identify your app to the provider, they are not secrets).
  // Replace with your real values; sign-in buttons render either way but
  // will fail verification server-side until both ends are configured.
  googleClientId: "775981559964-q5281jmae49oo0f2nek7lpuj0t2nsvca.apps.googleusercontent.com",
  facebookAppId: "DUMMY_FACEBOOK_APP_ID",
  appleClientId: "com.sksports.dummy.service",
};
