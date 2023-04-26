/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable no-mixed-spaces-and-tabs */
import * as vscode from 'vscode';
import * as path from 'path';
import { Console, assert } from 'console';
import { EOL } from 'os';
import { log } from 'console';
import { inherits } from 'util';
import * as fs from 'fs';

enum LangType { CS_CPP_JS, PYTHON }

var g_enable_debug = true
var g_enable_testing = false
var g_lang_type = LangType.PYTHON

function NoImp() {
  Raise("Not implemented")
}
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
  if (Gu.Debug) {
    dbg(x)
    Gu.debugBreak()
  }
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
    let tr = new LexTree<string, number>(null);
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
        // let res = tr.get(hystk, idx, nk[i].length);
        //Test.fail_if(res == null)
        //  Test.fail_if(res!._val == null)
        // Test.fail_if(res!._val != nv[i])
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
type KeyCompareFunc<Tk> = ((k0: Tk, k1: Tk) => boolean)
type KeyGetFunc<Titem, Tk> = ((item: Titem) => Tk)
enum LexMatchType {
  Full, //matched whole rule
  Partial, //matched part of rule but hit length limit
  None
}
class LexMatch<Tk, Tv> {
  public _off: number
  public _len: number
  public _node: LexNode<Tk, Tv>

  public constructor(off: number, len: number, node: LexNode<Tk, Tv>) {
    this._off = off
    this._len = len
    this._node = node
  }
  public value(): Tv | null {
    return this._node._val
  }
  public keys(allkeys: Array<Tk>): Array<Tk> {
    return allkeys.slice(this._off, this._off + this._len)
  }
}
class LexNode<Tk, Tv> {
  public _key: Tk
  public _val: Tv | null = null
  public _nodes: Array<LexNode<Tk, Tv>> | null = null
  public _parent: LexNode<Tk, Tv> | null = null

  public constructor(key: Tk, parent: LexNode<Tk, Tv> | null) {
    this._key = key;
    this._parent = parent
  }

  public root(): LexNode<Tk, Tv> {
    let x: LexNode<Tk, Tv> = this
    while (x._parent != null) {
      x = x._parent;
    }
    return x;
  }
  public put(keys: Tk[], val: Tv, off: number = 0, len: number = -1) {
    Assert(val != null, "value is null");
    Assert(keys.length > 0) //cannot put values on root
    if (len == -1) {
      len = keys.length
    }
    this._put(keys, val, off, len, -1);
  }
  protected _put(keys: Tk[], val: Tv, off: number, len: number, idx: number) {
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
        if (n._key === keys[idx + 1]) {
          n._put(keys, val, off, len, idx + 1)
          return
        }
      }

      this._nodes.push(new LexNode<Tk, Tv>(keys[idx + 1], this))
      this._nodes[this._nodes.length - 1]._put(keys, val, off, len, idx + 1)
    }
  }

  public exact<Titem = Tk>(keys: Array<Titem>, off: number = 0, getter: KeyGetFunc<Titem, Tk>): LexMatch<Tk, Tv> | null {
    return this.get(keys, off, keys.length - off, keys.length, false, getter)
  }
  public full<Titem = Tk>(keys: Array<Titem>, off: number = 0, getter: KeyGetFunc<Titem, Tk>): LexMatch<Tk, Tv> | null {
    return this.get(keys, off, keys.length - off, -1, false, getter)
  }
  public part<Titem = Tk>(keys: Array<Titem>, off: number = 0, getter: KeyGetFunc<Titem, Tk>): LexMatch<Tk, Tv> | null {
    //return part of the ruleset matching at least 1+ of the the given input array
    //i.e. input token stream matches 1 or more parts of rules, but not a whole rule.
    // if _node._value == null then it is partial
    return this.get(keys, off, keys.length - off, -1, true, getter)
  }
  public get<Titem = Tk>(keys: Array<Titem>, off: number = 0, len: number = -1, count: number = -1, part: boolean, getter: KeyGetFunc<Titem, Tk>): LexMatch<Tk, Tv> | null {
    if (len === -1) {
      len = keys.length - off
    }
    return this._get(keys, off, len, count, part, getter, -1)
  }
  protected _get<Titem>(keys: Array<Titem>, off: number, maxlen: number, exact: number, part: boolean, getter: KeyGetFunc<Titem, Tk>, idx: number): LexMatch<Tk, Tv> | null {
    if (idx + 1 < maxlen) {
      if (idx + 1 !== exact) {
        if (this._nodes !== null) {
          for (let [ni, n] of this._nodes.entries()) {
            let k0 = n._key
            let k1 = getter(keys[off + idx + 1])
            if (k0 === k1) {
              let res = n._get(keys, off, maxlen, exact, part, getter, idx + 1)
              if (res) {
                return res;
              }
            }
          }
        }
      }
    }

    if (((this._val !== null) && (idx + 1 === exact || exact === -1)) || (part)) {
      return new LexMatch<Tk, Tv>(off, idx + 1, this)
    }

    return null
  }
  public toString(sp: number = 0, str = ""): string {
    if (this._parent !== null) {
      return this.root().toString()
    }
    else {
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
  protected _toString(st: any, sp: number, str: string, colsize: number) {
    if (this._parent === null) {
      str = "root"
    }
    else {
      str += " ".repeat(sp) + "-> '" + this.strval(this._key, true) + "'"
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
      str += colsp + " [" + this.strval(this._val, false) + "]\n"
      st._str += str
    }
    return st
  }
  private strval(x: any, name: boolean) {
    let val_str = ""
    if (Gu.is_string(x)) {
      val_str = Gu.escape(x as string)
    }
    else if (x instanceof Rule) {
      if (name) {
        val_str = (x as Rule)._name
      }
      else if ((x as Rule)._text.length) {
        val_str = Gu.escape((x as Rule)._text)
      }
      else {
        for (let rr = 0; rr < (x as Rule)._rules.length; rr++) {
          val_str += "" + (x as Rule)._rules[rr]
        }
      }
    }
    else if (typeof x === 'number') {
      let lang = this.root().lang()
      if (lang !== null) {
        let r = lang._rules.get(x)
        if (r !== undefined) {
          val_str = "" + r._name //+ " ("+x+")"
        }
      }
    }
    else {
      val_str = "" + x
    }
    return val_str
  }
  public lang(): Lang | null { return null }

}
class LexTree<Tk, Tv> extends LexNode<Tk, Tv> {
  private _lang: Lang | null
  public constructor(lang: Lang | null) {
    super({} as Tk, null)
    this._lang = lang
  }
  public override lang(): Lang | null { return this._lang }
}
type Sym = number
enum Syms {
  UNDEFINED,
  //special
  ID, // final rule S -> eof
  //sym
  NL, SP, TAB, DQUOT, SQUOT, //EOF,
  //rul
  Y_WS, Y_LITERAL,
  Y_TOKN, Y_COL, Y_SEM, Y_PIPE, Y_HASH,
  Y_LCOM, Y_SECTION, Y_RULE, Y_RULES,
}
class Rule {
  public readonly _sym: Sym
  public readonly _name: string
  public readonly _text: string
  public _rules: Array<Array<Sym>>
  public _def: boolean

  public constructor(sym: Sym, name: string, text: string, rules: Array<Array<Sym>>, def: boolean) {
    this._sym = sym
    this._name = name
    this._text = text
    this._rules = rules
    this._def = def
  }
  public match(x: Sym): boolean {
    return this._sym === x
  }
  public equals(x: Rule): boolean {
    return this._sym === x._sym
  }
  public clone(): Rule {
    let r = (JSON.parse(JSON.stringify(this)) as Rule)
    r._def = false
    return r
  }
  public toString(): string {
    if (this._text.length) {
      return this._text
    }
    else {
      return this._name
    }
  }
}
class Tok {
  //instance of rule / grammar tree node
  private _text: string
  public _rule: Rule
  public _parent: Tok | null = null
  public _children: Array<Tok>
  public constructor(text: string, rul: Rule, parent: Tok | null, children: Array<Tok>) {
    this._text = text;
    this._rule = rul
    this._parent = parent
    this._children = children
  }
  public text(app: string = ""): string {
    let s = ""
    if (this._text.length || this._children.length === 0) {
      s = this._text
    }
    else {
      for (let [ti, tt] of this._children.entries()) {
        s += tt.text()
      }
    }
    return s
  }
}
class Lang {
  public _id : Rule
  //public _eof : Rule
  public _rules: Map<Sym, Rule> = new Map<Sym, Rule>()
  public _term_tree: LexTree<string, Rule>;
  public _rule_tree: LexTree<Sym, Rule>;

  public constructor(inptu_rules: Map<Sym, Rule>) {
    this._rule_tree = new LexTree<Sym, Rule>(this)
    this._rules = new Map<Sym, Rule>
    this._id = new Rule(Syms.ID, Syms[Syms.ID], "", [], true)
   // this._eof = new Rule(Syms.EOF, Syms[Syms.EOF], "", [], true)

    for (let [rt, rr] of inptu_rules.entries()) {
      msg("" + rr.toString())
      Assert(this._rules.get(rt) === undefined)
      this._rules.set(rt, rr)
    }

    //add symbols /rules
    this._term_tree = new LexTree<string, Rule>(this)
    for (let [rt, rr] of this._rules.entries()) {
      if (rr._text.length) {
        let m = this._term_tree.exact(rr._text.split(''), 0, (k) => { return k })
        if (m !== null) {
          Raise("Sym '" + rr._text + "' already exists existing='" + m._node._val!._name + "' cur='" + rr._name + "'")
        }
        this._term_tree.put(rr._text.split(''), rr)
      }
      for (let [ri, rts] of rr._rules.entries()) {
        this._rule_tree.put(rts, rr)
      }
    }
    if (Gu.Debug) {
      msg(this._term_tree.toString())
    }

    for (let [rk, rv] of this._rules.entries()) {
      Assert(rv._def == true)
    }
    if (Gu.Debug) {
      msg(this._rule_tree.toString())
    }

  }
  public static load(yfile: string): Lang {
    let rules = new Map<Sym, Rule>//Map<Sym, Array<Array<Sym>>>()
    let sym = (k: Sym, v: string) => {
      Assert(rules.get(k) === undefined)
      rules.set(k, new Rule(k, Syms[k], v, [],true))
    }
    let rule = (k: Sym, v: Array<Array<Sym>>) => {
      Assert(rules.get(k) === undefined)
      rules.set(k, new Rule(k, Syms[k], "", v,true))
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
    sym(Syms.DQUOT, "\"")
    sym(Syms.SQUOT, "\'")

    rule(Syms.Y_LITERAL, [[Syms.DQUOT, Syms.ID, Syms.DQUOT], [Syms.SQUOT, Syms.ID, Syms.SQUOT]])
    rule(Syms.Y_LCOM, [[Syms.Y_HASH, Syms.ID, Syms.NL]])
    rule(Syms.Y_WS, [[Syms.SP, Syms.TAB]])
    rule(Syms.Y_RULE, [[Syms.ID, Syms.Y_COL, Syms.Y_RULES, Syms.Y_SEM]])
    rule(Syms.Y_RULES, [[Syms.ID, Syms.Y_RULES]])

    let lang = new Lang(rules)
    let text = fs.readFileSync(yfile).toString('utf-8')
    let lex = new Lex(lang)
    let toks: Array<Tok> = lex.parse(text, (x, y) => { })

    //TODO:
    let res = new Lang(rules)
    return res
  }
}

type ParseCallback = (idx: number, text: string) => void;
class Lex {
  private _ignore = false;
  private _terms: Array<Tok> = new Array<Tok>();
  private _lexed: Array<Tok> = new Array<Tok>();
  private _lang: Lang;
  private _k = 1

  public constructor(lang: Lang) {
    this._lang = lang;
  }
  public parse(text: string, callback: ParseCallback, k: number = -1): Array<Tok> {
    Assert(k == -1 || k > 0)
    this._k = k

    this.tokenize(text, callback)
    this.lex()
    this.debugprint()
    return this._lexed
  }
  private tokenize(text: string, callback: ParseCallback) {
    this._terms = Array<Tok>();
    let chars = text.split('')
    let id = { _str: "" }
    for (let ci = 0; ci < chars.length;) {
      let ci_save = ci
      let advance = this.token(chars, ci, id);
      ci += advance
      if (callback) {
        callback(ci_save, text);
      }
    }
   // this._terms.push(new Tok("", this._lang._eof, null, []))
  }
  private lex() {
    this._lexed = new Array<Tok>()
    let ti = 0;
  //  let idr = this._lang._rules.get(Syms.ID)
   // Assert(idr !== undefined)
   // let id: Tok= new Tok("", idr!, null, [])

    // for (; ti < this._terms.length;) {
    //   this._lexed.push(this._terms[ti])
    //   if(id._children.length){
    //     this._lexed.push(id)
    //   }
    //   let match = this._lang._rule_tree.part(this._lexed, ti, (tk: Tok) => { Assert(tk !== null && tk !== undefined); return tk._rule._sym; })
      
    //   //LR0 - only one state given the lookahead terminal, or its invalid
    //   //LR1 - any state given the 1 lookahead terminal

    //   if (match === null) {
    //     //none
    //     this._lexed.pop()
    //     Assert(id !== null)
    //     id._children.push(this._terms[ti])
    //     ti += 1
    //   }
    //   else {
    //     Assert(match._node !== null)

    //     let toks = this._lexed.splice(match._off, match._off + match._len)
    //     this._lexed.push(new Tok("", match._node._val!, null, toks))
    //     ti += match._len

    //     if (match._node._val !== null) {
    //       //full match
    //     }
    //     else {
    //       //part = keep matched token(s) and consider next tokens text

    //     }
    //   }

    // }
  }
  private token(chars: Array<string>, off: number, id: { _str: string }) {
    let advance = 0

    let match = this._lang._term_tree.full(chars, off, (k) => { return k })

    let rule: Rule | null = null
    if (match !== null) {
      rule = match._node._val
    }

    if (rule != null) {
      if (id._str.length) {
        let id_rule = this._lang._id
        Assert(id_rule !== undefined)
        this._terms.push(new Tok(id._str, id_rule!, null, []))
        id._str = ""
      }
      let token = new Tok(match!.keys(chars).join(''), rule, null, []);
      this._terms.push(token)

      advance = match!._len
    }
    else {
      id._str += chars[off];
      if (match != null) {
        id._str += match.keys(chars).join('')
        advance = match._len
      }
      else {
        advance = 1
      }
    }

    Assert(advance > 0)
    return advance
  }
  private debugprint() {
    if (Gu.Debug) {
      dbg("==ALL_TERMS==")
      let st = ""
      for (let [ti, t] of this._terms.entries()) {
        st += (t.text(" "))
      }
      dbg(st)
      dbg("==ALL_SYMS==")
      st = ""
      for (let [ti, t] of this._lexed.entries()) {
        st += (t._rule._name)
      }
      dbg(st)
    }
  }
}


class Col {
  public _size: number = 0;
  public _tok: Tok;
  public constructor(dd: Tok) {
    this._tok = dd;
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

    if (tk._rule.match(Syms.NL) || eof) { //eol
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
          if (rc._tok != lcc && !rc._tok._rule.match(Syms.NL) && !lcc._rule.match(Syms.NL)) {
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
        msg("tk.value=" + tk.text())
        if (this._line.length > r._cols.length) {
          for (let tli = 0; tli < this._line.length; tli++) {
            if (tli >= r._cols.length) {
              r._cols.push(new Col(this._line[tli]))
            }
            if (tk.text().length > r._cols[tli]._size) {
              r._cols[tli]._size = tk.text().length;
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
          text += cell.toString() + gap + col._tok?.toString();
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


    //if we key by rules 
    // for (let [tt, tk] of this._rules.entries()) {
    //   let rule = this._rules.get(tt)
    //   Assert(rule !== undefined)

    //   for (let [ri, rts] of tk._rules.entries()) {
    //     let reduction: Array<Rule> = []
    //     for (let [riti, rt] of rts.entries()) {
    //       let tok = this._rules.get(rt)
    //       Assert(tok != null, "could not find rule '" + tk.toString() + "' (" + rt + ")")
    //       reduction.push(tok!)
    //     }
    //     this._rule_tree.put(reduction, rule!)

    //   }
    // }



    // if (rule != null && rule._ignore && this._ignore && rule.match(Syms.IGNORE)) {
    //   this._ignore = false
    // }
    // if (rule.match(Syms.IGNORE)) {
    //   this._ignore = true;
    // }
