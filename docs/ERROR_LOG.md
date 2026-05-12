# Error log

A running record of every bug found, diagnosed, and fixed. Newest at the top.

---

## Format

Each entry:
- **ID** — reference number
- **Date** — when found
- **Status** — Fixed / Open / Won't Fix
- **Symptom** — what the user saw
- **Cause** — what was actually wrong
- **Fix** — what changed
- **Trigger program** — the code that caused it

---

## Fixed bugs

---

### BUG-004 · Math function tokens missing from times lookahead

- **Date:** 2026-05-11
- **Status:** Fixed
- **Symptom:** `Error: Unexpected token: TIMES ("times")` when using `times` before `sine` or `cosine`
- **Trigger program:**
  ```
  let x be 300 + scale times cosine of angle
  ```
- **Cause:** The `times` keyword has a lookahead check — it only acts as a multiply operator if the next token is a value. The list of valid "value tokens" was `NUMBER`, `STRING`, `IDENT`. It did not include `SINE`, `COSINE`, or `SQRT`, so `scale times cosine of angle` failed the check and crashed.
- **Fix:** Added `TT.SINE`, `TT.COSINE`, `TT.SQRT` to `isValueToken()`.
  ```js
  // Before
  function isValueToken(t) {
    return [TT.NUMBER, TT.STRING, TT.IDENT].includes(t.type);
  }
  // After
  function isValueToken(t) {
    return [TT.NUMBER, TT.STRING, TT.IDENT, TT.SINE, TT.COSINE, TT.SQRT].includes(t.type);
  }
  ```

---

### BUG-003 · Inconsistent newline handling caused INDENT errors

- **Date:** 2026-05-11
- **Status:** Fixed
- **Symptom:** `Error: Unexpected token: INDENT ("")` when running any program with indented blocks
- **Cause:** Individual parsers (`parseLet`, `parseSay`, `parseDraw`) were inconsistently eating newline tokens. This left the block parser out of sync — it expected a clean `DEDENT` but found an `INDENT` because the token stream had drifted.
- **Fix:** Established a single rule — individual statement parsers never consume newlines. `parseBlock` and `parseProgram` own all newline handling. Each eats one newline after a statement then calls `skipNewlines()` for blank lines.

---

### BUG-002 · `times` keyword ambiguity

- **Date:** 2026-05-11
- **Status:** Fixed
- **Symptom:** `Error: Expected a value but got COLON` when running a `repeat` loop
- **Trigger program:**
  ```
  repeat 20 times:
      say "Hello"
  ```
- **Cause:** `times` serves two roles — multiply operator (`width times height`) and loop keyword (`repeat 5 times:`). The expression parser greedily consumed `times` as multiply in all cases, then crashed when it found `:` instead of a second value.
- **Fix:** Added a one-token lookahead in `parseExpr`. `times` only acts as multiply when the next token is a value. If the next token is `:`, it is left for the repeat parser.
  ```js
  else if (check(TT.TIMES) && isValueToken(tokens[pos + 1])) { ... }
  ```

---

### BUG-001 · Nullish coalescing operator compatibility

- **Date:** 2026-05-11
- **Status:** Fixed
- **Symptom:**
  ```
  SyntaxError: Nullish coalescing operator(??) requires parens
  when mixing with logical operators.
  ```
- **Cause:** `??` used alongside `||` without parentheses. The version of Babel bundled with Create React App requires parentheses when mixing these operators.
- **Fix:** Wrapped `t.value ?? ""` in parentheses: `(t.value ?? "")` in two error message locations.

---

## Open issues

---

### OPEN-005 · `and` / `or` not yet wired into parser

- **Status:** Open
- **Symptom:** FizzBuzz and other programs needing compound conditions are not yet possible
- **Example:**
  ```
  if score is greater than 50 and score is less than 90:
  ```
- **Notes:** `AND` and `OR` are registered tokens in the lexer but `parseCondition` does not handle them yet.

---

### OPEN-004 · No rounding for division output

- **Status:** Open
- **Symptom:** `10 divided by 3` outputs `3.3333333333333335`
- **Proposed fix:** Add `round` keyword, or limit decimal places in output by default

---

### OPEN-003 · Unfriendly error messages

- **Status:** Open
- **Symptom:** Errors reference internal token names like `IDENT`, `COLON`, `DEDENT`
- **Example:** `Expected IDENT but got COLON`
- **Proposed fix:** Map token types to plain English descriptions in all error output

---

### OPEN-002 · Empty blocks crash the parser

- **Status:** Open
- **Symptom:** An `if` or `repeat` with nothing indented inside it crashes
- **Example:**
  ```
  if score is greater than 5:
  say "done"
  ```
- **Proposed fix:** Raise a clear error: "block cannot be empty"

---

### OPEN-001 · Nested `times` in repeat count

- **Status:** Open
- **Symptom:** Using a multiplication expression as the count in `repeat` fails due to the lookahead fix
- **Example:**
  ```
  repeat rows times cols times:
  ```
- **Proposed fix:** Require parentheses or a variable for expressions in repeat headers

---

## Won't fix

*(none yet)*

---

## How to report a bug

1. Write the smallest PlainEnglish program that causes the problem
2. Copy the exact error message from the output panel
3. Open a GitHub issue with both, labelled `bug`
