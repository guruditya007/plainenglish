import React, { useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
//  LEXER
// ─────────────────────────────────────────────
const TT = {
  LET: "LET", BE: "BE", SAY: "SAY",
  IF: "IF", OTHERWISE: "OTHERWISE",
  REPEAT: "REPEAT", TIMES: "TIMES",
  WHILE: "WHILE",
  IS: "IS", NOT: "NOT",
  GREATER: "GREATER", LESS: "LESS", THAN: "THAN",
  AT: "AT", LEAST: "LEAST", MOST: "MOST",
  AND: "AND", OR: "OR",
  TIMES_OP: "TIMES_OP", DIVIDED: "DIVIDED", BY: "BY", MOD: "MOD",
  PLUS: "PLUS", MINUS: "MINUS",
  // draw tokens
  DRAW: "DRAW", CIRCLE: "CIRCLE", LINE: "LINE", RECTANGLE: "RECTANGLE",
  FROM: "FROM", TO: "TO", WITH: "WITH", SIZE: "SIZE",
  WIDTH: "WIDTH", HEIGHT: "HEIGHT", COLOR: "COLOR",
  OF: "OF", SINE: "SINE", COSINE: "COSINE", SQRT: "SQRT",
  COMMA: "COMMA",
  NUMBER: "NUMBER", STRING: "STRING", IDENT: "IDENT",
  COLON: "COLON", NEWLINE: "NEWLINE", INDENT: "INDENT", DEDENT: "DEDENT",
  EOF: "EOF",
};

function tokenize(source) {
  const lines = source.split("\n");
  const tokens = [];
  const indentStack = [0];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const raw = lines[lineNum];
    const trimmed = raw.trimEnd();
    if (trimmed.trim() === "" || trimmed.trim().startsWith("#")) {
      continue;
    }

    // measure indent
    let indent = 0;
    while (indent < trimmed.length && trimmed[indent] === " ") indent++;

    const currentIndent = indentStack[indentStack.length - 1];
    if (indent > currentIndent) {
      indentStack.push(indent);
      tokens.push({ type: TT.INDENT });
    } else {
      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        tokens.push({ type: TT.DEDENT });
      }
    }

    // tokenize the line content
    let i = indent;
    const line = trimmed;
    while (i < line.length) {
      if (line[i] === " ") { i++; continue; }

      if (line[i] === '"') {
        let j = i + 1;
        while (j < line.length && line[j] !== '"') j++;
        tokens.push({ type: TT.STRING, value: line.slice(i + 1, j) });
        i = j + 1;
        continue;
      }

      if (/\d/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\d.]/.test(line[j])) j++;
        tokens.push({ type: TT.NUMBER, value: parseFloat(line.slice(i, j)) });
        i = j;
        continue;
      }

      if (line[i] === "+") { tokens.push({ type: TT.PLUS }); i++; continue; }
      if (line[i] === "-") { tokens.push({ type: TT.MINUS }); i++; continue; }
      if (line[i] === ":") { tokens.push({ type: TT.COLON }); i++; continue; }
      if (line[i] === ",") { tokens.push({ type: TT.COMMA }); i++; continue; }

      // word
      if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[a-zA-Z_0-9]/.test(line[j])) j++;
        const word = line.slice(i, j).toLowerCase();
        const kwMap = {
          let: TT.LET, be: TT.BE, say: TT.SAY,
          if: TT.IF, otherwise: TT.OTHERWISE,
          repeat: TT.REPEAT, times: TT.TIMES,
          while: TT.WHILE,
          is: TT.IS, not: TT.NOT,
          greater: TT.GREATER, less: TT.LESS, than: TT.THAN,
          at: TT.AT, least: TT.LEAST, most: TT.MOST,
          and: TT.AND, or: TT.OR,
          divided: TT.DIVIDED, by: TT.BY, mod: TT.MOD,
          draw: TT.DRAW, circle: TT.CIRCLE, line: TT.LINE, rectangle: TT.RECTANGLE,
          from: TT.FROM, to: TT.TO, with: TT.WITH, size: TT.SIZE,
          width: TT.WIDTH, height: TT.HEIGHT, color: TT.COLOR,
          of: TT.OF, sine: TT.SINE, cosine: TT.COSINE, sqrt: TT.SQRT,
        };
        // "times" as operator vs loop keyword handled by parser context
        if (kwMap[word]) {
          tokens.push({ type: kwMap[word], raw: word });
        } else {
          tokens.push({ type: TT.IDENT, value: line.slice(i, j) });
        }
        i = j;
        continue;
      }

      i++; // skip unknown char
    }
    tokens.push({ type: TT.NEWLINE });
  }

  // close remaining indents
  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: TT.DEDENT });
  }
  tokens.push({ type: TT.EOF });
  return tokens;
}

// ─────────────────────────────────────────────
//  PARSER  →  AST
// ─────────────────────────────────────────────
function parse(tokens) {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function eat(type) {
    const t = tokens[pos];
    if (type && t.type !== type) throw new Error(`Expected ${type} but got ${t.type} ("${t.raw || (t.value ?? "")}")`);
    pos++;
    return t;
  }
  function check(...types) { return types.includes(tokens[pos].type); }
  function skipNewlines() { while (check(TT.NEWLINE)) eat(TT.NEWLINE); }

  function parseProgram() {
    const stmts = [];
    skipNewlines();
    while (!check(TT.EOF)) {
      stmts.push(parseStatement());
      if (check(TT.NEWLINE)) eat(TT.NEWLINE);
      skipNewlines();
    }
    return { type: "Program", body: stmts };
  }

  function parseStatement() {
    const t = peek();
    if (t.type === TT.LET) return parseLet();
    if (t.type === TT.SAY) return parseSay();
    if (t.type === TT.IF) return parseIf();
    if (t.type === TT.REPEAT) return parseRepeat();
    if (t.type === TT.WHILE) return parseWhile();
    if (t.type === TT.DRAW) return parseDraw();
    throw new Error(`Unexpected token: ${t.type} ("${t.raw || (t.value ?? "")}")`);
  }

  function parseLet() {
    eat(TT.LET);
    const name = eat(TT.IDENT).value;
    eat(TT.BE);
    const value = parseExpr();
    return { type: "Assign", name, value };
  }

  function parseSay() {
    eat(TT.SAY);
    const value = parseExpr();
    return { type: "Say", value };
  }

  function parseIf() {
    eat(TT.IF);
    const condition = parseCondition();
    eat(TT.COLON);
    eat(TT.NEWLINE);
    const consequent = parseBlock();
    const alternates = [];

    while (check(TT.OTHERWISE)) {
      eat(TT.OTHERWISE);
      if (check(TT.IF)) {
        eat(TT.IF);
        const cond = parseCondition();
        eat(TT.COLON);
        eat(TT.NEWLINE);
        const block = parseBlock();
        alternates.push({ condition: cond, body: block });
      } else {
        eat(TT.COLON);
        eat(TT.NEWLINE);
        const block = parseBlock();
        alternates.push({ condition: null, body: block });
        break;
      }
    }
    return { type: "If", condition, consequent, alternates };
  }

  function parseRepeat() {
    eat(TT.REPEAT);
    const count = parseExpr();
    eat(TT.TIMES);
    eat(TT.COLON);
    eat(TT.NEWLINE);
    const body = parseBlock();
    return { type: "Repeat", count, body };
  }

  function parseWhile() {
    eat(TT.WHILE);
    const condition = parseCondition();
    eat(TT.COLON);
    eat(TT.NEWLINE);
    const body = parseBlock();
    return { type: "While", condition, body };
  }

  // draw circle at x, y with size r
  // draw circle at x, y with size r with color "red"
  // draw line from x1, y1 to x2, y2
  // draw rectangle at x, y with width w height h
  function parseDraw() {
    eat(TT.DRAW);
    const t = peek();

    if (t.type === TT.CIRCLE) {
      eat(TT.CIRCLE);
      eat(TT.AT);
      const x = parseExpr(); eat(TT.COMMA); const y = parseExpr();
      let radius = 5; let color = "white";
      if (check(TT.WITH)) {
        eat(TT.WITH);
        if (check(TT.SIZE)) { eat(TT.SIZE); radius = parseExpr(); }
        if (check(TT.WITH)) { eat(TT.WITH); eat(TT.COLOR); color = parseExpr(); }
      }
      return { type: "DrawCircle", x, y, radius, color };
    }

    if (t.type === TT.LINE) {
      eat(TT.LINE);
      eat(TT.FROM);
      const x1 = parseExpr(); eat(TT.COMMA); const y1 = parseExpr();
      eat(TT.TO);
      const x2 = parseExpr(); eat(TT.COMMA); const y2 = parseExpr();
      let color = "white";
      if (check(TT.WITH)) { eat(TT.WITH); eat(TT.COLOR); color = parseExpr(); }
      return { type: "DrawLine", x1, y1, x2, y2, color };
    }

    if (t.type === TT.RECTANGLE) {
      eat(TT.RECTANGLE);
      eat(TT.AT);
      const x = parseExpr(); eat(TT.COMMA); const y = parseExpr();
      eat(TT.WITH);
      eat(TT.WIDTH); const w = parseExpr();
      eat(TT.HEIGHT); const h = parseExpr();
      let color = "white";
      if (check(TT.WITH)) { eat(TT.WITH); eat(TT.COLOR); color = parseExpr(); }
      return { type: "DrawRect", x, y, w, h, color };
    }

    throw new Error("Expected circle, line, or rectangle after draw");
  }

  function parseBlock() {
    eat(TT.INDENT);
    const stmts = [];
    skipNewlines();
    while (!check(TT.DEDENT) && !check(TT.EOF)) {
      stmts.push(parseStatement());
      // eat the newline that ends this statement, then skip any blank lines
      if (check(TT.NEWLINE)) eat(TT.NEWLINE);
      skipNewlines();
    }
    if (check(TT.DEDENT)) eat(TT.DEDENT);
    return stmts;
  }

  function parseCondition() {
    const left = parseExpr();
    // is [not] greater than / less than / at least / at most / is [not]
    eat(TT.IS);
    let negate = false;
    if (check(TT.NOT)) { eat(TT.NOT); negate = true; }

    let op;
    if (check(TT.GREATER)) { eat(TT.GREATER); eat(TT.THAN); op = ">"; }
    else if (check(TT.LESS)) { eat(TT.LESS); eat(TT.THAN); op = "<"; }
    else if (check(TT.AT)) {
      eat(TT.AT);
      if (check(TT.LEAST)) { eat(TT.LEAST); op = ">="; }
      else { eat(TT.MOST); op = "<="; }
    } else {
      op = "==";
    }

    const right = parseExpr();
    return { type: "Condition", left, op: negate && op === "==" ? "!=" : op, right, negate: negate && op !== "==" };
  }

  // expr handles + - times divided by mod
  function isValueToken(t) { return [TT.NUMBER, TT.STRING, TT.IDENT, TT.SINE, TT.COSINE, TT.SQRT].includes(t.type); }
  function parseExpr() {
    let left = parsePrimary();
    while (true) {
      if (check(TT.PLUS)) { eat(TT.PLUS); left = { type: "BinOp", op: "+", left, right: parsePrimary() }; }
      else if (check(TT.MINUS)) { eat(TT.MINUS); left = { type: "BinOp", op: "-", left, right: parsePrimary() }; }
      else if (check(TT.TIMES) && isValueToken(tokens[pos + 1])) { eat(TT.TIMES); left = { type: "BinOp", op: "*", left, right: parsePrimary() }; }
      else if (check(TT.DIVIDED)) { eat(TT.DIVIDED); eat(TT.BY); left = { type: "BinOp", op: "/", left, right: parsePrimary() }; }
      else if (check(TT.MOD)) { eat(TT.MOD); left = { type: "BinOp", op: "%", left, right: parsePrimary() }; }
      else break;
    }
    return left;
  }

  function parsePrimary() {
    const t = peek();
    if (t.type === TT.NUMBER) { eat(TT.NUMBER); return { type: "Num", value: t.value }; }
    if (t.type === TT.STRING) { eat(TT.STRING); return { type: "Str", value: t.value }; }
    if (t.type === TT.SINE) { eat(TT.SINE); eat(TT.OF); return { type: "MathFn", fn: "sine", arg: parsePrimary() }; }
    if (t.type === TT.COSINE) { eat(TT.COSINE); eat(TT.OF); return { type: "MathFn", fn: "cosine", arg: parsePrimary() }; }
    if (t.type === TT.SQRT) { eat(TT.SQRT); eat(TT.OF); return { type: "MathFn", fn: "sqrt", arg: parsePrimary() }; }
    if (t.type === TT.IDENT) { eat(TT.IDENT); return { type: "Var", name: t.value }; }
    throw new Error(`Expected a value but got ${t.type}`);
  }

  return parseProgram();
}

// ─────────────────────────────────────────────
//  INTERPRETER
// ─────────────────────────────────────────────
function interpret(ast, onOutput, onDraw) {
  const env = {};

  function evalNode(node) {
    switch (node.type) {
      case "Program": node.body.forEach(evalNode); break;
      case "Assign": env[node.name] = evalExpr(node.value); break;
      case "Say": {
        const val = evalExpr(node.value);
        onOutput(String(val));
        break;
      }
      case "DrawCircle": {
        onDraw({ shape: "circle",
          x: evalExpr(node.x), y: evalExpr(node.y),
          radius: typeof node.radius === "number" ? node.radius : evalExpr(node.radius),
          color: typeof node.color === "string" ? node.color : evalExpr(node.color),
        });
        break;
      }
      case "DrawLine": {
        onDraw({ shape: "line",
          x1: evalExpr(node.x1), y1: evalExpr(node.y1),
          x2: evalExpr(node.x2), y2: evalExpr(node.y2),
          color: typeof node.color === "string" ? node.color : evalExpr(node.color),
        });
        break;
      }
      case "DrawRect": {
        onDraw({ shape: "rect",
          x: evalExpr(node.x), y: evalExpr(node.y),
          w: evalExpr(node.w), h: evalExpr(node.h),
          color: typeof node.color === "string" ? node.color : evalExpr(node.color),
        });
        break;
      }
      case "If": {
        if (evalCond(node.condition)) {
          node.consequent.forEach(evalNode);
        } else {
          for (const alt of node.alternates) {
            if (alt.condition === null || evalCond(alt.condition)) {
              alt.body.forEach(evalNode);
              break;
            }
          }
        }
        break;
      }
      case "Repeat": {
        const n = evalExpr(node.count);
        for (let i = 0; i < n; i++) node.body.forEach(evalNode);
        break;
      }
      case "While": {
        let guard = 0;
        while (evalCond(node.condition)) {
          if (++guard > 10000) throw new Error("Infinite loop detected — stopped after 10,000 iterations");
          node.body.forEach(evalNode);
        }
        break;
      }
    }
  }

  function evalExpr(node) {
    if (node.type === "Num") return node.value;
    if (node.type === "Str") return node.value;
    if (node.type === "Var") {
      if (!(node.name in env)) throw new Error(`Variable "${node.name}" has not been defined`);
      return env[node.name];
    }
    if (node.type === "BinOp") {
      const l = evalExpr(node.left);
      const r = evalExpr(node.right);
      if (node.op === "+") return typeof l === "string" || typeof r === "string" ? String(l) + String(r) : l + r;
      if (node.op === "-") return l - r;
      if (node.op === "*") return l * r;
      if (node.op === "/") { if (r === 0) throw new Error("Cannot divide by zero"); return l / r; }
      if (node.op === "%") return l % r;
    }
    if (node.type === "MathFn") {
      const v = evalExpr(node.arg);
      const deg = v * Math.PI / 180;
      if (node.fn === "sine") return Math.sin(deg);
      if (node.fn === "cosine") return Math.cos(deg);
      if (node.fn === "sqrt") return Math.sqrt(v);
    }
    throw new Error(`Unknown expression type: ${node.type}`);
  }

  function evalCond(node) {
    const l = evalExpr(node.left);
    const r = evalExpr(node.right);
    switch (node.op) {
      case "==": return l === r;
      case "!=": return l !== r;
      case ">": return l > r;
      case "<": return l < r;
      case ">=": return l >= r;
      case "<=": return l <= r;
    }
  }

  evalNode(ast);
}

// ─────────────────────────────────────────────
//  EXAMPLES
// ─────────────────────────────────────────────
const EXAMPLES = {
  "Hello World": `say "Hello, world"`,

  "Variables & Maths": `let price be 40
let tax be 8
let total be price + tax
say "Total cost is: " + total`,

  "If / Otherwise": `let score be 72

if score is at least 90:
    say "Grade: A"
otherwise if score is at least 70:
    say "Grade: B"
otherwise if score is at least 50:
    say "Grade: C"
otherwise:
    say "Grade: Fail"`,

  "Repeat Loop": `let count be 0
repeat 5 times:
    let count be count + 1
    say "Step " + count`,

  "While Loop": `let number be 1
while number is less than 33:
    let number be number times 2
say "Final value: " + number`,

  "Draw Shapes": `draw circle at 200, 200 with size 60
draw circle at 200, 200 with size 40 with color "gold"
draw rectangle at 100, 300 with width 200 height 80
draw line from 50, 50 to 350, 350`,

  "Sea Shell": `let angle be 0
let scale be 1

while angle is less than 1260:
    let x be 300 + scale times cosine of angle
    let y be 300 + scale times sine of angle
    draw circle at x, y with size 2 with color "coral"
    let angle be angle + 6
    let scale be scale + 0.18`,
};

// ─────────────────────────────────────────────
//  UI
// ─────────────────────────────────────────────
export default function App() {
  const [code, setCode] = useState(EXAMPLES["Hello World"]);
  const [output, setOutput] = useState([]);
  const [drawCmds, setDrawCmds] = useState([]);
  const [error, setError] = useState(null);
  const [activeExample, setActiveExample] = useState("Hello World");
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("output");
  const textareaRef = useRef(null);
  const canvasRef = useRef(null);

  // Paint canvas whenever drawCmds changes
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0a0a0e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCmds.forEach(cmd => {
      ctx.beginPath();
      ctx.strokeStyle = cmd.color || "white";
      ctx.fillStyle = cmd.color || "white";
      if (cmd.shape === "circle") {
        ctx.arc(cmd.x, cmd.y, Math.max(0.5, cmd.radius), 0, Math.PI * 2);
        ctx.fill();
      } else if (cmd.shape === "line") {
        ctx.moveTo(cmd.x1, cmd.y1);
        ctx.lineTo(cmd.x2, cmd.y2);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (cmd.shape === "rect") {
        ctx.strokeRect(cmd.x, cmd.y, cmd.w, cmd.h);
      }
    });
  }, [drawCmds]);

  const run = useCallback(() => {
    setRunning(true);
    setError(null);
    const lines = [];
    const cmds = [];
    setTimeout(() => {
      try {
        const tokens = tokenize(code);
        const ast = parse(tokens);
        interpret(ast, (line) => lines.push(line), (cmd) => cmds.push(cmd));
        setOutput(lines.length ? lines : cmds.length ? [] : ["(no output)"]);
        setDrawCmds(cmds);
        if (cmds.length > 0) setActiveTab("canvas");
        else setActiveTab("output");
      } catch (e) {
        setError(e.message);
        setOutput([]);
        setDrawCmds([]);
      }
      setRunning(false);
    }, 60);
  }, [code]);

  const handleTab = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = code.slice(0, start) + "    " + code.slice(end);
      setCode(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0e10",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8e0d0",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #2a2a30",
        padding: "18px 28px",
        display: "flex",
        alignItems: "baseline",
        gap: "14px",
        background: "#111114",
      }}>
        <span style={{
          fontSize: "22px",
          fontWeight: "bold",
          letterSpacing: "0.04em",
          color: "#f0e8d8",
        }}>PlainEnglish</span>
        <span style={{
          fontSize: "12px",
          color: "#666",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
        }}>v0.2 · playground</span>
      </header>

      {/* Example selector */}
      <div style={{
        padding: "12px 28px",
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        borderBottom: "1px solid #1e1e22",
        background: "#111114",
      }}>
        <span style={{ fontSize: "11px", color: "#555", alignSelf: "center", marginRight: "4px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>Examples:</span>
        {Object.keys(EXAMPLES).map(name => (
          <button
            key={name}
            onClick={() => { setCode(EXAMPLES[name]); setActiveExample(name); setOutput([]); setDrawCmds([]); setError(null); setActiveTab("output"); }}
            style={{
              padding: "5px 12px",
              borderRadius: "3px",
              border: "1px solid",
              borderColor: activeExample === name ? "#c8a96e" : "#2e2e36",
              background: activeExample === name ? "#1e1a12" : "transparent",
              color: activeExample === name ? "#c8a96e" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "'Courier New', monospace",
              transition: "all 0.15s",
            }}
          >{name}</button>
        ))}
      </div>

      {/* Main editor area */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0",
        minHeight: "0",
      }}>
        {/* Editor pane */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #1e1e22",
        }}>
          <div style={{
            padding: "10px 20px",
            fontSize: "11px",
            color: "#555",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            borderBottom: "1px solid #1a1a1e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>code</span>
            <span style={{ color: "#333" }}>tab = 4 spaces</span>
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => { setCode(e.target.value); setActiveExample(null); }}
            onKeyDown={handleTab}
            spellCheck={false}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              padding: "20px 24px",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "14px",
              lineHeight: "1.75",
              color: "#d4c9b8",
              caretColor: "#c8a96e",
            }}
          />
        </div>

        {/* Output / Canvas pane */}
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Tab bar */}
          <div style={{
            padding: "0 20px",
            borderBottom: "1px solid #1a1a1e",
            display: "flex",
            alignItems: "center",
            gap: "0",
            background: "#111114",
          }}>
            {["output", "canvas"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #c8a96e" : "2px solid transparent",
                color: activeTab === tab ? "#c8a96e" : "#555",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "-1px",
              }}>{tab}</button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "11px", color: "#333", fontFamily: "monospace" }}>
              {activeTab === "canvas" ? `${drawCmds.length} draw commands` : `${output.length} lines`}
            </span>
          </div>

          {/* Output tab */}
          {activeTab === "output" && (
            <div style={{
              flex: 1, padding: "20px 24px",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "14px", lineHeight: "1.75", overflowY: "auto",
            }}>
              {error && (
                <div style={{
                  color: "#e07070", background: "#1a0e0e",
                  border: "1px solid #3a1a1a", borderRadius: "4px",
                  padding: "12px 16px", marginBottom: "12px", fontSize: "13px",
                }}>
                  <span style={{ color: "#e08080", fontWeight: "bold" }}>Error: </span>{error}
                </div>
              )}
              {output.map((line, i) => (
                <div key={i} style={{ color: "#a8d8a0", marginBottom: "2px" }}>
                  <span style={{ color: "#3a4a3a", marginRight: "12px", userSelect: "none" }}>›</span>
                  {line}
                </div>
              ))}
              {output.length === 0 && !error && (
                <span style={{ color: "#333", fontStyle: "italic" }}>Press Run to execute your code</span>
              )}
            </div>
          )}

          {/* Canvas tab */}
          {activeTab === "canvas" && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", background: "#0a0a0e" }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                style={{ maxWidth: "100%", maxHeight: "100%", border: "1px solid #1e1e22" }}
              />
            </div>
          )}

        </div>
      </div>

      {/* Footer / Run button */}
      <footer style={{
        padding: "14px 28px",
        borderTop: "1px solid #1e1e22",
        background: "#111114",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <button
          onClick={run}
          disabled={running}
          style={{
            padding: "9px 28px",
            background: running ? "#1a1a1a" : "#c8a96e",
            color: running ? "#555" : "#0e0e10",
            border: "none",
            borderRadius: "3px",
            cursor: running ? "not-allowed" : "pointer",
            fontFamily: "'Georgia', serif",
            fontSize: "14px",
            fontWeight: "bold",
            letterSpacing: "0.06em",
            transition: "all 0.15s",
          }}
        >{running ? "Running…" : "Run"}</button>
        <button
          onClick={() => { setOutput([]); setDrawCmds([]); setError(null); }}
          style={{
            padding: "9px 18px",
            background: "transparent",
            color: "#555",
            border: "1px solid #2a2a30",
            borderRadius: "3px",
            cursor: "pointer",
            fontFamily: "'Georgia', serif",
            fontSize: "14px",
            transition: "all 0.15s",
          }}
        >Clear</button>
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "#333", fontFamily: "monospace" }}>
          PlainEnglish · v0.2 · draw enabled
        </span>
      </footer>
    </div>
  );
}
