/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable no-mixed-spaces-and-tabs */
import * as vscode from 'vscode';
import * as path from 'path';
import { Console, assert } from 'console';
import { EOL, type } from 'os';
import { log } from 'console';
import { inherits } from 'util';
import * as fs from 'fs';
import { NOTIMP } from 'dns';

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
      Lang.load("/home/mario/git/vscode_gridalign/src/py.y")
      let yacc: Lang = Lang.load("./py.y")
      let lex: Lex = new Lex(yacc)

      dbg("escaped=" + Gu.escape("0\b1\f2\n3\r4\t5\v6"))
      dbg("escaped=" + Gu.escape("0\f1\n2\r3\t4\v5"))
      dbg("escaped=" + Gu.escape("0\b1\f2\n3\r4\t5"))
      Gu.test_trees()
    })
  }
  public static test_trees() {
    let tr = new LexTree(new Lang());
    let nk = [], nv = [];
    nk.push("world")
    nk.push("hello")
    nk.push("good123. ^+are_")
    nv.push(123)
    nv.push(456)
    nv.push(789)

    try {
      for (let i = 0; i < nk.length; i++) {
        let rs = Lang.tokens(nk[i])
        tr.put(Lang.tok_syms(nk[i]), rs[rs.length - 1]);
      }
      Test.success();
    }
    catch (ex: any) {
      Test.fail()
    }

    try {
      for (let i = 0; i < nk.length; i++) {
        let rs = Lang.tokens(nk[i])
        tr.put(Lang.tok_syms(nk[i]), rs[rs.length - 1]);
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
        //  Test.fail_if(res!._rule == null)
        // Test.fail_if(res!._rule != nv[i])
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
class LexMatch {
  public _off: number
  public _len: number
  public _node: LexNode

  public constructor(off: number, len: number, node: LexNode) {
    this._off = off
    this._len = len
    this._node = node
  }
  public keys(allkeys: Array<Rule>): Array<Rule> {
    return allkeys.slice(this._off, this._off + this._len)
  }
}
class LexNode {
  public _sym: Sym
  public _rule: Rule | null
  public _nodes: Map<Sym, LexNode> | null = null
  public _parent: LexNode | null = null

  public constructor(sym: Sym, rule: Rule | null, parent: LexNode | null) {
    this._parent = parent
    this._rule = rule
    this._sym = sym
  }
  public root(): LexNode {
    let x: LexNode = this
    while (x._parent != null) {
      x = x._parent;
    }
    return x;
  }
  public put(keys: Sym[], val: Rule, off: number = 0, len: number = -1) {
    Assert(keys.length > 0) //cannot put values on root
    if (len == -1) {
      len = keys.length
    }
    this._put(keys, val, off, len, -1);
  }
  protected _put(keys: Sym[], val: Rule, off: number, len: number, idx: number) {
    if (idx + 1 == len) {
      if (this._rule != null) {
        msg(this.root().toString())
        Raise("Ambiguous symbol: '" + val + "' already defined as: '" + this._rule + "'")
      }
      this._rule = val
    }
    else {
      if (this._nodes == null) {
        this._nodes = new Map<Sym, LexNode>()
      }
      let n = this._nodes.get(keys[idx + 1])
      if (!n) {
        n = new LexNode(keys[idx + 1], null, this)
      }
      n._put(keys, val, off, len, idx + 1)
      this._nodes.set(n._sym, n)
    }
  }

  public exact(keys: Array<Rule | Sym | Tok>, off: number = 0,): LexMatch | null {
    return this.get(keys, off, keys.length - off, keys.length, false)
  }
  public full(keys: Array<Rule | Sym | Tok>, off: number = 0): LexMatch | null {
    return this.get(keys, off, keys.length - off, -1, false)
  }
  public part(keys: Array<Rule | Sym | Tok>, off: number = 0): LexMatch | null {
    return this.get(keys, off, keys.length - off, -1, true,)
  }
  public get(keys: Array<Rule | Sym | Tok>, off: number = 0, len: number = -1, count: number = -1, part: boolean): LexMatch | null {
    if (len === -1) {
      len = keys.length - off
    }
    return this._get(keys, off, len, count, part, -1)
  }
  protected _get(keys: Array<Rule | Sym | Tok>, off: number, maxlen: number, exact: number, part: boolean, idx: number): LexMatch | null {
    if (idx + 1 < maxlen) {
      if (idx + 1 !== exact) {
        if (this._nodes !== null) {
          let sym :Sym =0 as Sym
          let k = keys[off + idx + 1]
          if(k instanceof Rule){
            sym = k._sym
          }
          else if(k instanceof Tok){
            sym = k._rule._sym
          }
          else{
            sym = k as Sym
          }

          let n = this._nodes.get(sym)
          if(n){
            let res = n._get(keys, off, maxlen, exact, part, idx + 1)
            if (res) {
              return res;
            }
          }

        }
      }
    }

    if (((this._rule !== null) && (idx + 1 === exact || exact === -1)) || (part)) {
      return new LexMatch(off, idx + 1, this)
    }

    return null
  }
  protected _toString(st: any, sp: number, str: string, colsize: number, lang: Lang) {
    if (this._parent === null) {
      str = ""
    }
    else {
      str = str + " " + this.strval(lang)
      if (this._rule) {
        st._str += "\n" + Gu.escape(this._rule._name) + " -> " + str
      }
    }
    if (this._nodes != null) {
      for (let [ni, n] of this._nodes!.entries()) {
        n._toString(st, 2, str, colsize, lang)
      }
    }

    return st
  }
  private strval(lang: Lang) {
    let st = ""
    let xx = lang.syms().get(this._sym)
    if (xx) {
      st = Gu.escape(xx)
    }
    else {
      st += "(" + this._sym + ")"
    }
    return st
  }
  public lang(): Lang | null { return null }

}
class LexTree extends LexNode {
  private _lang: Lang
  public constructor(lang: Lang) {
    super((0 as Sym), null, null)
    this._lang = lang
  }
  public override lang(): Lang { return this._lang }
  public toString(sp: number = 0, str = ""): string {
    if (this._parent !== null) {
      return this.root().toString()
    }
    else {
      let st = { _str: "" }
      this._toString(st, sp, str, -1, this._lang)
      let colsize = -1
      let x = (st._str as string).split('\n')
      for (let i = 0; i < x.length; i++) {
        colsize = Math.max(colsize, x[i].length)
      }
      st._str = "==TREE=="
      this._toString(st, sp, str, colsize, this._lang)
      return st._str
    }
  }
}

type Sym = number & { readonly '': unique symbol };
type Key = number & { readonly '': unique symbol };
class Rule {
  public readonly _sym: Sym
  public readonly _key: Key
  public readonly _name: string
  public readonly _rule: Array<Sym>

  public constructor(name: string, rule: Array<Sym>) {
    Assert(rule.length)
    this._name = name
    this._rule = rule
    this._sym = Lang.sym(name)
    this._key = Lang.key(name, rule)
  }
  public match(x: Key): boolean {
    return this._key === x
  }
  public equals(x: Rule | Key | Tok): boolean {
    if (x instanceof Rule) {
      return this._equals(x._key)
    }
    else if (x instanceof Tok) {
      return this._equals(x._rule._key)
    }
    else {
      return this._equals(x)
    }
  }
  public _equals(x: Key): boolean {
    return (this._key === x)
  }
  public toString(lang: Lang, key: boolean = false): string {
    let skey = ""
    if (key) {
      skey = "(" + this._key + ")"
    }

    let st = "" + Gu.escape(this._name) + " " + skey + " -> "
    let app = ""
    for (let [ri, rv] of this._rule.entries()) {
      let app2 = ""
      let rrr = lang.syms().get(rv)
      if (rrr) {
        st += app2 + "" + Gu.escape(rrr) + ""
      }
      else {
        st += "(" + rv + ")"
      }
      app2 = " "
    }
    return st
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
  // key = hash of sym and prod
  // sym = hash of rule name
  private _rules: Map<Key, Rule> = new Map<Key, Rule>()
  private _syms: Map<Sym, string> = new Map<Sym, string>()
  private _tree: LexTree = new LexTree(this);
  private _generated: boolean = false

  public constructor() {
  }
  public tree() {
    Assert(this._generated)
    return this._tree
  }
  public rules() { return this._rules }
  public syms() { return this._syms }
  private check_set(rule: Rule) {
    let xx = this._rules.get(rule._key)
    if (xx) {
      for (let [i, s] of xx._rule.entries()) {
        Assert(xx._rule[i] === rule._rule[i], "Hash collision: " + rule.toString(this, true) + " already exists as " + xx!.toString(this, true) + "")
      }
    }
    this._rules.set(rule._key, rule)
  }
  public rule(s: string | RegExp, vals: Array<Array<string | RegExp>> | null = null): Array<Rule> {
    let rules = []
    if (vals === null) {
      rules.push(this._parse_rule(s, []))
    }
    else {
      for (let [rii, rvv] of vals.entries()) {
        rules.push(this._parse_rule(s, rvv))
      }
    }
    return rules
  }
  public _parse_rule(s: string | RegExp, vals: Array<string | RegExp> | null = null): Rule {
    Assert(this._generated === false)

    if (vals !== null && vals.length > 0) {
      for (let [si, ss] of vals.entries()) {
        if (ss instanceof RegExp) {
          //ok how to add regex to the tree uh .. 
          //cant put it in symbol table its not a symbol it's an operation
          //      this._symbol(ss.)
          //        rule = new Rule(s, syms)
        }
        else {
          this._symbol(ss)
        }
      }
    }

    let rule: Rule
    if (typeof s === 'string') {
      Assert(s.length)
      rule = this._symbol(s)
      if (vals !== null && vals.length > 0) {
        rule = new Rule(s, Lang.syms(vals))
        this.check_set(rule)
      }
    }
    else if (s instanceof RegExp) {
      NoImp()
      rule = new Rule(s.source, [])
    }
    else {
      NoImp()
      rule = new Rule("", [])
    }
    return rule
  }
  public _symbol(s: string): Rule {
    Assert(s.length > 0)
    let syms = Lang.tok_syms(s)
    let rule = this._rules.get(Lang.key(s, syms))
    if (!rule) {
      let rules = Lang.tokens(s)
      for (let [i, r] of rules.entries()) {
        if (!this._rules.get(r._key)) {
          this.check_set(r)
          this._syms.set(syms[i], s[i])
        }
      }
      this._syms.set(Lang.sym(s), s)
      rule = new Rule(s, syms)
    }

    return rule
  }
  private generate() {
    if (!this._generated) {
      this._tree = new LexTree(this)
      for (let [rt, rr] of this._rules.entries()) {
        this._tree.put(rr._rule, rr)
      }
      if (Gu.Debug) {
        let st = "===SYMS===\n"
        for (let [k, v] of this._syms.entries()) {
          st += "" + k + " -> " + Gu.escape(v) + "\n"
        }
        msg(st)
      }
      if (Gu.Debug) {
        msg(this._tree.toString())
      }
      this._generated = true
    }
  }
  public static tokens(s: string): Array<Rule> {
    let r = new Array<Rule>()
    for (let [i, c] of s.split('').entries()) {
      r.push(new Rule(c, [Lang.sym(c)])) //token maps to self
    }
    return r
  }
  public static keys(rs: Array<Rule> | null): Array<Key> {
    let r = []
    if (rs) {
      for (let [i, c] of rs.entries()) {
        r.push(c._key)
      }
    }
    return r
  }
  public static syms(rs: Array<string | RegExp> | null): Array<Sym> {
    let r: Array<Sym> = []
    if (rs) {
      for (let [i, c] of rs.entries()) {
        if (c instanceof RegExp) {
          NoImp()
        }
        else {
          r = r.concat(Lang.sym(c))
        }
      }
    }
    return r
  }
  public static tok_syms(rs: string): Array<Sym> {
    let r: Array<Sym> = []
    Assert(rs.length)
    for (let [i, c] of rs.split('').entries()) {
      r.push(Lang.sym(c))
    }
    return r
  }
  public static sym(rs: string): Sym {
    Assert(rs.length > 0)
    if (rs.length === 1) {
      return rs.charCodeAt(0) as Sym
    }
    else {
      return Gu.hash_string(rs) as Sym
    }
  }
  public static key(s: string, ss: Array<Sym>): Key {
    let y: number[] = []
    for (let i = 0; i < ss.length; i++) {
      y.push(ss[i] as number)
    }
    y.push(Gu.hash_string(s))
    let h = Gu.hash_ints(y, 101)
    return h as Key
  }
  private print_rules() {
    let st = ""
    for (let [ri, rr] of this._rules.entries()) {
      st += rr.toString(this) + "\n"
    }
    msg(st)
  }
  public static load(yfile: string): Lang {
    let L = new Lang()

    // L.rule("[_a-zA-Z0-9]+")
    // two rules: 
    // S -> S
    // S -> S | S
    //we are going to ignore WS here.
    //probably should tokenize the whole thing then 
    //  L.rule("WS", [["WS"], ["SP", "TAB"]])
    // L.rule("S", [["S"], ["S", "S"]])
    // L.rule("WS", [["\t", " " ]])


    //   L.rule("ID", [[/^[A-Z]+$/]])
    L.rule("STR", [["ID", "ID"], ["ID"]])
    L.rule("LITERAL", [["\"", "STR", "\""], ["\'", "STR", "\'"]])
    L.rule("LCOM", [["#", "STR", "NL"]])
    L.rule("RULE", [["IDENT", ":", "RULES", ";"]])
    L.rule("RULES", [["RULE"], ["|", "RULE"]])
    L.rule("TOKEN", [["%token", "LITERAL"]])
    L.rule("SECTION", [["%%", "\n"]])

    L.generate()

    let text = fs.readFileSync(yfile).toString('utf-8')
    let lex = new Lex(L)
    let toks: Array<Tok> = lex.parse(text)

    //TODO:
    let res = new Lang()
    return res
  }
}

type ParseCallback = (idx: number, text: string) => void;
class Lex {
  private _ignore = false;
  private _terms: Array<Tok> = new Array<Tok>();
  private _result: Array<Tok> = new Array<Tok>();
  private _lang: Lang;
  private _k = 1

  public constructor(lang: Lang) {
    this._lang = lang;
  }
  public parse(text: string, k: number = -1): Array<Tok> {
    Assert(k == -1 || k > 0)
    this._k = k
    let syms: Array<Sym | Rule> = []
    let tok = ""
    for (let ci = 0; ci < text.length; ci++) {
      //this._lang.tree().
    }
    // this.tokenize(text, callback)
    // this.lex()
    this.debugprint()
    return this._result
  }
  // private tokenize(text: string, callback: ParseCallback) {
  //   this._terms = Array<Tok>();
  //   //let chars = text.split('')
  //   //let id = { _str: "" }
  //   this.lex(chars, ci, id);

  //   for (let ci = 0; ci < chars.length;) {
  //     let ci_save = ci
  //     ci += advance
  //     if (callback) {
  //       callback(ci_save, text);
  //     }
  //   }
  //   // this._terms.push(new Tok("", this._lang._eof, null, []))
  // }
  // private lex() {
  //   // this._lexed = new Array<Tok>()
  //   // let ti = 0;
  //   // let idr = this._lang._rules.get(Syms.ID)
  //   // Assert(idr !== undefined)
  //   // let id: Tok = new Tok("", idr!, null, [])

  //   // for (; ti < this._terms.length;) {
  //   //   this._lexed.push(this._terms[ti])
  //   //   if (id._children.length) {
  //   //     this._lexed.push(id)
  //   //   }
  //   //   let match = this._lang._tree.part(this._lexed, ti)

  //   //   //LR0 - only one state given the lookahead terminal, or its invalid
  //   //   //LR1 - any state given the 1 lookahead terminal

  //   //   if (match === null) {
  //   //     //none
  //   //     this._lexed.pop()
  //   //     Assert(id !== null)
  //   //     id._children.push(this._terms[ti])
  //   //     ti += 1
  //   //   }
  //   //   else {
  //   //     Assert(match._node !== null)

  //   //     let toks = this._lexed.splice(match._off, match._off + match._len)
  //   //     this._lexed.push(new Tok("", match._node._rule!, null, toks))
  //   //     ti += match._len

  //   //     if (match._node._rule !== null) {
  //   //       //full match
  //   //     }
  //   //     else {
  //   //       //part = keep matched token(s) and consider next tokens text
  //   //     }
  //   //   }
  //   // }
  // }
  // private lex() {
  //   let advance = 0
  //   let match = this._lang.tree().full(chars, off)

  //   let rule: Rule | null = null
  //   if (match !== null) {
  //     rule = match._node._rule
  //   }

  //   if (rule != null) {
  //     if (id._str.length) {
  //       let id_rule = this._lang._id
  //       Assert(id_rule !== undefined)
  //       this._terms.push(new Tok(id._str, id_rule!, null, []))
  //       id._str = ""
  //     }
  //     let token = new Tok(match!.keys(chars).join(''), rule, null, []);
  //     this._terms.push(token)

  //     advance = match!._len
  //   }
  //   else {
  //     id._str += chars[off];
  //     if (match != null) {
  //       id._str += match.keys(chars).join('')
  //       advance = match._len
  //     }
  //     else {
  //       advance = 1
  //     }
  //   }

  //   Assert(advance > 0)
  //   return advance
  // }
  private debugprint() {
    if (Gu.Debug) {
      dbg("==RESULT==")
      let st = ""
      for (let [ti, t] of this._terms.entries()) {
        st += (t.text(" "))
      }
      dbg(st)
      // dbg("==ALL_SYMS==")
      // st = ""
      // for (let [ti, t] of this._lexed.entries()) {
      //   st += (t._rule._name)
      // }
      // dbg(st)
    }
  }
}

//#region Text Grid

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
  private align() {
    let lex = new Lex(this._lang);
    let tokens = lex.parse(this._text);
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
    let NL = Lang.sym("\n")

    if (tk._rule._sym === NL || eof) { //eol
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
          if (rc._tok != lcc && rc._tok._rule._sym !== NL && lcc._rule._sym !== NL) {
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

//#endregion
//#region Main

function grid_align() {
  try {
    //  show_debug_terminal()

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
// function show_debug_terminal() {
//   let con = "DEBUG CONSOLE"
//   if (vscode.window.activeTextEditor === undefined || vscode.window.activeTextEditor.name != con) {
//     for (let [i, t] of vscode.window..entries()) {
//       if (t. === con) {
//         t.show()
//         break
//       }
//     }
//   }
// }
export function activate(context: vscode.ExtensionContext) {
  if (Gu.Debug) {
    let once = false

    //vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
    if (once == false) {
      grid_align()
      //show_debug_terminal()
      if (Gu.Testing) {
        Gu.run_tests()
      }

      once = true;
    }
    // });
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

//#endregion