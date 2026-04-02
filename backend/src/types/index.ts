import { Request } from 'express';

export interface AuthUser {
  id: string;
  cognitoId: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  username: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type VideoStatus = 'PENDING' | 'APPROVED' | 'FLAGGED';
export type VoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
