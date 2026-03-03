import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, AuthError, GoogleAuthProvider, signInWithPopup, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
  lastLoginAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  
  currentUser$ = user(this.auth);

  async register(email: string, password: string, displayName: string) {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(credential.user, { displayName });
      await this.createUserProfile(credential.user.uid, email, displayName);
      return credential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async login(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      await this.updateLastLogin(credential.user.uid);
      return credential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      
      // Check if user profile exists, create if not
      const userDoc = await getDoc(doc(this.firestore, 'users', credential.user.uid));
      if (!userDoc.exists()) {
        await this.createUserProfile(
          credential.user.uid,
          credential.user.email!,
          credential.user.displayName || 'User'
        );
      } else {
        await this.updateLastLogin(credential.user.uid);
      }
      
      return credential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  logout() {
    return signOut(this.auth);
  }

  private async createUserProfile(uid: string, email: string, displayName: string) {
    const userProfile: UserProfile = {
      uid,
      email,
      displayName,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };
    await setDoc(doc(this.firestore, 'users', uid), userProfile);
  }

  private async updateLastLogin(uid: string) {
    const userRef = doc(this.firestore, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      await setDoc(userRef, { lastLoginAt: Date.now() }, { merge: true });
    }
  }

  private handleAuthError(error: AuthError): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('Email already exists. Try logging in instead.');
      case 'auth/user-not-found':
        return new Error('No account found. Try signing up instead.');
      case 'auth/wrong-password':
        return new Error('Incorrect password.');
      case 'auth/invalid-email':
        return new Error('Invalid email address.');
      case 'auth/weak-password':
        return new Error('Password must be at least 6 characters.');
      case 'auth/popup-closed-by-user':
        return new Error('Google sign-in was cancelled.');
      case 'auth/operation-not-allowed':
        return new Error('Google sign-in is not enabled. Please use email/password.');
      case 'auth/unauthorized-domain':
        return new Error('This domain is not authorized for Google sign-in.');
      default:
        return new Error('Authentication failed. Please try again.');
    }
  }
}