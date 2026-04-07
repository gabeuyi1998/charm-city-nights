import { Router, Response, Request } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import prisma from '../lib/prisma';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? '';

const router = Router();

// POST /api/auth/sync — upsert Cognito user on first login
router.post('/sync', authLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cognitoId, username, displayName, authProvider, email } = req.body as {
      cognitoId: string;
      username: string;
      displayName?: string;
      authProvider?: string;
      email?: string;
    };

    if (!cognitoId || !username) {
      res.status(400).json({ error: 'cognitoId and username are required' });
      return;
    }

    const user = await prisma.user.upsert({
      where: { cognitoId },
      update: {
        username,
        ...(displayName && { displayName }),
        ...(email && { email }),
        ...(authProvider && { authProvider }),
      },
      create: {
        cognitoId,
        username,
        displayName: displayName ?? null,
        email: email ?? null,
        authProvider: authProvider ?? 'cognito',
      },
    });

    res.status(200).json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — return full user profile
router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { userBadges: true },
        },
        crawlProgresses: {
          where: { isComplete: false },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      data: {
        ...user,
        badgeCount: user._count.userBadges,
        activeCrawlsCount: user.crawlProgresses.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/users/onboard — update profile on first use
router.post('/users/onboard', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { displayName, homeNeighborhood, ageVerified } = req.body as {
      displayName?: string;
      homeNeighborhood?: string;
      ageVerified?: boolean;
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(homeNeighborhood !== undefined && { homeNeighborhood }),
        ...(ageVerified !== undefined && { ageVerified }),
      },
    });

    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register — sign up with email + password
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body as { email: string; password: string; username: string };
    if (!email || !password || !username) {
      res.status(400).json({ error: 'email, password, and username are required' });
      return;
    }

    await cognito.send(new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'preferred_username', Value: username },
      ],
    }));

    res.status(201).json({ message: 'Account created. Check your email for a verification code.' });
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    if (e.name === 'UsernameExistsException') {
      res.status(409).json({ error: 'An account with this email already exists.' });
    } else if (e.name === 'InvalidPasswordException') {
      res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, number, and symbol.' });
    } else {
      console.error('[auth/register]', err);
      res.status(500).json({ error: e.message ?? 'Registration failed' });
    }
  }
});

// POST /api/auth/confirm — confirm signup with code from email
router.post('/confirm', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body as { email: string; code: string };
    if (!email || !code) {
      res.status(400).json({ error: 'email and code are required' });
      return;
    }
    await cognito.send(new ConfirmSignUpCommand({ ClientId: CLIENT_ID, Username: email, ConfirmationCode: code }));
    res.json({ message: 'Account confirmed. You can now log in.' });
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    res.status(400).json({ error: e.message ?? 'Confirmation failed' });
  }
});

// POST /api/auth/resend-code — resend confirmation code
router.post('/resend-code', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    await cognito.send(new ResendConfirmationCodeCommand({ ClientId: CLIENT_ID, Username: email }));
    res.json({ message: 'Code resent.' });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(400).json({ error: e.message ?? 'Failed to resend code' });
  }
});

// POST /api/auth/login — authenticate with email + password, returns Cognito tokens
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const result = await cognito.send(new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    }));

    const tokens = result.AuthenticationResult;
    if (!tokens?.IdToken) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }

    res.json({
      data: {
        idToken: tokens.IdToken,
        accessToken: tokens.AccessToken,
        refreshToken: tokens.RefreshToken,
        expiresIn: tokens.ExpiresIn,
      },
    });
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    if (e.name === 'NotAuthorizedException') {
      res.status(401).json({ error: 'Incorrect email or password.' });
    } else if (e.name === 'UserNotConfirmedException') {
      res.status(403).json({ error: 'Please verify your email before logging in.', code: 'USER_NOT_CONFIRMED' });
    } else if (e.name === 'UserNotFoundException') {
      res.status(401).json({ error: 'Incorrect email or password.' });
    } else {
      console.error('[auth/login]', err);
      res.status(500).json({ error: e.message ?? 'Login failed' });
    }
  }
});

export default router;
