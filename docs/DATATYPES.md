# Data Types in PlainEnglish

This document describes every data type that PlainEnglish supports, how to use each one, what errors to expect, and what is planned for future versions.

---

## Currently Supported

---

### Integer

A whole number. No decimal point.

```
let age be 25
let count be 0
let year be 2026
```

**Negative integers** — supported as of v0.3:
```
let temp be -10
let balance be -500
let depth be -3
```

**Maths with integers:**
```
let total be 10 + 5
let difference be 20 - 8
let area be 4 times 6
let half be 10 divided by 2
let remainder be 10 mod 3
```

**What to watch out for:**
- Division always returns a decimal if the result is not whole. `10 divided by 3` gives `3.3333333333333335` — rounding is not yet built in. See OPEN-004 in ERROR_LOG.md.

---

### Float (Decimal Number)

A number with a decimal point.

```
let price be 3.14
let scale be 0.18
let ratio be 1.618
```

**Negative floats:**
```
let temperature be -3.5
let offset be -0.25
```

**Maths with floats works the same as integers:**
```
let result be 3.14 times 2
let area be 2.5 times 4.0
```

**What to watch out for:**
- Floating point precision is inherited from JavaScript. `0.1 + 0.2` gives `0.30000000000000004` not `0.3`. This is a known behaviour of all JavaScript numbers, not a PlainEnglish bug.

---

### String (Text)

Any text wrapped in double quotes.

```
let name be "Alice"
let greeting be "Hello, world"
let empty be ""
```

**Joining strings and numbers with +:**
```
let message be "Your score is " + score
let label be "Step " + count
```

If either side of `+` is a string, both sides are converted to strings and joined. This means:
```
let result be "Value: " + 42
# result is "Value: 42"
```

**What to watch out for:**
- Strings must use double quotes. Single quotes are not supported.
- There are no string operations yet — you cannot check the length of a string, convert it to uppercase, or search inside it. These are planned for a future version.
- You cannot currently compare two strings in a condition:
```
if name is "Alice":   # this does not work yet
```

---

## Partially Supported

---

### Boolean (True / False)

Booleans exist internally in PlainEnglish — every condition (`if score is greater than 5`) evaluates to true or false inside the interpreter. However you cannot store a boolean in a variable yet:

```
let flag be true     # not supported yet
let passed be false  # not supported yet
```

**What works:**
```
if score is greater than 50:
    say "Pass"
```

The condition `score is greater than 50` is evaluated as true or false internally. It just cannot be stored or passed around as a value.

**Planned:** `true` and `false` as first class values stored in variables. See the Roadmap section below.

---

## Not Yet Supported

---

### List (Collection of values)

A list stores multiple values under one name. Supported as of v0.3.

```
let scores be list
add 85 to scores
add 92 to scores
add 67 to scores

say length of scores
say first of scores
say last of scores
say item 2 of scores

if empty of scores is false:
    say "list has items"
```

**List operations:**

| Syntax | What it does |
|---|---|
| `let x be list` | creates an empty list |
| `add value to x` | appends value to the end |
| `remove value from x` | removes first matching value |
| `length of x` | returns number of items |
| `first of x` | returns the first item |
| `last of x` | returns the last item |
| `item N of x` | returns item at position N (starts at 1) |
| `empty of x` | returns true if list has no items |

**What to watch out for:**
- List indexing starts at 1, not 0. `item 1 of scores` is the first item.
- `item N of x` returns `nothing` if N is out of range.
- `first of x` and `last of x` return `nothing` if the list is empty.
- You cannot yet iterate over a list with a loop directly. Use index-based access with a counter for now.

**Note on syntax:** The natural English form `let scores be a list` was considered but the word `a` caused a parser conflict. The current syntax is `let scores be list` without the article. This will be revisited in a future version.

---

### Null / Empty

Supported as of v0.3. Represents the absence of a value.

```
let result be nothing

if result is nothing:
    say "no result yet"
```

`nothing` is also returned by list operations when the result does not exist — for example `first of` an empty list, or `item 5 of` a list with only 3 items.

---

### Negative Number — Implementation Note

Negative numbers were added in v0.3 by extending the lexer. The fix checks the token immediately before the minus sign. If the previous token was `BE`, `PLUS`, `MINUS`, `COLON`, `COMMA`, or `INDENT`, the minus sign is treated as part of the number rather than a subtraction operator.

This means:
```
let x be -5          # works — previous token is BE
let y be 10 + -3     # works — previous token is PLUS
let z be 10 - -3     # works — previous token is MINUS
draw circle at -10, 200 with size 5   # works — previous token is COMMA
```

But:
```
let result be x -5   # does NOT work as intended
                     # reads as (x) subtract (5), not (x) followed by (-5)
                     # use: let result be x - 5
```

---

## Type Coercion

PlainEnglish inherits JavaScript's type coercion for the `+` operator only:

| Left | Right | Result |
|---|---|---|
| Number | Number | Addition: `5 + 3` = `8` |
| String | Number | Concatenation: `"x" + 3` = `"x3"` |
| Number | String | Concatenation: `3 + "x"` = `"3x"` |
| String | String | Concatenation: `"a" + "b"` = `"ab"` |

All other operators (`-`, `times`, `divided by`, `mod`) treat both sides as numbers. Passing a string to these will produce `NaN` (Not a Number) — a JavaScript error value that will appear in your output.

---

## Error Messages Related to Types

| Error | Cause | Fix |
|---|---|---|
| `Variable "x" has not been defined` | Using a variable before declaring it with `let` | Add `let x be ...` before using `x` |
| `Cannot divide by zero` | Dividing by a variable or literal that equals 0 | Check the divisor before dividing |
| Output shows `NaN` | Maths on a string value | Check that the variable holds a number |
| Output shows very long decimal | Float precision | Rounding not yet built in — coming in future version |

---

## Roadmap — Data Types

| Type | Status | Version target |
|---|---|---|
| Integer | Done | v0.1 |
| Float | Done | v0.1 |
| String | Done | v0.1 |
| Negative numbers | Done | v0.3 |
| Boolean (`true` / `false`) | Done | v0.3 |
| List | Done | v0.3 |
| Null (`nothing`) | Done | v0.3 |
| Dictionary / Map | Future | v1.0 |
| Type declarations | Future | v1.0 |

---

## Design Philosophy

PlainEnglish does not require the programmer to declare types explicitly. You do not write `let age as integer be 25`. You just write `let age be 25` and the interpreter infers from the value that it is a number.

This is called **dynamic typing** — the same approach used by Python and JavaScript. It reduces the barrier to entry for beginners, at the cost of some safety guarantees that statically typed languages like Java or C++ provide.

As PlainEnglish matures, optional type hints may be introduced for users who want them:

```
let age as integer be 25      # optional hint — future
let name as text be "Alice"   # optional hint — future
```

But they will always remain optional, not required. The language is designed to be writable by someone at IELTS C1 English level without prior programming knowledge. Mandatory type declarations would raise that barrier unnecessarily.
