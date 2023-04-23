/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable no-mixed-spaces-and-tabs */
import * as vscode from 'vscode';
import * as path from 'path';
import { Console } from 'console';
import { EOL } from 'os';
import { log } from 'console';

let enable_debug = true
let enable_testing = true

function Assert(x: boolean | number, s: string = "Assertion failed") {
  if (
    ((typeof x == 'boolean') && (x as boolean === false)) ||
    ((typeof x == 'number') && (x as number === 0))
  ) {
    Gu.debugBreak();
    throw new Error(s)
  }
}
function dbg(v: string | Error) {
  if (Gu.Debug) {
    Gu._log(v)
  }
}
function msg(v: string | Error) {
  if (Gu.Debug) {
    Gu._log(v)
  }
}
function err(v: string | Error) {
  Gu._log(v)
  Gu.debugBreak()
}
class Test {
  private static _LastEnableDebugBreak = true
  private static _LastEnableDebug = true

  private static beign_testing() {
    Test._LastEnableDebug = Gu.Debug
    Test._LastEnableDebugBreak = Gu.EnableDebugBreak
  }
  private static end_testing() {
    Gu.Debug = Test._LastEnableDebug
    Gu.EnableDebugBreak = Test._LastEnableDebugBreak
  }

  public static run_tests(tests_func: any) {
    Test.beign_testing()
    {
      if (Gu.Testing == true) {
        Gu.Debug = true
        Gu.EnableDebugBreak = false
      }
      tests_func()
    }
    Test.end_testing()
  }
  public static fail(st: Error | string | null = null) {
    Test.end_testing()
    let str = ""
    if (st == null) {
      str = "test failed"
    }
    else if (st instanceof Error) {
      str = (st as Error).message
    }
    else if (typeof st == 'string') {
      str = st
    }

    debugger;
    throw new Error(str)
  }
  public static fail_if(b: boolean = true, s: string = "test failed") {
    if (b) {
      Test.fail(s)
    }
  }
  public static success() {
    dbg("test success")
  }

}
class Gu {
  public static Debug = enable_debug
  public static Testing = enable_testing
  public static EnableDebugBreak = true

  public static escapeRegexChars(str: string) {
    return str.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&')
  }
  public static is_string(x: any) {
    return (typeof x == 'string') || (x instanceof String)
  }
  public static escape(s: string, html: boolean = false): string {
    let scp = s;
    let chrs = ['\b', '\f', '\n', '\r', '\t', '\v']
    let esc = ["\\b", "\\f", "\\n", "\\r", "\\t", "\\v"]
    for (let i = 0; i < s.length; i++) {
      let ei = 0
      for (; ei < chrs.length; ei++) {
        if (s[i] == chrs[ei]) {
          break;
        }
      }

      if (ei < chrs.length) {
        let val = ""
        if (html) {
          val = "&#" + s.charCodeAt(i).toString(16)
        }
        else {
          val = esc[ei]
        }
        s = s.substring(0, i) + val + s.substring(i + 1, s.length)
        i += val.length
      }
    }
    return s;
  }
  public static trap() { }
  public static debugBreak() {
    if (Gu.Debug && Gu.EnableDebugBreak) {
      debugger;
    }
  }
  public static _log(v: string | Error) {
    console.log(v)
  }

  public static run_tests() {
    Test.run_tests(() => {
      dbg("escaped=" + Gu.escape("0\b1\f2\n3\r4\t5\v6"))
      dbg("escaped=" + Gu.escape("0\f1\n2\r3\t4\v5"))
      dbg("escaped=" + Gu.escape("0\b1\f2\n3\r4\t5"))
      Gu.test_trees()
    })
  }
  public static test_trees() {
    let tr = new LexNode<string, number>("");
    let nk = [], nv = [];
    nk.push("world")
    nk.push("hello")
    nk.push("good123. ^+are_")
    nv.push(123)
    nv.push(456)
    nv.push(789)

    try {
      for (let i = 0; i < nk.length; i++) {
        tr.put(nk[i].split(''), nv[i]);
      }
      Test.success();
    }
    catch (ex: any) {
      Test.fail()
    }

    try {
      for (let i = 0; i < nk.length; i++) {
        tr.put(nk[i].split(''), nv[i]);
      }
      Test.fail()
    }
    catch (ex: any) {
      Test.success();
    }

    try {
      let tst = ("\"" + nk[0] + ".  -1\t\n_." + nk[1] + "...." + nk[2] + "\"")
      msg("tst=" + Gu.escape(tst))
      let hystk = (tst).split('')
      for (let i = 0; i < nk.length; i++) {
        let idx = tst.indexOf(nk[i])
        let res = tr.get(hystk, idx, nk[i].length);
        Test.fail_if(res == null)
        Test.fail_if(res!._val == null)
        Test.fail_if(res!._val != nv[i])
      }
    }
    catch (ex: any) {
      Test.fail(ex)
    }
    Test.success();
  }
}

//=============================================================================

enum Align { Left, Right, None }
enum LangType { CS_CPP_JS, PYTHON }
enum TokType {
  UNDEFINED, ID,
  WS, NL,
  DQUOT, SQUOT, DQUOT_ES, SQUOT_ES,
  COMMA, DOT, COL, SCOL,
  BCOMB, BCOME, LCOM,
  EQ_CMP, EQ_ASN, GT, LT, GTE, LTE,
  LPAREN, RPAREN, LSBR, RSBR, LCBR, RCBR,
  ARROW, QM
}
enum RuleType {
  LITERAL
}
class Tok {
  public _hash: number
  public _var: boolean
  public _value: string = "";
  public _types: Array<TokType> = new Array<TokType>();
  public value(): string { return this._value; }

  public constructor(v: string, types: Array<TokType>, variable: boolean) {
    this._value = v;
    this._var = variable
    this._types = [...types];
    this._hash = 0
    for (let i = 0; i < types.length; i++) {
      this._hash = ((this._hash << 5) - this._hash) + (types[i] | 0);
      this._hash |= 0; // Convert to 32bit integer
    }
  }
  public match(t: TokType): boolean {
    for (let i = 0; i < this._types.length; i++) {
      if (this._types[i] == t) {
        return true
      }
    }
    return false
  }
  public toString() {
    let val = "";
    let app = ""
    for (let [ti, tt] of this._types.entries()) {
      val += "" + app + TokType[tt]
      app = ","
    }
    return val
  }
}

class LexNode<Tk, Tv> {
  public _key: Tk
  public _val: Tv | null = null
  public _nodes: Array<LexNode<Tk, Tv>> | null = null
  public _depth: number

  public constructor(key: Tk, depth: number = -1) {
    this._key = key;
    this._depth = depth
  }
  public toString(sp: number = 0, str = "") {
    let st = { _str: "" }
    this._toString(st, sp, str, -1)
    let colsize = -1
    let x = (st._str as string).split('\n')
    for (let i = 0; i < x.length; i++) {
      colsize = Math.max(colsize, x[i].length)
    }
    st._str = ""
    this._toString(st, sp, str, colsize)
    return st._str
  }
  private _toString(st: any, sp: number, str: string, colsize: number) {
    let val_str = "" + this._key
    if (Gu.is_string(this._key)) {
      val_str = Gu.escape(this._key as string)
    }
    str += " ".repeat(sp) + "-> '" + val_str + "'"
    if (this._nodes != null) {
      for (let [ni, n] of this._nodes!.entries()) {
        n._toString(st, 2, str, colsize)
      }
    }
    else {
      let colsp: string = ""
      if (colsize > 0) {
        colsp = " ".repeat(colsize - str.length)
      }
      str += colsp + " [" + this._val!.toString() + "]\n"
      st._str += str
    }
    return st
  }
  public get(keys: Tk[], off: number = 0, len: number = -1, compare: ((k0: Tk, k1: Tk) => boolean) | null = null, idx: number = -1): LexNode<Tk, Tv> | null {
    if (len == -1) {
      len = keys.length
    }
    return this._get(keys, off, len, compare, -1)
  }
  private _get(keys: Tk[], off: number, len: number, compare: ((k0: Tk, k1: Tk) => boolean) | null, idx: number): LexNode<Tk, Tv> | null {
    if (idx <= len) {
      if (idx + 1 === len) {
        return this;
      }
      else if (this._nodes != null) {
        for (let [ni, n] of this._nodes.entries()) {
          let equals: boolean = false
          let k0 = n._key
          let k1 = keys[off + idx + 1]
          if (compare != null) {
            compare(k0, k1)
          }
          else {
            equals = (k0 === k1)
          }
          if (equals) {
            let res: any = n._get(keys, off, len, compare, idx + 1)
            if (res != null) {
              return res
            }
          }
        }
      }
    }
    return null
  }
  public put(keys: Tk[], val: Tv, off: number = 0, len: number = -1, insert: ((n: LexNode<Tk, Tv>, v: Tv) => void) | null = null) {
    if (len == -1) {
      len = keys.length
    }
    this._put(keys, val, off, len, insert, -1);
  }
  private _put(keys: Tk[], val: Tv, off: number, len: number, insert: ((n: LexNode<Tk, Tv>, v: Tv) => void) | null, idx: number) {
    Assert(val != null, "value is null");

    if (idx + 1 == len) {
      if (insert != null) {
        insert(this, val);
      }
      else {
        Assert(this._val == null, "_val is not null");
        this._val = val
      }
    }
    else {
      if (this._nodes == null) {
        this._nodes = new Array<LexNode<Tk, Tv>>()
      }
      for (let [ni, n] of this._nodes.entries()) {
        if (n._key == keys[idx + 1]) {
          n._put(keys, val, off, len, insert, idx + 1)
          return
        }
      }

      this._nodes.push(new LexNode<Tk, Tv>(keys[idx + 1], idx + 1))
      this._nodes[this._nodes.length - 1]._put(keys, val, off, len, insert, idx + 1)
    }
  }
  public match(items: Array<Tk>, offset: number, compare: any = null): Tv | null {
    let best: Tv | null = null
    for (let ci = offset + 1; ci <= items.length; ci++) {
      let got = this.get(items, offset, offset + ci, compare)
      if (got != null) {
        if (got._val != null) {
          best = got._val;
        }
      }
      else {
        break;
      }
    }
    return best
  }

}
class Rule {
  public _toks: Array<Tok | Rule>
  public _type: RuleType
  public constructor(rt: RuleType, tt: Array<Tok | Rule>) {
    this._toks = tt
    this._type = rt
  }
  public value(): string {
    let ss = ""
    for (let ti2 = 0; ti2 < this._toks.length; ti2++) {
      ss += this._toks[ti2].value();
    }
    return ss
  }
}
class Lang {
  public _lang: LangType
  public _tok_tree: LexNode<string, Tok>;
  public _rule_tree: LexNode<Tok, Rule>;
  public _toks: Map<TokType, Tok> = new Map<TokType, Tok>()
  public _rules: Map<RuleType, Rule> = new Map<RuleType, Rule>()

  public constructor(lt: LangType, lc: string, bcb: string, bce: string) {
    this._lang = lt
    this._tok_tree = new LexNode<string, Tok>("")
    let addtk = (ts: string, tt: TokType, variable_value: boolean = false) => {
      let tk = new Tok(ts, [tt], variable_value)
      let n = this._tok_tree.get(ts.split(''))
      if (n != null && n._val != null) {
        n._val._types.push(tt)
      }
      else {
        this._tok_tree.put(ts.split(''), tk)
      }
      this._toks.set(tt, tk)
    }
    //default
    addtk("", TokType.ID, true)
    addtk("\n", TokType.NL)
    addtk(" ", TokType.WS)
    addtk("\t", TokType.WS)

    //lang
    addtk("\"", TokType.DQUOT)
    addtk("\'", TokType.SQUOT)
    addtk("\\\"", TokType.DQUOT_ES)
    addtk("\\\'", TokType.SQUOT_ES)
    addtk(",", TokType.COMMA)
    addtk(".", TokType.DOT)
    addtk(":", TokType.COL)
    addtk(";", TokType.SCOL)
    addtk("->", TokType.ARROW)
    addtk("?", TokType.QM)
    addtk("=", TokType.EQ_ASN)
    addtk("==", TokType.EQ_CMP)
    addtk(">=", TokType.GTE)
    addtk("<=", TokType.LTE)
    addtk(">", TokType.GT)
    addtk("<", TokType.LT)
    addtk("[", TokType.LSBR)
    addtk("]", TokType.RSBR)
    addtk("{", TokType.LCBR)
    addtk("}", TokType.RCBR)
    addtk("(", TokType.LPAREN)
    addtk(")", TokType.RPAREN)
    addtk(lc, TokType.LCOM)
    addtk(bcb, TokType.BCOMB)
    addtk(bce, TokType.BCOME)

    this._rule_tree = new LexNode<Tok, Rule>(new Tok("", [TokType.UNDEFINED], false))
    let addrule = (rt: RuleType, tt: Array<TokType>) => {
      let tarr: Array<Tok> = []
      for (let i = 0; i < tt.length; i++) {
        if (tt[i] == TokType.ID) {
          var n = 0
        }
        let tok = this._toks.get(tt[i])
        if (tok != null) {
          tarr.push(tok)
        }
        else {
          throw Error("tok '" + TokType[tt[i]] + "' not found")
        }
      }
      let rule = new Rule(rt, tarr)
      this._rule_tree.put(tarr, rule)
      this._rules.set(rt, rule)
    }
    addrule(RuleType.LITERAL, [TokType.DQUOT, TokType.ID, TokType.DQUOT])
    addrule(RuleType.LITERAL, [TokType.SQUOT, TokType.ID, TokType.SQUOT])

    if (Gu.Testing) {
      msg(this._tok_tree.toString())
      msg(this._rule_tree.toString())
      //let n = this._tree.get(">=".split(''))
      //msg("this._tree.get()=" + n!._val)
      //let n = this._tree.get("\\\"".split(''))
      //msg("this._tree.get()=" + n!._val)
    }
  }
}
class Lex {
  public in_dq = false;
  public in_sq = false;
  public in_bc = false;
  public in_lc = false;
  public tokens: Array<Tok> = Array<Tok>();

  public _lang: Lang;
  public _term = ""

  public constructor(lang: Lang) {
    this._lang = lang;
  }

  public parse(text: string, func: any) {
    //parse whole block
    let chars = text.split('')

    for (let ci = 0; ci < chars.length;) {
      let ci_save = ci
      let advance = this.token(chars, ci);
      ci += advance
      func(ci_save, text);
    }
    let ttype = []
    for (let ti = 0; ti < this.tokens.length; ti++) {
      ttype.push(this.tokens[ti])
    }
    let new_tokens: Array<Tok> = []
    for (let ti = 0; ti < this.tokens.length; ti++) {
      let rule = this._lang._rule_tree.match(this.tokens, ti, (k0: Tok, k1: Tok) => {
        return k0._hash == k1._hash
      })
      if (rule != null) {
        let ss = ""
        for (let ti2 = 0; ti2 < rule._toks.length; ti2++) {
          ss += rule._toks[ti2].value();
        }
        msg("Rule: " + ss)
      }
    }
    this.tokens = new_tokens
  }
  private token(chars: Array<string>, off: number) {
    let tok = this._lang._tok_tree.match(chars, off)
    if (tok != null) {
      msg("tok="+tok!._value)
      if (this.ignore()) {
        //check to exit ignore
        if (tok.match(TokType.SQUOT) && this.in_sq) {
          this.in_sq = false;
        }
        else if (tok.match(TokType.DQUOT) && this.in_dq) {
          this.in_dq = false
        }
        else if (tok.match(TokType.BCOME) && this.in_bc) {
          this.in_bc = false
        }
        else if (tok.match(TokType.NL) && this.in_lc) {
          this.in_lc = false
        }
      }
    }

    if (tok != null && !this.ignore()) {
      if (tok.match(TokType.SQUOT)) {
        this.in_sq = true;
      }
      else if (tok.match(TokType.DQUOT)) {
        this.in_dq = true;
      }
      else if (tok.match(TokType.BCOMB)) {
        this.in_bc = true
      }
      else if (tok.match(TokType.LCOM)) {
        this.in_lc = true
      }

      if (Gu.Debug) {
        let st = "delims=[" + tok.toString() + "]"
        if (this._term.length) { st = "term='" + this._term + "' " + st }
        msg(st)
      }

      if (this._term.length) {
        this.tokens.push(new Tok(this._term, [TokType.ID], true))
        this._term = ""
      }
      this.tokens.push(tok)
      return tok._value.length
    }
    else {
      this._term += chars[off];
      if (tok != null) {
        this._term += tok._value //ignored
        return tok._value.length
      }
      else {
        return 1
      }
    }
  }
  private ignore() {
    return this.in_dq || this.in_sq || this.in_bc || this.in_lc
  }

}
class Col {
  public _size: number = 0;
  public _delim: Tok;
  public constructor(dd: Tok) {
    this._delim = dd;
  }
}
class Cell {
  public _delim: Tok
  public _col: Col | null = null
  public constructor(dd: Tok) {
    this._delim = dd
  }
}
class FormatRegion {
  public _cols: Array<Col> = [];
  public _cell_lines: Array<Array<Cell>> = []
  public _linecount: number = 0;
}
class TextGrid {
  public _line_cells: Array<Cell> = []
  public _text_unmodified: string = ""
  public _text: string = ""
  public _max_indent = 0;
  public _min_indent = 99999999;
  public _aligned: boolean = false;
  public _regions: Array<FormatRegion> = []
  public _lex: Lex;
  private _langs: Array<Lang> = [
    new Lang(LangType.CS_CPP_JS, "//", "/*", "*/"),
    new Lang(LangType.PYTHON, "#", "'''", "'''",)
  ];
  public constructor(text: string, lt: LangType) {
    this._text_unmodified = text;
    this._text = text;
    text.replace(/\t/, " ")
    text.replace(/\r/, "")
    this._text += "\n" //account for \0 without needing extra toke
    let tlang: any = null;
    for (let [idx, l] of this._langs.entries()) {
      if (l._lang == lt) {
        tlang = l;
        break;
      }
    }
    Assert(tlang != null)
    this._lex = new Lex(tlang);
  }
  private region() {
    if (this._regions.length == 0) {
      return null;
    }
    return this._regions[this._regions.length - 1];
  }
  private checkIndent(indent: number) {
    if (indent > this._max_indent) {
      this._max_indent = indent;
    }
    if (indent < this._min_indent) {
      this._min_indent = indent;
    }
  }

  private align() {
    let started = false;
    let indent = 0;

    let that = this;
    this._lex.parse(this._text, (ci: number, text: string) => {
      if (started == false) {
        if (text[ci] == ' ' || text[ci] == '\t') {
          indent++;
        }
        else {
          started = true;
          that.checkIndent(indent);
        }
      }
    });
    let s = ""

    let app = ""
    for (let [i, tk] of this._lex.tokens.entries()) {
      if (tk.match(TokType.ID)) {
        s += app + " '" + tk._value + "'"
      }
      else {
        s += app + " " + tk.toString() + ""
      }

      app = ","
      this.add(tk)
    }
    msg("tokens=" + s)
  }
  private add(tk: Tok) {
    this._line_cells.push(new Cell(tk))

    if (tk.match(TokType.NL)) { //eol
      let newregion: boolean = false
      let r = this.region()
      if (r == null) {
        newregion = true;
      }
      else if (r._cols.length > 0) {
        for (let [ci, cc] of this._line_cells.entries()) {
          let rc = r._cols[ci]
          if (ci >= r._cols.length) {
            //create new cols
            break;
          }
          if (rc._delim != cc._delim && !rc._delim.match(TokType.NL) && !cc._delim.match(TokType.NL)) {
            newregion = true
            break;
          }
        }
      }
      if (newregion) {
        this._regions.push(new FormatRegion());
        r = this.region()
      }

      if (r != null) {
        if (this._line_cells.length > r._cols.length) {
          for (let i = 0; i < this._line_cells.length; i++) {
            if (i >= r._cols.length) {
              r._cols.push(new Col(this._line_cells[i]._delim))
            }
            if (tk._value.length > r._cols[i]._size) {
              r._cols[i]._size = tk._value.length;
            }
          }
        }
        r._cell_lines.push(this._line_cells)
      }

      this._line_cells = []
    }

  }
  public toString() {
    this.align();

    let text = ""
    let indent = " ".repeat(this._max_indent);

    for (const r of this._regions) {
      for (let li = 0; li < r._cell_lines.length; li++) {
        text += indent

        for (let ci = 0; ci < r._cell_lines[li].length; ci++) {
          let col = r._cols[ci]
          let cell = r._cell_lines[li][ci];
          let gap = ""
          if (cell._delim._value.length > 0) {
            let scount = col._size - cell._delim._value.length;
            Assert(scount >= 0);
            let gap = " ".repeat(scount);
          }
          text += cell._delim._value + gap + col._delim?._value;
          // if (ci < r._cols.length - 1) {
          //   lines[i] += " "
          // }
        }
      }
    }
    text = text.substring(0, text.length - 1)//remove /n

    if (Gu.Debug) {
      msg("======RES=======")
      msg(text)
      msg("======END=======")
      return this._text_unmodified;
    }
    else {
      return text;
    }

  }

}
function grid_align() {
  try {
    if (Gu.Testing) {
      Gu.run_tests()
    }

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      msg("Running grid align")
      for (const [si, sel] of editor.selections.entries()) {
        if (sel) {
          let r = new vscode.Range(sel.start.line, sel.start.character, sel.end.line, sel.end.character);
          const text = editor.document.getText(r);
          let tg: TextGrid = new TextGrid(text, LangType.PYTHON);
          editor.edit(eb => {
            eb.replace(r, tg.toString());
          });
        }
      }
    }
  } catch (ex: any) {
    err(ex)
  }
}
export function activate(context: vscode.ExtensionContext) {
  if (Gu.Debug) {
    let once = false
    vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
      if (once == false) {
        //  grid_align()
        once = true;
      }
    });
  }


  const disposable = vscode.commands.registerCommand('extension.grid_align', grid_align);
  context.subscriptions.push(disposable);
}
export function deactivate() { }