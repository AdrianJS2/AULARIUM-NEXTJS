
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'Cl4v3_S3cr3t4_Muy_L4rg4_123456789!';

interface UserPayload {
  id: string;
  email: string;
  rol: string;
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); // El token expira en 1 día
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}