/**
 * PRIVATE RESIDENCE — Demo Authentication Engine
 *
 * NOTE & SECURITY DISCLAIMER:
 * This verification logic runs entirely client-side for portfolio and architectural
 * presentation purposes. It is a simulated access verification and must NOT be used
 * as a security boundary or authentication system for sensitive data.
 */

export const DEFAULT_DEMO_PIN = '2026';
export const ALTERNATE_DEMO_PIN = '1234';
export const MAX_PIN_LENGTH = 4;

export type AuthStatus = 'IDLE' | 'VERIFYING' | 'SUCCESS' | 'ERROR';

export interface PinState {
  pin: string;
  masked: string;
  status: AuthStatus;
  errorMessage?: string;
}

export function createInitialPinState(): PinState {
  return {
    pin: '',
    masked: '',
    status: 'IDLE',
  };
}

/**
 * Appends a digit (0-9) to the current PIN state.
 * Returns a new state without mutating the original.
 */
export function appendDigit(state: PinState, digit: string): PinState {
  if (state.status === 'VERIFYING' || state.status === 'SUCCESS') {
    return state;
  }

  // Validate that input is a single digit
  if (!/^[0-9]$/.test(digit)) {
    return state;
  }

  if (state.pin.length >= MAX_PIN_LENGTH) {
    return state;
  }

  const nextPin = state.pin + digit;
  const nextMasked = '•'.repeat(nextPin.length);

  return {
    pin: nextPin,
    masked: nextMasked,
    status: 'IDLE',
  };
}

/**
 * Removes the last entered digit (Backspace).
 */
export function deleteDigit(state: PinState): PinState {
  if (state.status === 'VERIFYING' || state.status === 'SUCCESS') {
    return state;
  }

  if (state.pin.length === 0) {
    return state;
  }

  const nextPin = state.pin.slice(0, -1);
  return {
    pin: nextPin,
    masked: '•'.repeat(nextPin.length),
    status: 'IDLE',
  };
}

/**
 * Clears the entire PIN entry.
 */
export function clearPin(state: PinState): PinState {
  if (state.status === 'SUCCESS') {
    return state;
  }

  return {
    pin: '',
    masked: '',
    status: 'IDLE',
  };
}

/**
 * Validates the entered PIN against valid demo passcodes.
 */
export function verifyPin(state: PinState, customValidPin?: string): { nextState: PinState; isCorrect: boolean } {
  if (state.status === 'SUCCESS') {
    return { nextState: state, isCorrect: true };
  }

  const targetPin = customValidPin || DEFAULT_DEMO_PIN;
  const isMatch = state.pin === targetPin || state.pin === ALTERNATE_DEMO_PIN;

  if (isMatch) {
    return {
      nextState: {
        ...state,
        status: 'SUCCESS',
      },
      isCorrect: true,
    };
  }

  return {
    nextState: {
      ...state,
      status: 'ERROR',
      errorMessage: 'Invalid residence code',
    },
    isCorrect: false,
  };
}
