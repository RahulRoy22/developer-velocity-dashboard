import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, AuthError } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  
  currentUser$ = user(this.auth); 

  async register(email: string, password: string) {
    try {
      return await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async login(email: string, password: string) {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  logout() {
    return signOut(this.auth);
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
        return new Error('Password should be at least 6 characters.');
      default:
        return new Error('Authentication failed. Please try again.');
    }
  }
}