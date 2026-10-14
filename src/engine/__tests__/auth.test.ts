import { describe, it, expect } from 'vitest';
import {
  createInitialPinState,
  appendDigit,
  deleteDigit,
  clearPin,
  verifyPin,
  DEFAULT_DEMO_PIN,
  MAX_PIN_LENGTH,
} from '../auth';

describe('Demo PIN Engine (auth.ts)', () => {
  it('initializes with empty pin and IDLE status', () => {
    const state = createInitialPinState();
    expect(state.pin).toBe('');
    expect(state.masked).toBe('');
    expect(state.status).toBe('IDLE');
  });

  it('appends digits and updates masked string', () => {
    let state = createInitialPinState();
    state = appendDigit(state, '2');
    state = appendDigit(state, '0');
    expect(state.pin).toBe('20');
    expect(state.masked).toBe('••');
    expect(state.status).toBe('IDLE');
  });

  it('enforces maximum 4 digits limit', () => {
    let state = createInitialPinState();
    state = appendDigit(state, '1');
    state = appendDigit(state, '2');
    state = appendDigit(state, '3');
    state = appendDigit(state, '4');
    state = appendDigit(state, '5'); // extra digit should be ignored
    expect(state.pin).toBe('1234');
    expect(state.pin.length).toBe(MAX_PIN_LENGTH);
    expect(state.masked).toBe('••••');
  });

  it('rejects non-numeric characters', () => {
    let state = createInitialPinState();
    state = appendDigit(state, 'a');
    state = appendDigit(state, ' ');
    expect(state.pin).toBe('');
  });

  it('deletes digits with backspace', () => {
    let state = createInitialPinState();
    state = appendDigit(state, '2');
    state = appendDigit(state, '0');
    state = deleteDigit(state);
    expect(state.pin).toBe('2');
    expect(state.masked).toBe('•');

    state = deleteDigit(state);
    expect(state.pin).toBe('');
    expect(state.masked).toBe('');

    // Calling delete on empty pin should be a safe no-op
    state = deleteDigit(state);
    expect(state.pin).toBe('');
  });

  it('clears pin completely', () => {
    let state = createInitialPinState();
    state = appendDigit(state, '9');
    state = appendDigit(state, '8');
    state = clearPin(state);
    expect(state.pin).toBe('');
    expect(state.masked).toBe('');
  });

  it('accepts correct default demo PIN (2026)', () => {
    let state = createInitialPinState();
    for (const char of DEFAULT_DEMO_PIN) {
      state = appendDigit(state, char);
    }
    const { nextState, isCorrect } = verifyPin(state);
    expect(isCorrect).toBe(true);
    expect(nextState.status).toBe('SUCCESS');
  });

  it('rejects incorrect PIN and marks ERROR status', () => {
    let state = createInitialPinState();
    state = appendDigit(state, '9');
    state = appendDigit(state, '9');
    state = appendDigit(state, '9');
    state = appendDigit(state, '9');
    const { nextState, isCorrect } = verifyPin(state);
    expect(isCorrect).toBe(false);
    expect(nextState.status).toBe('ERROR');
    expect(nextState.errorMessage).toBeDefined();
  });

  it('prevents adding or deleting digits after SUCCESS', () => {
    let state = createInitialPinState();
    for (const char of DEFAULT_DEMO_PIN) {
      state = appendDigit(state, char);
    }
    const { nextState } = verifyPin(state);
    expect(nextState.status).toBe('SUCCESS');

    const stateAfterAppend = appendDigit(nextState, '5');
    expect(stateAfterAppend.pin).toBe(DEFAULT_DEMO_PIN);

    const stateAfterDelete = deleteDigit(nextState);
    expect(stateAfterDelete.pin).toBe(DEFAULT_DEMO_PIN);
  });
});
