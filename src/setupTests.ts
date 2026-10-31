import '@testing-library/jest-dom/vitest'
import { TUTORIAL_KEY } from './tour'

// Every test of the game starts past the first-visit tutorial, as a returning
// player would: they are about the board, and the tutorial is a board of its
// own sitting in front of it. Its own tests take this away before rendering.
beforeEach(() => localStorage.setItem(TUTORIAL_KEY, 'true'));
