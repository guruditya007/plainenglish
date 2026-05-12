# PlainEnglish

> A programming language written in plain English sentences.  
> Designed for study purposes — to show how programming languages actually work under the hood.

---

## What is this?

PlainEnglish is a working interpreted programming language. It is deliberately basic — think of it like learning to drive in a car park before hitting the motorway. The goal is not to build the next Python. The goal is to make every part of a language's pipeline visible, readable, and understandable.

If you have ever wondered how a computer turns the code you write into something that actually runs, this is a good place to start.

**Current capability:** calculator-level programming with drawing support.

---

## What it can do (v0.2)

- Variables: `let name be "Alice"`
- Maths: add, subtract, `times`, `divided by`, `mod`
- Output: `say "Hello"`
- Decisions: `if / otherwise if / otherwise`
- Loops: `repeat 5 times` and `while ... is ...`
- Drawing: `draw circle`, `draw line`, `draw rectangle` on a canvas
- Trigonometry: `sine of`, `cosine of`, `sqrt of`

---

## How it works — the architecture

```
Your code (text)
      |
      v
  [ LEXER ]
  Reads characters. Groups them into labelled tokens.
  "let" -> LET   "score" -> IDENT   "72" -> NUMBER
      |
      v
  [ PARSER ]
  Takes the token list. Checks grammar. Builds a meaning tree (AST).
  Assign { name: score, value: 72 }
      |
      v
  [ INTERPRETER ]
  Walks the tree. Executes each instruction.
  Keeps a dictionary of variables: { score: 72, name: "Alice" }
      |
      v
  [ OUTPUT ]
  Text lines  ------>  Output panel
  Draw commands  ---->  Canvas panel
```

This is the same pipeline that Python, JavaScript, Ruby, and most other languages use — just smaller and fully readable in one file.

---

## Quick start

### Requirements

- [Node.js LTS](https://nodejs.org) — download and install first

Check it installed:

```bash
node --version
npm --version
```

### Installation

```bash
npx create-react-app plainenglish
cd plainenglish
npm install lucide-react
```

### Adding the language

1. Download `PlainEnglish.jsx` from this repository
2. Open `src/App.js` in any text editor
3. Select all — delete everything
4. Paste in the contents of `PlainEnglish.jsx`
5. Change the first line from:

```js
import { useState, useRef, useCallback } from "react";
```

to:

```js
import React, { useState, useRef, useCallback } from "react";
```

6. Save

### Running

```bash
npm start
```

Opens at `http://localhost:3000`. Keep the terminal window open while using it.
To stop: press `Ctrl + C` in the terminal.

---

## Language reference

### Variables

```
let age be 25
let name be "Alice"
let total be price + tax
```

### Output

```
say "Hello, world"
say age
say "Your score is " + score
```

### Maths

| Word | Meaning |
|---|---|
| `+` | addition |
| `-` | subtraction |
| `times` | multiplication |
| `divided by` | division |
| `mod` | remainder |

### Decisions

```
if score is at least 90:
    say "Excellent"
otherwise if score is at least 50:
    say "Pass"
otherwise:
    say "Fail"
```

### Comparisons

| Expression | Meaning |
|---|---|
| `is` | equals |
| `is not` | not equal |
| `is greater than` | > |
| `is less than` | < |
| `is at least` | >= |
| `is at most` | <= |

### Loops

```
repeat 5 times:
    say "Hello"

while count is less than 10:
    let count be count + 1
```

### Drawing

```
draw circle at 300, 300 with size 50 with color "coral"
draw line from 0, 0 to 600, 600
draw rectangle at 100, 100 with width 200 height 80 with color "gold"
```

Canvas is 600 x 600 pixels. Top-left is 0, 0.

### Trigonometry

```
let x be cosine of angle
let y be sine of angle
let r be sqrt of 144
```

Angles are in degrees.

### Comments

```
# This is a comment
let x be 5
```

---

## Code rules

- One instruction per line
- Indentation defines blocks — use 4 spaces (Tab key)
- Strings must be in double quotes
- Variables must be defined with `let` before use

---

## Example programs

See the `examples/` folder. Highlights:

**Sea shell**
```
let angle be 0
let scale be 1
while angle is less than 1260:
    let x be 300 + scale times cosine of angle
    let y be 300 + scale times sine of angle
    draw circle at x, y with size 2 with color "coral"
    let angle be angle + 6
    let scale be scale + 0.18
```

**Fibonacci**
```
let a be 0
let b be 1
repeat 20 times:
    say a
    let temp be b
    let b be a + b
    let a be temp
```

---

## Project structure

```
plainenglish/
├── src/
│   └── App.js
├── examples/
│   ├── hello_world.pe
│   ├── fibonacci.pe
│   ├── grade_checker.pe
│   ├── repeat_loop.pe
│   ├── while_loop.pe
│   ├── sea_shell.pe
│   └── sine_wave.pe
├── docs/
│   ├── HOW_IT_WORKS.md
│   └── ERROR_LOG.md
├── PlainEnglish.jsx
├── LINKEDIN_POST.md
├── .gitignore
└── README.md
```

---

## Roadmap

- [ ] `and` / `or` in conditions
- [ ] Functions
- [ ] Lists
- [ ] String operations
- [ ] Stage 2 — translate PlainEnglish to Python

---

## License

MIT License — Copyright (c) 2026 Guruditya Sinha.

Free to use, modify, and build on. See [LICENSE](LICENSE) for the full text.

---

## Contributing

If you find a bug: write the smallest program that causes it, copy the error message, open a GitHub issue labelled `bug`.
