// Used for production builds (`ng build --configuration production`),
// including the Capacitor Android app. Point this at your deployed,
// HTTPS-reachable backend - "localhost" will not work on a real device.
export const environment = {
  // 'basic' | 'standard' | 'premium' - controls which features are enabled
  edition: 'premium' as 'basic' | 'standard' | 'premium',
  production: true,
  apiUrl: "https://backendparas-production.up.railway.app",
  googleClientId: '775981559964-q5281jmae49oo0f2nek7lpuj0t2nsvca.apps.googleusercontent.com',
  facebookAppId: 'DUMMY_FACEBOOK_APP_ID',
  appleClientId: 'com.sksports.dummy.service'
};
