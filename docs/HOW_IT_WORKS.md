# How PlainEnglish works

PlainEnglish is an interpreted programming language. When you press Run, your code passes through three stages before anything executes.

```
Your code (text)
      |
      v
  [ LEXER ]       -- reads characters, labels them as tokens
      |
      v
  [ PARSER ]      -- checks grammar, builds a meaning tree (AST)
      |
      v
  [ INTERPRETER ] -- walks the tree, runs each instruction
      |
      v
  [ OUTPUT ]      -- text lines or canvas draw commands
```

---

## Stage 1 — The Lexer

The lexer reads your code one character at a time and groups characters into tokens — the smallest labelled pieces of the language.

### Example

Input:
```
let score be 72
```

Output tokens:
```
[LET] [IDENT: score] [BE] [NUMBER: 72] [NEWLINE]
```

Each token is a small JavaScript object:
```js
{ type: "LET" }
{ type: "IDENT", value: "score" }
{ type: "BE" }
{ type: "NUMBER", value: 72 }
```

### Indentation

The lexer also measures indentation at the start of each line. When indentation increases it emits an `INDENT` token. When it decreases it emits a `DEDENT` token. This is how the parser knows where blocks begin and end — the same approach Python uses.

### Token types

| Token | What it matches |
|---|---|
| `LET`, `BE`, `SAY` | core keywords |
| `IF`, `OTHERWISE` | branching |
| `REPEAT`, `TIMES`, `WHILE` | loops |
| `IS`, `NOT`, `GREATER`, `LESS`, `THAN` | comparisons |
| `AT`, `LEAST`, `MOST` | comparison modifiers |
| `DRAW`, `CIRCLE`, `LINE`, `RECTANGLE` | drawing |
| `WITH`, `SIZE`, `COLOR`, `FROM`, `TO` | draw parameters |
| `SINE`, `COSINE`, `SQRT`, `OF` | trigonometry |
| `DIVIDED`, `BY`, `MOD` | maths keywords |
| `PLUS`, `MINUS`, `COMMA` | symbols |
| `NUMBER` | `10`, `3.14` |
| `STRING` | `"Hello"` |
| `IDENT` | variable names like `score` |
| `INDENT` / `DEDENT` | indentation changes |
| `NEWLINE` | end of line |
| `EOF` | end of file |

---

## Stage 2 — The Parser

The parser takes the flat list of tokens and builds a tree — called an Abstract Syntax Tree (AST). The tree represents the meaning and structure of your program.

### Example

Input tokens:
```
[IF] [IDENT: score] [IS] [GREATER] [THAN] [NUMBER: 50] [COLON] ...
```

Output AST node:
```
If
├── condition:
│     Condition
│     ├── left:  Var(score)
│     ├── op:    >
│     └── right: Num(50)
├── consequent: [ Say("Pass") ]
└── alternates: [ { condition: null, body: [ Say("Fail") ] } ]
```

### How the parser works

The parser uses recursive descent — each grammar rule is its own function, and they call each other. The main ones are:

| Function | What it handles |
|---|---|
| `parseProgram` | the whole file |
| `parseStatement` | one instruction |
| `parseLet` | `let x be ...` |
| `parseSay` | `say ...` |
| `parseIf` | `if ... otherwise ...` |
| `parseRepeat` | `repeat N times:` |
| `parseWhile` | `while ... is ...:` |
| `parseDraw` | `draw circle / line / rectangle` |
| `parseExpr` | any maths expression |
| `parsePrimary` | a single value |
| `parseCondition` | a comparison |
| `parseBlock` | an indented block |

### Lookahead

The parser uses lookahead — peeking at the next token before deciding what to do. This is necessary because `times` has two meanings:

- `width times height` — multiplication
- `repeat 5 times:` — end of loop header

The parser checks whether the token after `times` is a value. If yes, it is multiplication. If it is a colon, it belongs to the repeat rule.

---

## Stage 3 — The Interpreter

The interpreter walks the AST and executes it. It maintains an environment — a dictionary mapping variable names to their current values.

```js
{
  name: "Alice",
  score: 72,
  angle: 180
}
```

### What each node type does

| Node | Action |
|---|---|
| `Assign` | store value in environment |
| `Say` | evaluate expression, add to output |
| `If` | evaluate condition, run matching block |
| `Repeat` | evaluate count, loop N times |
| `While` | loop until condition false (max 10,000 iterations) |
| `DrawCircle` | emit draw command: `{ shape: circle, x, y, radius, color }` |
| `DrawLine` | emit draw command: `{ shape: line, x1, y1, x2, y2, color }` |
| `DrawRect` | emit draw command: `{ shape: rect, x, y, w, h, color }` |
| `BinOp` | evaluate left and right, apply operator |
| `MathFn` | apply sine / cosine / sqrt |
| `Var` | look up name in environment |
| `Num` / `Str` | return literal value |

### Draw commands

The interpreter does not draw directly. It collects draw commands into a list. After execution, React paints them all onto an HTML `<canvas>` element. This separation keeps the interpreter clean — it only builds a list, never touches the screen.

---

## The output panels

**Output tab** — text from `say` statements, one line per call.

**Canvas tab** — all draw commands painted in order. Opens automatically when any draw command runs.

---

## File structure of the interpreter

All three stages live in `src/App.js`, in clearly marked sections:

```
// LEXER          tokenize() — produces token array
// PARSER         parse()    — produces AST
// INTERPRETER    interpret() — executes AST
// EXAMPLES       built-in example programs
// UI             React component
```

### Planned split (future)

```
src/
├── lexer.js
├── parser.js
├── interpreter.js
├── translator.js    <- Stage 2: PlainEnglish -> Python
└── App.js           <- UI only
```

---

## Design decisions

**Why `let x be 5` instead of `x = 5`?**
The equals sign is ambiguous — in maths it means "these are equal", in programming it means "store this value". `let x be 5` is unambiguous and reads naturally.

**Why indentation instead of braces?**
PlainEnglish is designed to read like written instructions. Indentation is natural — you already indent bullet points. Curly braces have no equivalent in everyday writing.

**Why `times` instead of `*`?**
`width times height` reads as you would say it aloud. `width * height` requires knowing what `*` means in this context.

**Why degrees for trigonometry?**
Radians are the mathematically natural unit but degrees are what most people use in everyday language. "Rotate 90 degrees" is natural. "Rotate 1.5708 radians" is not.

**Why collect draw commands instead of drawing immediately?**
It keeps the interpreter independent of any rendering technology. The same interpreter could output to SVG, a PDF, or a terminal later without changing a line of interpreter code.
