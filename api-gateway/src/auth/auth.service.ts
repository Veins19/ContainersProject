import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  private validatePasswordPolicy(password: string) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new BadRequestException('Password does not meet security requirements.');
    }
  }

  async register(email: string, pass: string) {
    this.validatePasswordPolicy(pass);
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Email is already registered.');

    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(email: string, pass: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials.');

    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { message: 'If that email is registered, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); 

    await prisma.user.update({
      where: { email },
      data: { resetToken: hashedToken, resetTokenExpiry: tokenExpiry }
    });

    console.log('\n\n======================================================');
    console.log(`[SECURE SYSTEM] Password Reset Requested for: ${email}`);
    console.log(`[SECURE SYSTEM] Token: ${resetToken}`);
    console.log('======================================================\n\n');

    return { message: 'If that email is registered, a reset link has been sent. (Check API Gateway Logs for Token)' };
  }

  async resetPassword(token: string, newPass: string) {
    this.validatePasswordPolicy(newPass);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await prisma.user.findFirst({
      where: { 
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() } 
      }
    });

    if (!user) throw new BadRequestException('Invalid or expired reset token.');

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { message: 'Password has been successfully reset. You may now log in.' };
  }
}
