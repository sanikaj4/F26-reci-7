import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer(), fc.integer())
  .map(([a, b]): Interval => (a <= b ? [a, b] : [b, a]));
const intervalList = fc.array(interval);
const disjointIntervalList: fc.Arbitrary<Interval[]> = fc
  .tuple(
    fc.integer({ min: -100, max: 100 }),
    fc.array(fc.tuple(fc.integer({ min: 0, max: 10 }), fc.integer({ min: 0, max: 10 }))),
  )
  .map(([start, parts]) => {
    let next = start;
    return parts.map(([gap, length]): Interval => {
      next += gap;
      const interval: Interval = [next, next + length];
      next = interval[1] + 1;
      return interval;
    });
  });

const isCovered = (intervals: readonly Interval[], point: number) =>
  intervals.some(([start, end]) => start <= point && point <= end);

describe('mergeIntervals', () => {
  // Pattern: invariant. The output is sorted and consecutive intervals do not touch.
  it('returns sorted, disjoint intervals', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const inputCopy = xs.map(([start, end]): Interval => [start, end]);
        const out = mergeIntervals(xs);
        expect(out).toEqual([...out].sort((a, b) => a[0] - b[0]));
        expect(out.every(([start, end]) => start < end || start === end)).toBe(true);
        expect(out.every((_, i) => i === 0 || out[i - 1][1] < out[i][0])).toBe(true);
        expect(xs).toEqual(inputCopy);
      }),
    );
  });

  // Pattern: invariant. Intervals that touch are merged because they have no gap.
  it('merges intervals that touch', () => {
    fc.assert(
      fc.property(interval, fc.integer({ min: 0, max: 10 }), ([start, end], length) => {
        const touching: Interval = [end, end + length];
        expect(mergeIntervals([[start, end], touching])).toEqual([[start, end + length]]);
      }),
    );
  });

  // Pattern: differential. Input and output cover the same generated points.
  it('preserves coverage of every point', () => {
    fc.assert(
      fc.property(intervalList, fc.integer(), (xs, point) => {
        expect(isCovered(mergeIntervals(xs), point)).toBe(isCovered(xs, point));
      }),
    );
  });

  // Pattern: metamorphic. Permuting the input does not change the result.
  it('is unchanged when the input is permuted', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const shuffled = [...xs].reverse();
        expect(mergeIntervals(shuffled)).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: algebraic. Merging an already merged result does not change it.
  it('is idempotent', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. Non-overlapping, non-touching input is unchanged.
  it('leaves separated intervals unchanged', () => {
    fc.assert(
      fc.property(disjointIntervalList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });
});
