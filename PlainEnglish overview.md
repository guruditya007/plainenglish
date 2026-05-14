# PlainEnglish

> A natural language programming language — overview

**Guruditya Sinha** 
**v0.3**
**2026**
---
## What it is
PlainEnglish is a working interpreted programming language whose syntax is written in plain English sentences. It is not an AI tool or a wrapper. It has its own lexer, parser, and interpreter.

The target use is someone who reads and write English at a professional level but has no formal programming background. The syntax requires no prior knowledge of any programming language.

---

## What it looks like

**Conditional logic:**
```
let score be 72

if score is at least 70:
    say "Grade: B"
otherwise:
    say "Keep trying"
```

**Lists:**
```
let scores be list
add 85 to scores
add 92 to scores
say length of scores
say first of scores
```

---

## Current capability — v0.3

| Feature | Syntax |
|---|---|
| Variables | `let name be "Alice"` |
| Maths | `+ - times divided by mod` |
| Negative numbers | `let temp be -10` |
| Booleans | `let flag be true / false` |
| Null | `let result be nothing` |
| Lists | `let scores be list`, `add`, `remove`, `length of`, `item N of` |
| Decisions | `if / otherwise if / otherwise` |
| Loops | `repeat 5 times`, `while ... is ...` |
| Trigonometry | `sine of`, `cosine of`, `sqrt of` |

---

## How it works

Same pipeline as Python, JavaScript, Ruby — just smaller and fully readable in one file (~800 lines of JavaScript).

```
Your code (text)
      |
  [ LEXER ]       reads words, labels them as tokens
      |
  [ PARSER ]      checks grammar, builds a meaning tree
      |
  [ INTERPRETER ] executes the tree
      |
  Text output
```

Built with JavaScript, React, and the browser's built-in HTML Canvas API. No external dependencies beyond React. Runs entirely in the browser.

---

## Under the hood

| Component | Technology | What it does |
|---|---|---|
| Lexer | JavaScript | Reads characters, groups into labelled tokens |
| Parser | JavaScript (recursive descent) | Validates grammar, builds Abstract Syntax Tree |
| Interpreter | JavaScript | Walks the tree, maintains variable environment |
| UI | React | Editor, output panel, example buttons |
| Canvas | HTML Canvas API (built-in) | 2D drawing — no external library |
| Package | Node.js + Create React App | Local development environment |

---

## What is next — v0.4

- `and` / `or` in conditions — compound logic such as `if score is greater than 50 and score is less than 90`
- String operations — `length of name`, checking and manipulating text values
- Improved error messages — replacing internal token names with plain English descriptions

---

## License

MIT — Copyright (c) 2026 Guruditya Sinha. Free to use, modify, and build on.

**GitHub:** https://github.com/guruditya007/plainenglish
