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
import { inherits } from 'util';
import * as fs from 'fs';

enum LangType { CS_CPP_JS, PYTHON }

var g_enable_debug = true
var g_enable_testing = false
var g_lang_type = LangType.PYTHON

function Assert(x: boolean | number, s: string = "Assertion failed") {
  if (
    ((typeof x == 'boolean') && (x as boolean === false)) ||
    ((typeof x == 'number') && (x as number === 0))
  ) {
    dbg(s)
    Gu.debugBreak();
    Raise(s)

  }
}
function Raise(x: string) {
  throw new Error(x)
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
    Raise(str)
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
  public static readonly c_invalid_hash = 0

  public static Debug = g_enable_debug
  public static Testing = g_enable_testing
  public static EnableDebugBreak = true


  public static hash_ints(items: Array<number>, hash: number = 0) {
    for (let i = 0; i < items.length; i++) {
      hash = (((hash << 5) - hash) + (items[i] | 0)) | 0;
    }
    return hash
  }
  public static hash_strings(items: Array<string>, hash: number = 0) {
    for (let i = 0; i < items.length; i++) {
      hash = Gu.hash_string(items[i], hash)
    }
    return hash
  }
  public static hash_string(item: string, hash: number = 0) {
    for (let i = 0; i < item.length; i++) {
      hash = (((hash << 5) - hash) + (item.charCodeAt(i) | 0)) | 0;
    }
    return hash
  }
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
      let yacc: Lang = Lang.load("./py.y")
      let lex: Lex = new Lex(yacc)

      dbg("escaped=" + Gu.escape("0\b1\f2\n3\r4\t5\v6"))
      dbg("escaped=" + Gu.escape("0\f1\n2\r3\t4\v5"))
      dbg("escaped=" + Gu.escape("0\b1\f2\n3\r4\t5"))
      Gu.test_trees()
    })
  }
  public static test_trees() {
    let tr = new LexTree<string, number>((x: string, y: string) => { return x === y; });
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
class LexNode<Tk, Tv> {
  public _key: Tk
  public _val: Tv | null = null
  public _nodes: Array<LexNode<Tk, Tv>> | null = null
  private _parent: LexNode<Tk, Tv> | null = null

  public constructor(key: Tk, parent: LexNode<Tk, Tv> | null) {
    this._key = key;
    this._parent = parent
  }
  protected root(): LexNode<Tk, Tv> {
    let x: LexNode<Tk, Tv> = this
    while (x._parent != null) {
      x = x._parent;
    }
    return x;
  }
  protected _put(keys: Tk[], val: Tv, off: number, len: number, compare: KeyCompareFunc<Tk>, idx: number) {
    if (idx + 1 == len) {
      if (this._val != null) {
        msg(this.root().toString())
        Raise("Ambiguous symbol: '" + val + "' already defined as: '" + this._val + "'")
      }
      this._val = val
    }
    else {
      if (this._nodes == null) {
        this._nodes = new Array<LexNode<Tk, Tv>>()
      }
      for (let [ni, n] of this._nodes.entries()) {
        if (compare(n._key, keys[idx + 1])) {
          n._put(keys, val, off, len, compare, idx + 1)
          return
        }
      }

      this._nodes.push(new LexNode<Tk, Tv>(keys[idx + 1], this))
      this._nodes[this._nodes.length - 1]._put(keys, val, off, len, compare, idx + 1)
    }
  }
  protected _get(keys: Tk[], off: number, len: number, compare: KeyCompareFunc<Tk>, idx: number): LexNode<Tk, Tv> | null {
    if (idx <= len) {
      if (idx + 1 === len) {
        return this;
      }
      else if (this._nodes != null) {
        for (let [ni, n] of this._nodes.entries()) {
          let k0 = n._key
          let k1 = keys[off + idx + 1]
          if (compare(k0, k1)) {
            let res = n._get(keys, off, len, compare, idx + 1)
            if (res != null) {
              return res
            }
          }
        }
      }
    }
    return null
  }
  protected _toString(st: any, sp: number, str: string, colsize: number) {
    if (this._parent === null) {
      str = "root"
    }
    else {
      str += " ".repeat(sp) + "-> '" + LexNode.strval(this._key, true) + "'"
    }

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
      str += colsp + " [" + LexNode.strval(this._val, false) + "]\n"
      st._str += str
    }
    return st
  }
  private static strval(x: any, name: boolean) {
    let val_str = ""
    if (Gu.is_string(x)) {
      val_str = Gu.escape(x as string)
    }
    else if (x instanceof Tok) {
      if (name) {
        val_str = (x as Tok)._name
      }
      else {
        if ((x as Tok)._value.length) {
          val_str = Gu.escape((x as Tok)._value)
        }
        else {
          for (let rr = 0; rr < (x as Tok)._rules.length; rr++) {
            val_str += "" + (x as Tok)._rules[rr]
          }
        }
      }
    }
    else {
      val_str = "" + x
    }
    return val_str
  }
}
type KeyCompareFunc<Tk> = ((k0: Tk, k1: Tk) => boolean)
class LexTree<Tk, Tv> extends LexNode<Tk, Tv> {
  private _compare: KeyCompareFunc<Tk>;
  public constructor(func: KeyCompareFunc<Tk>) {
    super({} as Tk, null)
    this._compare = func
  }
  public put(keys: Tk[], val: Tv, off: number = 0, len: number = -1) {
    Assert(val != null, "value is null");
    Assert(keys.length > 0) //cannot put values on root
    if (len == -1) {
      len = keys.length
    }
    this._put(keys, val, off, len, this._compare, -1);
  }
  public get(keys: Tk[], off: number = 0, len: number = -1, compare: KeyCompareFunc<Tk> | null = null): LexNode<Tk, Tv> | null {
    if (len == -1) {
      len = keys.length
    }
    return this._get(keys, off, len, this._compare, -1)
  }
  public match(items: Array<Tk>, offset: number, k: number = -1): Tv | null {
    let best: Tv | null = null
    if (k < 0) {
      k = items.length;
    }
    for (let ci = offset + 1; ci <= k; ci++) {
      let got = this.get(items, offset, ci - offset)
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
  public toString(sp: number = 0, str = "") {
    let st = { _str: "" }
    this._toString(st, sp, str, -1)
    let colsize = -1
    let x = (st._str as string).split('\n')
    for (let i = 0; i < x.length; i++) {
      colsize = Math.max(colsize, x[i].length)
    }
    st._str = "==TREE==\n"
    this._toString(st, sp, str, colsize)
    return st._str
  }
}
class SymTree extends LexTree<string, Tok> {
  constructor() {
    super((k0: string, k1: string) => { return k0 === k1; })
  }
}
class RuleTree extends LexTree<Tok, Tok> {
  constructor() {
    super((k0: Tok, k1: Tok) => { return k0.equals(k1); })
  }
}
type Sym = number
enum Syms {
  UNDEFINED,
  ID, NL, IGNORE, SP, TAB, WS,
  //ycc
  Y_TOKN, Y_COL, Y_SEM, Y_PIPE, Y_HASH,
  Y_LCOM, Y_SECTION, Y_RULE, Y_RULES,
}
class Tok {
  public readonly _sym: Sym
  // public _sym: Sym
  public _name: string
  public _value: string
  public _rules: Array<Array<Sym>>
  //public readonly _toks: Array<Sym>
  //private _value: string | null //defined from ycc file if rule, or actual string value of token if parsed
  //value: string | null, - looked up via symbol table

  //syms: Array<Sym>, 
  public constructor(sym: Sym, name: string, value: string, rules: Array<Array<Sym>>) {
    // this._term = term;
    this._sym = sym
    this._value = value
    this._name = name
    this._rules = rules
    // this._toks = syms
    //this._value = value
    // let hash = Gu.hash_ints([sym])
    // if (syms) {
    //   this._toks = [...syms]
    //   hash = Gu.hash_ints(this._toks, hash)
    // }

    // this._hash = hash
  }
  public match(x: Sym): boolean {
    return this._sym === x
  }
  public equals(x: Tok): boolean {
    return this._sym === x._sym
  }
  public toString() {
    if(this._value.length){
      return this._value
    }
    else{
      return this._name
    }
  }

}

class Lang {
  public _rules: Map<Sym, Tok> = new Map<Sym, Tok>()
  public _sym_tree: SymTree;
  public _rule_tree: RuleTree;

  public constructor(inptu_rules: Map<Sym, Tok>) {
    this._rule_tree = new RuleTree()

    //syms map
    this._rules = new Map<Sym, Tok>
    this._rules.set(Syms.ID, new Tok(Syms.ID, "ID", "", []))
    this._rules.set(Syms.IGNORE, new Tok(Syms.IGNORE, "IGNORE", "", []))

    for (let [tt, tk] of inptu_rules.entries()) {
      msg("" + tk.toString())
      Assert(this._rules.get(tt) === undefined)
      this._rules.set(tt, tk)
    }

    //add symbols 
    this._sym_tree = new SymTree()
    for (let [rt, tk] of this._rules.entries()) {
      if (tk._value.length) {
        Assert(this._sym_tree.match(tk._value.split(''), 0) == null)
        this._sym_tree.put(tk._value.split(''), tk)
      }
    }
    if (Gu.Debug) {
      msg(this._sym_tree.toString())
    }

    //add rules 
    for (let [tt, tk] of this._rules.entries()) {
      let rule = this._rules.get(tt)
      Assert(rule !== undefined)

      for (let [ri, rts] of tk._rules.entries()) {
        let reduction: Array<Tok> = []
        for (let [riti, rt] of rts.entries()) {
          let tok = this._rules.get(rt)
          Assert(tok != null, "could not find rule '" + tk.toString() + "' (" + rt + ")")
          reduction.push(tok!)
        }
        this._rule_tree.put(reduction, rule!)

      }
    }
    if (Gu.Debug) {
      msg(this._rule_tree.toString())
    }

  }
  // public sym(s: Sym): string | undefined {
  //   let xx = this._rules.get(s);
  //   return xx
  // }
  public rule(s: Sym): Tok | undefined { return this._rules.get(s); }
  public static load(yfile: string): Lang {
    //let syms = new Map<Sym, string>()
    let rules = new Map<Sym, Tok>//Map<Sym, Array<Array<Sym>>>()
    let sym = (k: Sym, v: string) => {
      Assert(rules.get(k) === undefined)
      rules.set(k, new Tok(k, Syms[k], v, []))
    }
    let rule = (k: Sym, v: Array<Array<Sym>>) => {
      Assert(rules.get(k) === undefined)
      rules.set(k, new Tok(k, Syms[k], "", v))
    }

    sym(Syms.Y_COL, ":")
    sym(Syms.Y_SEM, ";")
    sym(Syms.Y_PIPE, "|")
    sym(Syms.Y_HASH, "#")
    sym(Syms.Y_TOKN, "%token")
    sym(Syms.Y_SECTION, "%%")
    sym(Syms.NL, "\n")
    sym(Syms.TAB, "\t")
    sym(Syms.SP, " ")

    rule(Syms.WS, [[Syms.SP, Syms.TAB]])
    rule(Syms.Y_LCOM, [[Syms.Y_HASH, Syms.IGNORE, Syms.NL]])
    rule(Syms.Y_RULE, [[Syms.ID, Syms.Y_COL, Syms.Y_RULES, Syms.Y_SEM]])
    rule(Syms.Y_RULES, [[Syms.ID, Syms.Y_RULES]])

    // this._rules.set(Syms.WS, new Tok(Syms.WS, "WS", "WS", []))
    // this._rules.set(Syms.NL, new Tok(Syms.NL, "NL", "\n", []))
    // this._rules.set(Syms.SP, new Tok(Syms.SP, "SP", " ", []))
    // this._rules.set(Syms.TAB, new Tok(Syms.TAB, "TAB", "\t", []))

    let lang = new Lang(rules)
    let text = fs.readFileSync(yfile).toString('utf-8')
    let lex = new Lex(lang)
    let toks = lex.parse(text, (x, y) => { })
    msg("==ALL TOKENS==")
    let st = ""
    for (let [ti, t] of toks.entries()) {
      st+=(t.toString())
    }
    msg(st)

    //TODO:
    let res = new Lang(rules)
    return res
  }


}
type ParseCallback = (idx: number, text: string) => void;
class Lex {
  private _ignore = false;
  private _parsed: Array<Tok> = Array<Tok>();
  private _lexed: Array<Tok> = Array<Tok>();
  private _lang: Lang;
  private _term = ""
  private _k = 1

  public constructor(lang: Lang) {
    this._lang = lang;
  }
  public parse(text: string, callback: ParseCallback, k: number = 1): Array<Tok> {
    Assert(k > 0)
    this._k = k
    this.tokenize(text, callback)
    this.lex()
    return this._lexed
  }
  private tokenize(text: string, callback: ParseCallback) {
    this._parsed = []
    let chars = text.split('')
    for (let ci = 0; ci < chars.length;) {
      let ci_save = ci
      let advance = this.token(chars, ci);
      ci += advance
      if (callback) {
        callback(ci_save, text);
      }
    }
  }
  private lex() {
    //LR(k) => reduction / shift
    this._lexed = []
    for (let ti = 0; ti < this._parsed.length; ti++) {
      let rule = this._lang._rule_tree.match(this._parsed, ti)
      if (rule != null) {
        //** this is incorrect, we need to replace the given rules with the reduction, with slice()
        //this._lexed.push(rule)
        //ti += rule._toks!.length
      }
      else {
        this._lexed.push(this._parsed[ti])
      }
    }
  }
  private token(chars: Array<string>, off: number) {
    let advance = 0

    let tok = this._lang._sym_tree.match(chars, off)
    if (tok != null) {
      //msg("tok='" + tok._value + "'")
      if (this._ignore && tok.match(Syms.IGNORE)) {
        this._ignore = false
      }
    }

    if (tok != null && !this._ignore) {
      if (tok.match(Syms.IGNORE)) {
        this._ignore = true;
      }

      // if (Gu.Debug) {
      //   let st = "delims=[" + tok.toString() + "]"
      //   if (this._term.length) {
      //     st = "term='" + this._term + "' " + st
      //   }
      //   msg(st)
      // }

      if (this._term.length) {
        this._parsed.push(new Tok(Syms.ID, "ID", this._term, []))
        this._term = ""
      }
      this._parsed.push(tok)
      advance = tok.toString().length
    }
    else {
      this._term += chars[off];
      if (tok != null) {
        this._term += tok.toString()
        advance = tok.toString().length
      }
      else {
        advance = 1
      }
    }

    Assert(advance > 0)
    return advance
  }


}
class Col {
  public _size: number = 0;
  public _delim: Tok;
  public constructor(dd: Tok) {
    this._delim = dd;
  }
}
class FormatRegion {
  public _cols: Array<Col> = [];
  public _lines: Array<Array<Tok>> = []
}
class TextGrid {
  public _lang: Lang
  public _text: string = ""
  public _max_indent = 0;
  public _min_indent = 99999999;
  public _aligned: boolean = false;

  public _line: Array<Tok> = []
  public _regions: Array<FormatRegion> = []

  public constructor(text: string, l: Lang) {
    this._text = text;
    this._lang = l
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
    let lex = new Lex(this._lang);
    let tokens = lex.parse(this._text, (ci: number, text: string) => {
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
    //combine all tokens that are not align delims into a rule
    // let comb = []
    // for (let [i, tk] of tokens.entries()) {

    //   this.addcell(tk, i == tokens.length - 1)
    // }
    // tokens = comb

    for (let [i, tk] of tokens.entries()) {
      this.addcell(tk, i == tokens.length - 1)
    }
  }
  private addcell(tk: Tok, eof: boolean) {
    this._line.push(tk)

    if (tk.match(Syms.NL) || eof) { //eol
      let newregion: boolean = false
      let r = this.region()
      if (r == null) {
        newregion = true;
      }
      else if (r._cols.length > 0) {
        for (let [lci, lcc] of this._line.entries()) {
          let rc = r._cols[lci]
          if (lci >= r._cols.length) {
            break;
          }
          if (rc._delim != lcc && !rc._delim.match(Syms.NL) && !lcc.match(Syms.NL)) {
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
        msg("tk.value=" + tk.toString())
        if (this._line.length > r._cols.length) {
          for (let tli = 0; tli < this._line.length; tli++) {
            if (tli >= r._cols.length) {
              r._cols.push(new Col(this._line[tli]))
            }
            if (tk.toString().length > r._cols[tli]._size) {
              r._cols[tli]._size = tk.toString().length;
            }
          }
        }
        r._lines.push(this._line)
      }

      this._line = []
    }

  }
  public toString() {
    this.align();

    let text = ""
    let indent = " ".repeat(this._max_indent);

    for (const r of this._regions) {
      for (let li = 0; li < r._lines.length; li++) {
        text += indent

        for (let ci = 0; ci < r._lines[li].length; ci++) {
          let col = r._cols[ci]
          let cell = r._lines[li][ci];
          let gap = ""
          if (cell.toString().length > 0) {
            let scount = col._size - cell.toString().length;
            Assert(scount >= 0);
            let gap = " ".repeat(scount);
          }
          text += cell.toString() + gap + col._delim?.toString();
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
      return this._text;
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
          if (text.length) {
            let tg: TextGrid = new TextGrid(text, Lang.load("/home/mario/git/vscode_gridalign/src/py.y"));
            editor.edit(eb => {
              eb.replace(r, tg.toString());
            });
          }
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