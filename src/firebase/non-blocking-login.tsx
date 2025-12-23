
'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

/** Initiate email/password sign-up (non-blocking). */
export async function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string,
  displayName: string,
  phoneNumber?: string
): Promise<void> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    // After user is created, update their profile
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }
  } catch (error) {
    console.error("Error during sign up and profile update:", error);
    // Re-throw the error so the calling component can handle it (e.g., show a toast)
    throw error;
  }
}

/** Initiate email/password sign-in (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(authInstance, email, password);
}
