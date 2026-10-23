# Reflection

**Name / Andrew ID:** Sanika Jain / sanikaj

**Recitation group members (Task 2):** Khushi Thaker, Anna David, and Vidhya Vishwanath

---

### 1. Valid but weak

The Wordle invariant that the result has five colors from `{G, Y, B}` is
valid because the specification requires one valid color for each of the five
guess positions. It kills few mutants because incorrect scoring logic can
still return five allowed colors. It would catch a bug that returned four
colors, or returned an invalid status such as `R` for a repeated letter.

### 2. A generator problem, not a property problem

The `singlePass` Wordle mutant was flaky because the arbitrary word generator
did not reliably produce a letter that was yellow early in the guess but green
later. I added a targeted generator with `secret = aaaaB` and
`guess = aaBaB`, using two distinct generated letters.

Before:

```text
~ singlePass     flaky: killed in 4/5 runs
```

After:

```text
✔ singlePass     killed by: never credits a letter more times than the secret contains it; reserves letters for greens before assigning yellows; credits exactly the letters shared by secret and guess
```

### 3. Reading a counterexample

```text
Counterexample: ["AAAAR","AARAR"]
```

For this input, the `R` at guess position 2 is yellow-looking but the `R` at
position 4 is green. The specification assigns greens first, so the only
unused secret letters are the four `A`s and the position-2 `R` must be black;
the `singlePass` mutant incorrectly spends the `R` on the earlier position.

### 4. Your project

The debug toggle mode in my project would benefit from property-based testing.

- **Algebraic:** Toggling debug mode twice returns the application to its
  original debug state. The generator should produce both possible initial
  states and valid toggle actions.
- **Invariant:** Enabling debug mode never changes user-facing application
  data; it changes only the debug setting and related diagnostics. The
  generator should create valid application states with arbitrary data, while
  avoiding malformed states that the toggle function is not required to accept.
