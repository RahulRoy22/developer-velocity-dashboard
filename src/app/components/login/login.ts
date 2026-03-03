import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  displayName = '';
  isLogin = true;
  loading = false;
  error = '';

  async onSubmit() {
    if (!this.email || !this.password || (!this.isLogin && !this.displayName)) {
      this.error = 'Please fill in all fields.';
      return;
    }
    
    if (!this.isValidEmail(this.email)) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters long.';
      return;
    }
    
    this.loading = true;
    this.error = '';

    try {
      if (this.isLogin) {
        await this.authService.login(this.email, this.password);
      } else {
        await this.authService.register(this.email, this.password, this.displayName);
      }
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async onGoogleSignIn() {
    this.error = 'Google sign-in is temporarily disabled due to API restrictions. Please use email/password.';
    return;
    
    // Disabled temporarily
    // this.loading = true;
    // this.error = '';
    // try {
    //   await this.authService.loginWithGoogle();
    //   this.router.navigate(['/dashboard']);
    // } catch (error: any) {
    //   this.error = error.message;
    // } finally {
    //   this.loading = false;
    // }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.displayName = '';
  }
}