import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const google: any;
declare const FB: any;
declare const AppleID: any;

export interface SocialAuthResult {
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
  token: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Wraps Google Identity Services, the Facebook SDK, and Sign in with Apple
 * JS so the rest of the app can just call signInWith('GOOGLE') etc. and get
 * back a token to send to the backend for verification.
 *
 * All three SDKs are loaded lazily/on-demand so a missing or slow-loading
 * script from one provider never blocks the others or the rest of the app.
 */
@Injectable({ providedIn: 'root' })
export class SocialAuthService {

  private facebookSdkLoaded = false;

  signInWithGoogle(): Promise<SocialAuthResult> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.accounts) {
        reject(new Error('Google Sign-In is still loading. Please try again in a moment.'));
        return;
      }
      try {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => {
            if (response?.credential) {
              resolve({ provider: 'GOOGLE', token: response.credential });
            } else {
              reject(new Error('Google Sign-In was cancelled.'));
            }
          }
        });
        // Render a one-tap prompt; if it can't be shown (e.g. blocked),
        // fall back to rendering a real button into a hidden container.
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
            reject(new Error('Google Sign-In was closed before completing.'));
          }
        });
      } catch (e: any) {
        reject(new Error(e?.message || 'Google Sign-In failed to start.'));
      }
    });
  }

  signInWithFacebook(): Promise<SocialAuthResult> {
    return this.loadFacebookSdk().then(() => new Promise((resolve, reject) => {
      FB.login((response: any) => {
        if (response.authResponse?.accessToken) {
          resolve({ provider: 'FACEBOOK', token: response.authResponse.accessToken });
        } else {
          reject(new Error('Facebook Sign-In was cancelled.'));
        }
      }, { scope: 'public_profile,email' });
    }));
  }

  signInWithApple(): Promise<SocialAuthResult> {
    return new Promise((resolve, reject) => {
      if (typeof AppleID === 'undefined') {
        reject(new Error('Apple Sign-In is still loading. Please try again in a moment.'));
        return;
      }
      try {
        AppleID.auth.init({
          clientId: environment.appleClientId,
          scope: 'name email',
          redirectURI: window.location.origin,
          usePopup: true
        });
        AppleID.auth.signIn().then((res: any) => {
          const name = res?.user?.name;
          resolve({
            provider: 'APPLE',
            token: res?.authorization?.id_token,
            firstName: name?.firstName,
            lastName: name?.lastName
          });
        }).catch(() => reject(new Error('Apple Sign-In was cancelled.')));
      } catch (e: any) {
        reject(new Error(e?.message || 'Apple Sign-In failed to start.'));
      }
    });
  }

  private loadFacebookSdk(): Promise<void> {
    if (this.facebookSdkLoaded) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      (window as any).fbAsyncInit = () => {
        FB.init({ appId: environment.facebookAppId, cookie: true, xfbml: false, version: 'v19.0' });
        this.facebookSdkLoaded = true;
        resolve();
      };
      if (document.getElementById('facebook-jssdk')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.onerror = () => reject(new Error('Could not load Facebook SDK.'));
      document.body.appendChild(script);
    });
  }
}
