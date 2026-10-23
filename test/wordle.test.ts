import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
const word = wordFrom(ALPHABET);

describe('matchGuess', () => {
  // Pattern: invariant. The result always has five valid colors.
  it('returns five colors from the allowed set', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const colors = matchGuess(secret, guess);
        expect(colors).toHaveLength(5);
        expect(colors.every(c => ['G', 'Y', 'B'].includes(c))).toBe(true);
      }),
    );
  });

  // Pattern: conditional. If the guess is the secret, every position is green.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: invariant. No letter is credited more times than the secret contains it.
  it('never credits a letter more times than the secret contains it', () => {
  fc.assert(
    fc.property(word, word, (secret, guess) => {
      const result = matchGuess(secret, guess);
      for (const letter of new Set(guess)) {
        const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
        const inSecret = [...secret].filter(c => c === letter).length;
        expect(credited).toBeLessThanOrEqual(inSecret);
      }
    }),
  );
  });

  // Pattern: differential. The number of non-black colors equals the multiset overlap.
  it('credits exactly the letters shared by secret and guess', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        const credited = result.filter(color => color !== 'B').length;
        const overlap = [...new Set(ALPHABET)].reduce(
          (total, letter) =>
            total + Math.min([...secret].filter(c => c === letter).length, [...guess].filter(c => c === letter).length),
          0,
        );
        expect(credited).toBe(overlap);
      }),
    );
  });

  // Pattern: metamorphic. Renaming letters consistently does not change the colors.
  it('is unchanged by a consistent bijective letter renaming', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const renamed = new Map([...ALPHABET].map((letter, i) => [letter, ALPHABET[ALPHABET.length - 1 - i]]));
        const rename = (w: string) => [...w].map(letter => renamed.get(letter)).join('');
        expect(matchGuess(rename(secret), rename(guess))).toEqual(matchGuess(secret, guess));
      }),
    );
  });

  // Pattern: conditional. With one available occurrence and two guessed copies, only one is credited.
  it('uses each available duplicate letter at most once', () => {
    const duplicateCase = fc
      .uniqueArray(fc.constantFrom(...ALPHABET.slice(1).split('')), { minLength: 4, maxLength: 4 })
      .map(others => {
        const filler = others.join('');
        return { secret: `A${filler}`, guess: `AA${filler.slice(2)}${filler[0]}` };
      });

    fc.assert(
      fc.property(duplicateCase, ({ secret, guess }) => {
        const result = matchGuess(secret, guess);
        expect(result).toEqual(['G', 'B', 'Y', 'Y', 'Y']);
      }),
    );
  });

  // Pattern: conditional. A misplaced letter reserved by a later green remains black.
  it('reserves letters for greens before assigning yellows', () => {
    const reservedLetterCase = fc
      .uniqueArray(fc.constantFrom(...ALPHABET.split('')), { minLength: 2, maxLength: 2 })
      .map(([a, b]) => ({ secret: `${a}${a}${a}${a}${b}`, guess: `${a}${a}${b}${a}${b}` }));

    fc.assert(
      fc.property(reservedLetterCase, ({ secret, guess }) => {
        expect(matchGuess(secret, guess)).toEqual(['G', 'G', 'B', 'G', 'G']);
      }),
    );
  });
});
