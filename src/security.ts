"use server";

import {base64url, EncryptJWT, importPKCS8, SignJWT} from 'jose';

// This envar and this entire action is only used for the demo page
// to demonstrate how the customer would sign and encrypt the user data
// before sending it to Maven.
const DEMO_SIGNING_PRIVATE_KEY = process.env.DEMO_SIGNING_PRIVATE_KEY as string;
const DEMO_ENCRYPTION_SECRET = process.env.DEMO_ENCRYPTION_SECRET as string;

export interface UserInfo {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export async function secureUserData(
    userData: Record<string, string> & UserInfo) {

  if (DEMO_SIGNING_PRIVATE_KEY === undefined || DEMO_ENCRYPTION_SECRET === undefined) {
    throw new Error('DEMO_SIGNING_PRIVATE_KEY and DEMO_ENCRYPTION_SECRET must be set');
  }

  const alg = 'ES256';
  const privateKey = await importPKCS8(DEMO_SIGNING_PRIVATE_KEY, alg);
  // 1. Sign the user data with your private key (ES256 algorithm)
  const signedJWT = await new SignJWT(userData)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuedAt()
    .setExpirationTime('10y')
    .sign(privateKey);

  // 2. Encrypt the signed JWT using your encryption secret
  return await new EncryptJWT({ jwt: signedJWT })
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .encrypt(base64url.decode(DEMO_ENCRYPTION_SECRET));
}
