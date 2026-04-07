import { Response, NextFunction } from 'express';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../types';
import prisma from '../lib/prisma';

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

function getKey(
  header: jwt.JwtHeader,
  callback: (err: Error | null, key?: string) => void
): void {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const payload = decoded as jwt.JwtPayload;
    const cognitoId = payload.sub as string;

    try {
      const dbUser = await prisma.user.findUnique({ where: { cognitoId } });
      req.user = {
        id: dbUser?.id ?? cognitoId,
        cognitoId,
        role: (dbUser?.role as AuthUser['role']) ?? 'USER',
        username: dbUser?.username ?? ((payload['cognito:username'] as string) || cognitoId),
      };
      next();
    } catch {
      res.status(500).json({ error: 'Auth lookup failed' });
    }
  });
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (!err && decoded && typeof decoded !== 'string') {
      const payload = decoded as jwt.JwtPayload;
      req.user = {
        id: payload['custom:dbId'] as string || payload.sub as string,
        cognitoId: payload.sub as string,
        role: (payload['custom:role'] as AuthUser['role']) || 'USER',
        username: (payload['cognito:username'] as string) || payload.sub as string,
      };
    }
    next();
  });
}
