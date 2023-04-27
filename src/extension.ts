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
      RangeMap.test()

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
    let lang = new Lang()
    let tr = new LexTree(lang);
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
        tr.put(lang.infos(Lang.tok_syms(nk[i])), rs[rs.length - 1]);
      }
      Test.success();
    }
    catch (ex: any) {
      Test.fail()
    }

    try {
      for (let i = 0; i < nk.length; i++) {
        let rs = Lang.tokens(nk[i])
        tr.put(lang.infos(Lang.tok_syms(nk[i])), rs[rs.length - 1]);
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

type Int = number // & { readonly '': unique symbol };
type RuleKey = number & { readonly '': unique symbol };
type Char = string

class Range extends Object {
  public _min: Int
  public _max: Int
  public validate() {
    Assert(this._min <= this._max)
  }
  public equals(r: Range | Int) {
    if (r instanceof Range) {
      return (this._min === r._min && this._max === r._max)
    }
    else {
      return (this._min === r && this._max === r)
    }
  }
  public static order(min: Int, max: Int): Range {
    if (min <= max)
      return new Range(min, max)
    else
      return new Range(max, min)
  }
  public static chr(min: Char, max: Char | null = null): Range {
    Assert(min.length === 1)
    if (max != null) {
      Assert(max.length === 1)
      return new Range(min.charCodeAt(0), max.charCodeAt(0))
    }
    else {
      return new Range(min.charCodeAt(0))
    }
  }
  public constructor(min: Int, max: Int | null = null) {
    super()
    this._min = min
    if (max === null) {
      this._max = this._min
    }
    else {
      this._max = max
    }
    this.validate()
  }
  public static from(k: Range | Int): Range {
    let r: Range
    if (k instanceof Range) {
      r = new Range(k._min, k._max)
    }
    else {
      r = new Range(k, k)
    }
    return r
  }
  public has(k: Int) {
    return this._min <= k && this._max >= k
  }
  public compare(r: Range) {
    this.validate()
    r.validate()
    //      *           *
    //*  *     *  *        *  *   
    //   -1      0            1
    if (this._max < r._min) { return -1; }
    else if (this._min > r._min) { return 1; }
    return 0
  }
  public len() {
    return this._max - this._min
  }
  public override toString(): string {
    return "(" + this._min + "," + this._max + ")"
  }
}
class Sym extends Range { } //& { readonly '': unique symbol };
class RMapItem<Tv> extends Object {
  public readonly _key: Range
  public _val: Tv
  public constructor(r: Range, v: Tv) {
    super()
    this._key = r//new Range(min, max)
    this._val = v
  }
  public has(k: Int) {
    return this._key.has(k)
  }
  public override toString(): string {
    return this._key.toString() + " " + this._val
  }
}
class RangeMap<Tv> extends Object {
  //Range map no collisions allowed
  public _gr: Range = new Range(0, 0)
  public _gri: Int = 0
  public _vals: Array<RMapItem<Tv>> = []

  public set(x: Range | Int, v: Tv) {
    let k: Range = Range.from(x)
    let [idx, collision] = this.index(k)
    Assert(idx >= 0)
    if (collision) {
      if (this._vals[idx]._key.equals(x)) {
        this._vals[idx]._val = v
      }
      else {
        Raise("Range ambiguity: " + x.toString())
      }
    }
    else {
      let it = new RMapItem<Tv>(k, v)
      this._vals.splice(idx, 0, it);

      if (this._vals.length === 0) {
        this._gr = k
        this._gri = 0
      } else {
        if (this._gr.len() < k.len()) {
          this._gr = k
          this._gri = idx
        }
      }
    }
  }
  public get(x: Range): RMapItem<Tv> | undefined {
    if (this._vals.length === 0) {
      return undefined
    }
    let i = this.index(Range.from(x._min))[0]
    if (i < 0 || i >= this._vals.length) {
      return undefined
    }
    if (this._vals[i]._key.equals(x)) {
      return this._vals[i]
    }
    return undefined
  }
  public get_all(x: Range | Int, count: Int = -1): Array<RMapItem<Tv>> {
    let res: Array<RMapItem<Tv>> = new Array<RMapItem<Tv>>()
    let i0 = 0, i1 = 0
    let b = false
    if (x instanceof Range) {
      i0 = this.index(Range.from(x._min))[0]
      i1 = this.index(Range.from(x._max))[0]
    }
    else {
      i0 = i1 = this.index(Range.from(x))[0]
    }

    if (i0 < 0 || i0 > this._vals.length || i1 < 0 || i1 > this._vals.length) {
    }
    else {
      if (i1 === this._vals.length && this._vals.length > 0) {
        i1 = i1 - 1
      }
      if (count === -1) {
        count = (i1 - i0 + 1)
      }
      for (let i = i0; i < (i0 + count); i++) {
        res.push(this._vals[i])
      }
    }
    return res
  }
  private index(r: Range): [Int, boolean] {
    let ret = -1
    let i = this._gri
    let len = this._vals.length - i
    let off = 0
    let dbg_last_len = len
    let dbg_last_off = off
    let dbg_last_i = i
    let collision = false
    for (let guard = 0; guard < 999999999; guard++) {
      dbg_last_len = len
      dbg_last_off = off
      dbg_last_i = i
      if (len === 0) { // || off===this._vals.length
        ret = i
        break
      }
      else {
        let cmp = 0
        try {
          cmp = r.compare(this._vals[i]._key)
        }
        catch (ex: any) {
          Gu.trap()
        }
        if (cmp === 0) {
          ret = i
          collision = true
          break;
        }
        if (cmp === -1) {
          len = i - off

        }
        else if (cmp === 1) {
          len = this._vals.length - i - 1
          off = i + 1
        }
        i = (off + len / 2) | 0
        if (len < 0 || off < 0 || i < 0) {
          Gu.trap()
        }
      }
    }
    return [ret, collision]
  }
  public *entries(): Generator<[Range, Tv]> {
    for (let i = 0; i < this._vals.length; i++) {
      yield [this._vals[i]._key, this._vals[i]._val]
    }
  }
  public *[Symbol.iterator](): Generator<[Range, Tv]> {
    for (let i = 0; i < this._vals.length; i++) {
      yield [this._vals[i]._key, this._vals[i]._val]
    }
  }
  public static test() {
    msg("==TEST_RMAP==")
    let m = new RangeMap<string>()
    m.set(new Range(10, 10), "asdfasdfasdf")
    m.set(new Range(12, 20), "asdfasdfas2")
    m.set(new Range(-10, 9), "-9tfo-8")
    m.set(new Range(-30, -12), "zeasdfasdro")
    m.set(new Range(-11, -11), "-asdfasdf99")
    m.set(new Range(11, 11), "sdasdf")
    m.set(new Range(999), "999")
    m.set(new Range(-999), "-999")
    msg(m.toString())

    let gg = (n: Int | Range) => {
      msg("==FIND " + n.toString())
      let g = m.get_all(n)
      if (g.length) {
        for (let i = 0; i < g.length; i++) {
          msg("   g=" + g[i].toString())
        }
      }
      else {
        msg("" + n + " not found")
      }
    }

    gg(-999)
    gg(11)
    gg(new Range(-10, 10))
    gg(new Range(-9999, 9999))

    m = new RangeMap<string>()
    for (let i = 0; i < 100; i++) {
      let rr = Range.order((Math.random() * 2 - 1) * 1000 | 0, (Math.random() * 2 - 1) * 1000 | 0)
      try {
        m.set(rr, rr.toString())
      }
      catch (e: any) {
      }
    }

    msg(m.toString())

    Gu.trap()
  }
  public override toString(): string {
    let st = ""
    for (let [i, v] of this._vals.entries()) {
      st += v.toString() + "\n"
    }
    return st
  }
}
class SymInfo {
  public _sym: Sym
  public _val: string | Range
  public _text: string
  public constructor(s: Sym, v: string | Range) {
    this._sym = s
    this._val = v
    if (v instanceof Range) {
      this._text = v.toString()
    }
    else {
      this._text = v
    }
  }
}
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
class LexNode extends Object {
  public _sym: Sym
  public _rule: Rule | null
  public _parent: LexNode | null
  public _nodes: RangeMap<LexNode> | null = null

  public constructor(sym: Sym, rule: Rule | null, parent: LexNode | null) {
    super()
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
  public put(keys: SymInfo[], val: Rule, off: number = 0, len: number = -1) {
    Assert(keys.length > 0) //cannot put values on root
    if (len == -1) {
      len = keys.length
    }
    this._put(keys, val, off, len, -1);
  }
  protected _put(keys: SymInfo[], val: Rule, off: number, len: number, idx: number) {
    if (idx + 1 == len) {
      if (this._rule !== null) {
        msg(this.root().toString())
        Raise("Ambiguous symbol: '" + val + "' already defined as: '" + this._rule + "'")
      }
      this._rule = val
    }
    else {
      if (this._nodes == null) {
        this._nodes = new RangeMap<LexNode>()
      }

      let n: LexNode
      let sym = keys[idx + 1]._sym
      if (sym._max === 35) {
        Gu.trap()
      }
      let nn = this._nodes.get(sym)
      if (!nn) {
        n = new LexNode(sym, null, this)
        this._nodes.set(n._sym, n)
      }
      else {
        n = nn._val
      }
      n._put(keys, val, off, len, idx + 1)
    }
  }

  public exact(keys: Array<Rule | Sym | Tok>, off: number = 0,): Array<LexMatch> {
    return this.get(keys, off, keys.length - off, keys.length, false)
  }
  public full(keys: Array<Rule | Sym | Tok>, off: number = 0): Array<LexMatch> {
    return this.get(keys, off, keys.length - off, -1, false)
  }
  public part(keys: Array<Rule | Sym | Tok>, off: number = 0): Array<LexMatch> {
    return this.get(keys, off, keys.length - off, -1, true,)
  }
  public get(keys: Array<Rule | Sym | Tok>, off: number = 0, len: number = -1, count: number = -1, part: boolean): Array<LexMatch> {
    if (len === -1) {
      len = keys.length - off
    }
    let arr = new Array<LexMatch>()
    this._get(keys, off, len, count, part, arr, -1)
    return arr
  }
  protected _get(keys: Array<Rule | Sym | Tok>, off: number, maxlen: number, exact: number, part: boolean, arr: Array<LexMatch>, idx: number): LexMatch | null {
    if (idx + 1 < maxlen) {
      if (idx + 1 !== exact) {
        let k = keys[off + idx + 1]
        let sym: Sym //= new Sym(0,0)
        if (k instanceof Rule) {
          sym = k._sym
        }
        else if (k instanceof Tok) {
          sym = k._rule._sym
        }
        else {
          sym = k as Sym
        }

        if (this._nodes) {
          let n = this._nodes.get(sym)
          if (n) {
            let res = n._val._get(keys, off, maxlen, exact, part, arr, idx + 1)
            if (res) {
              return res;
            }
          }
        }
        // if (this._regex_nodes) {
        //   for (let [i, n] of this._regex_nodes.entries()) {
        //     if (n._regex!.test(String.fromCharCode(sym))) {
        //       let res = n._get(keys, off, maxlen, exact, part, arr, idx + 1)
        //       if (res) {
        //         return res;
        //       }
        //     }
        //   }
        // }

      }
    }

    if (((this._rule !== null) && (idx + 1 === exact || exact === -1)) || (part)) {
      let lm = new LexMatch(off, idx + 1, this)
      arr.push(lm)
      return lm
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
      for (let [ni, n] of this._nodes.entries()) {
        n._toString(st, 2, str, colsize, lang)
      }
    }

    return st
  }
  private strval(lang: Lang) {
    let st = ""
    let xx = lang.syms().get(this._sym)
    if (xx) {
      st = Gu.escape(xx._val._text)
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
    super(new Sym(0, 0), null, null)
    this._lang = lang
  }
  public override lang(): Lang { return this._lang }
  public override toString(sp: number = 0, str = ""): string {
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
class Rule {
  public readonly _sym: Sym
  public readonly _key: RuleKey
  public readonly _name: string
  public readonly _rule: Array<Sym>

  public constructor(name: string, rule: Array<Sym>) {
    Assert(rule.length)
    this._name = name
    this._rule = rule
    this._sym = Lang.sym(name)
    this._key = Lang.key(name, rule)
  }
  public match(x: RuleKey): boolean {
    return this._key === x
  }
  public equals(x: Rule | RuleKey | Tok): boolean {
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
  public _equals(x: RuleKey): boolean {
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
        st += app2 + "" + Gu.escape(rrr._val._text) + ""
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
  private _rules: Map<RuleKey, Rule> = new Map<RuleKey, Rule>()
  private _syms: RangeMap<SymInfo> = new RangeMap<SymInfo>()
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
    if (rule._key === -664825391) {
      Gu.trap();
    }
    this._rules.set(rule._key, rule)
  }
  public tok(s: Array<string>) {
    //literals / tokens
    for (let [i, ss] of s.entries()) {
      this._symbol(ss)
    }
  }
  public rule(s: string | Range, vals: Array<Array<string | Range>>): Array<Rule> {
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
  public _parse_rule(s: string | Range, vals: Array<string | Range>): Rule {
    Assert(this._generated === false)

    //we dont want the symbol names in the tree..

    for (let [si, ss] of vals.entries()) {
      this.addSym(ss)
    }
    let rule: Rule
    let n: string = ""
    if (typeof s === 'string') {
      Assert(s.length)
      n = s
    }
    else {
      n = s.toString()
    }
    this.addSym(s)
    rule = new Rule(n, Lang.syms(vals))
    this.check_set(rule)

    return rule
  }
  public _symbol(s: string): Rule {
    Assert(s.length > 0)
    let syms = Lang.tok_syms(s)
    let rule = this._rules.get(Lang.key(s, syms))
    if (!rule) {
      let rules = Lang.tokens(s)
      //tokens are defined by themselves recursively no need to put chars in the tree
      for (let [i, r] of rules.entries()) {
        if (!this._rules.get(r._key)) {
          this.check_set(r)
          this.addSym(s[i])
          //this._syms.set(syms[i], s[i])
        }
      }
      this.addSym(s)
      rule = new Rule(s, syms)
    }

    return rule
  }
  private addSym(ss: string | Range) {
    let sym = Lang.sym(ss)
    this._syms.set(sym, new SymInfo(sym, ss))
  }
  private generate() {
    if (!this._generated) {
      if (Gu.Debug) {
        let st = "===SYMS===\n"
        for (let [k, v] of this._syms.entries()) {
          st += "" + k + " -> " + Gu.escape(v._text) + "\n"
        }
        msg(st)
      }

      this._tree = new LexTree(this)
      for (let [rt, rr] of this._rules.entries()) {
        this._tree.put(this.infos(rr._rule), rr)
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
  public static keys(rs: Array<Rule> | null): Array<RuleKey> {
    let r = []
    if (rs) {
      for (let [i, c] of rs.entries()) {
        r.push(c._key)
      }
    }
    return r
  }
  public static syms(rs: Array<string | Range> | null): Array<Sym> {
    let r: Array<Sym> = []
    if (rs) {
      for (let [i, c] of rs.entries()) {
        if (c instanceof Range) {
          r.push(Lang.sym(c))
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
  public infos(rs: Array<Sym>): Array<SymInfo> {
    let r: Array<SymInfo> = []
    Assert(rs.length)
    for (let [i, c] of rs.entries()) {
      let s = this._syms.get(c)
      Assert(s !== undefined)
      r.push(s?._val!)
    }
    return r
  }
  public static sym(rs: string | Range): Sym {
    if (typeof rs === 'string') {
      Assert(rs.length > 0)
      if (rs.length === 1) {
        return new Sym(rs.charCodeAt(0))
      }
      else {
        return new Sym(Gu.hash_string(rs))
      }
    }
    else {
      return new Sym(Gu.hash_string(rs.toString()))
    }
  }
  public static key(s: string, ss: Array<Sym>): RuleKey {
    let y: number[] = []
    for (let i = 0; i < ss.length; i++) {
      y.push(ss[i]._min)
      y.push(ss[i]._max)
    }
    y.push(Gu.hash_string(s))
    let h = Gu.hash_ints(y, 101)
    return h as RuleKey
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

    L.tok(["\"", "\'", ":", ";", "|", "#", "%token", "%%", "\n"])

    L.rule("WS", [["\t", " "]])
    L.rule("CHAR", [[Range.chr("a", "z")], [Range.chr("A", "Z")]])
    L.rule("DIGIT", [[Range.chr("0", "9")]])
    L.rule("STR", [["CHAR", "CHAR"], ["CHAR"]])
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
class TextGrid extends Object {
  public _lang: Lang
  public _text: string = ""
  public _max_indent = 0;
  public _min_indent = 99999999;
  public _aligned: boolean = false;

  public _line: Array<Tok> = []
  public _regions: Array<FormatRegion> = []

  public constructor(text: string, l: Lang) {
    super()
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
  public override toString(): string {
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
      //show_debug_terminal()
      if (Gu.Testing) {
        Gu.run_tests()
      }
      grid_align()

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