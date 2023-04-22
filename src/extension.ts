/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable no-mixed-spaces-and-tabs */
import * as vscode from 'vscode';
import * as path from 'path';
import { Console, assert } from 'console';
import { EOL } from 'os';

var debug = true

function msg(str: string) {
  if (debug) {
    console.log(str)
  }
}

enum Align { Left, Right, None }
enum LangType { CS_CPP_JS, PYTHON }
enum TokType {
  TERM,
  WS, NL,
  DQUOT, SQUOT, DQUOT_ES, SQUOT_ES,
  COMMA, DOT, COL, SCOL,
  BCOMB, BCOME, LCOM,
  EQ_CMP, EQ_ASN, GT, LT, GTE, LTE,
  LPAREN, RPAREN, LSBR, RSBR, LCBR, RCBR,
  ARROW, QM
}
class Delim {
  public _value: string = "";
  public _align: Align;
  public _type: TokType;
  public constructor(v: string, align: Align, type: TokType) {
    this._value = v;
    this._align = align;
    this._type = type;
  }
  public toString() {
    var val = this._value;
    if (this._type == TokType.NL) { val = "\\n" }
    return "val='" + val + "' type='" + TokType[this._type] + "'"
  }
}
class LexNode {
  public _delim: Delim | null = null
  public _ch: string = ""
  public _nodes: Array<LexNode> | null = null
  public _depth: number
  public constructor(ch: string, d: Delim | null, depth: number) {
    this._delim = d;
    this._ch = ch;
    this._depth = depth
  }
  public is_leaf() { return this._nodes == null }
  public print(st: any = { _str: "==TREE==\n" }, sp: number = 0, str = "") {
    var val = this._ch
    if (this._delim != null && this._delim._type == TokType.NL) { val = "\\n" }
    str += " ".repeat(sp) + "-> '" + val + "'"
    if (this._nodes != null) {
      for (var [ni, n] of this._nodes!.entries()) {
        n.print(st, 2, str)
      }
    }
    else {
      var dcol = 40
      var colsp: string = " ".repeat(dcol - str.length)
      //st._str += " ".repeat(sp) + "-> '" + this._ch + "'"
      str += colsp + " [" + this._delim!.toString() + "]\n"
      st._str += str
    }
    return st
  }
  public get(del_str: string, idx: number = -1) {
    if (idx + 1 === del_str.length) {
      return this._delim;
    }
    else {
      if (this._nodes != null) {
        for (var [ni, n] of this._nodes!.entries()) {
          if (n._ch === del_str[idx + 1]) {
            var res: any = n.get(del_str, idx + 1)
            if (res != null) {
              return res
            }
          }
        }
      }
    }
    return null
  }
  public put(d: Delim, idx: number = -1) {
    assert(d._value.length)

    if (idx + 1 == d._value.length) {
      this._delim = d;
    }
    else {
      if (this._nodes == null) {
        this._nodes = new Array<LexNode>()
      }
      for (var [ni, n] of this._nodes.entries()) {
        if (n._ch == d._value[idx + 1]) {
          n.put(d, idx + 1)
          return
        }
      }

      this._nodes.push(new LexNode(d._value[idx + 1], null, idx + 1))
      this._nodes[this._nodes.length - 1].put(d, idx + 1)
    }
  }
}
class Lang {
  public _tree: LexNode;
  public _type: LangType
  public _delims: Map<string, Delim> = new Map<string, Delim>();
  public addDelim(d: Delim) {
    this._delims.set(d._value, d);
  }

  public constructor(t: LangType, lc: string, bcb: string, bce: string) {
    this._type = t
    //default
    this.addDelim(new Delim("\n", Align.None, TokType.NL));
    this.addDelim(new Delim(" ", Align.None, TokType.WS));

    //lang
    this.addDelim(new Delim("\"", Align.None, TokType.DQUOT));
    this.addDelim(new Delim("\'", Align.None, TokType.SQUOT));
    this.addDelim(new Delim("\\\"", Align.None, TokType.DQUOT_ES));
    this.addDelim(new Delim("\\\'", Align.None, TokType.SQUOT_ES));
    this.addDelim(new Delim(",", Align.Left, TokType.COMMA));
    this.addDelim(new Delim(".", Align.None, TokType.DOT));
    this.addDelim(new Delim(":", Align.None, TokType.COL));
    this.addDelim(new Delim(";", Align.None, TokType.SCOL));
    this.addDelim(new Delim("->", Align.None, TokType.ARROW));
    this.addDelim(new Delim("?", Align.None, TokType.QM));
    this.addDelim(new Delim("=", Align.Left, TokType.EQ_ASN));
    this.addDelim(new Delim("==", Align.Left, TokType.EQ_CMP));
    this.addDelim(new Delim(">=", Align.Left, TokType.GTE));
    this.addDelim(new Delim("<=", Align.Left, TokType.LTE));
    this.addDelim(new Delim(">", Align.Left, TokType.GT));
    this.addDelim(new Delim("<", Align.Left, TokType.LT));
    this.addDelim(new Delim("[", Align.None, TokType.LSBR));
    this.addDelim(new Delim("]", Align.None, TokType.RSBR));
    this.addDelim(new Delim("{", Align.None, TokType.LCBR));
    this.addDelim(new Delim("}", Align.None, TokType.RCBR));
    this.addDelim(new Delim("(", Align.None, TokType.LPAREN));
    this.addDelim(new Delim(")", Align.None, TokType.RPAREN));
    this.addDelim(new Delim(lc, Align.None, TokType.LCOM));
    this.addDelim(new Delim(bcb, Align.None, TokType.BCOMB));
    this.addDelim(new Delim(bce, Align.None, TokType.BCOME));

    this._tree = new LexNode("", null, 0)
    for (var [di, d] of this._delims.entries()) {
      this._tree.put(d)
    }
    if (debug) {
      msg(this._tree.print()._str)

      var dd = this._tree.get(">=")
      //msg("got=" + dd?._value)
      dd = this._tree.get("'''")
      if (dd != null) {
        //  msg("got=" + dd?._value)
      }
      else {
        // msg("passed")
      }

    }
  }
}
class Tok { _str: string = ""; _del: Delim = new Delim("INVLAID", Align.Left, TokType.ARROW); }
class Lex {
  public in_fn = 0;
  public in_brk = 0;
  public in_brc = 0;
  public in_dq = false;
  public in_sq = false;
  public in_bc = false;
  public in_lc = false;
  public tokens: Array<Tok> = Array<Tok>();

  public _lang: Lang;
  public _term = ""
  private _ci: number = 0

  public constructor(lang: Lang) {
    this._lang = lang;
  }

  public parse(text: string, func: any) {
    //parse whole block
    for (this._ci = 0; this._ci < text.length;) {
      var ci_save = this._ci
      var tok = this.token(text);

      if (tok != null) {
        this.tokens.push(tok)
      }
      func(ci_save, text);
    }
  }
  private token(text: string) {
    //=> Tok, null
    msg("==Do Token==")
    var d = this.match(text);
    if (d != null) {
      //msg("  token='" + d._value + "' type=" + DelimType[d._type] + "")
      var type = d._type;

      if (this.ignore()) {
        //msg("ignore")
        if (type == TokType.SQUOT && this.in_sq) {
          this.in_sq = false;
        }
        else if (type == TokType.DQUOT && this.in_dq) {
          this.in_dq = false
        }
        else if (type == TokType.BCOME && this.in_bc) {
          this.in_bc = false
        }
        else if (type == TokType.NL && this.in_lc) {
          this.in_lc = false
        }
      }
      else if (type == TokType.WS || type == TokType.NL) {
      }
      else if (type == TokType.LCBR) {
        this.in_brc++;
      }
      else if (type == TokType.RCBR) {
        this.in_brc--;
      }
      else if (type == TokType.LSBR) {
        this.in_brk++;
      }
      else if (type == TokType.RSBR) {
        this.in_brk--;
      }
      else if (type == TokType.LPAREN) {
        this.in_fn++;
      }
      else if (type == TokType.RPAREN) {
        this.in_fn--;
      }
      else if (type == TokType.SQUOT) {
        this.in_sq = true;
      }
      else if (type == TokType.DQUOT) {
        this.in_dq = true;
      }
      else if (type == TokType.BCOMB) {
        this.in_bc = true
      }
      else if (type == TokType.LCOM) {
        this.in_lc = true
      }

      //if (type == DelimType.NL || (!this.ignore() && d._align != Align.None)) {
      var tk: Tok = { _str: this._term, _del: d };
      this._term = ""
      //msg("returned_token='" + tk._str + "' delim='" + tk._del._value + "'")
      return tk;
      // }
    }
    if (text[this._ci] != ' ' && text[this._ci]! + '\t' && text[this._ci] != '\n' && text[this._ci] != '\r') {
      this._term += text[this._ci];
    }
    return null;

  }
  private match(text: string) {
    var best = null
    var oldci = this._ci
    var st = ""
    for (var ci = this._ci + 1; ci <= text.length; ci++) {
      var ss = text.substring(this._ci, ci)
      var got = this._lang._tree.get(ss)
      st += "  ss='" + ss.replace("\n", "\\n").replace("\r", "\\r").replace(/\t/, "\\t") + "' \n"//+" got=" + got + " text.length=" + text.length + " this._ci=" + this._ci + " ci=" + ci)
      //msg("tok='"+tok!._str + "' del='" + tok!._del!._value+"'"+ "' type="+DelimType[tok!._del!._type]+"")
      if (got != null) {
        best = got;
      }
      else {
        break;
      }
    }
    if (best) {
      this._ci += best._value.length
      st += "  " + TokType[best._type] + "\n"
      st += "  old ci=" + oldci + "\n"
      st += "  new ci=" + this._ci + "\n"
    }
    else {
      this._ci += 1
    }
    if (st.length) {
      msg(st)
    }

    return best
  }
  private ignore() {
    return this.in_dq || this.in_sq || this.in_bc || this.in_lc
  }

}
class Col {
  public _size: number = 0;
  public _delim: Delim;
  public constructor(dd: Delim) {
    this._delim = dd;
  }
}
class Cell {
  public _text: string = ""
  public _delim: Delim
  public _col: Col | null = null
  public constructor(text: string, dd: Delim) {
    this._text = text;
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

  private _delims: Array<Delim> = [];

  public constructor(text: string, lang: LangType) {
    this._text_unmodified = text;
    this._text = text;
    text.replace(/\t/, " ")
    text.replace(/\r/, "")
    this._text += "\n" //account for \0 without needing extra toke
    var tlang: any = null;
    for (var [idx, l] of this._langs.entries()) {
      if (l._type == lang) {
        tlang = l;
        break;
      }
    }
    assert(tlang != null)
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
    var str = "";
    var started = false;
    var indent = 0;

    var that = this;
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
    var s = ""

    var app = ""
    for (var [i, tk] of this._lex.tokens.entries()) {
      s += app + " '" + tk._str + "', " + TokType[tk._del._type] + ""
      app = ","
      this.add(tk._str, tk._del)
    }
    msg("tokens=" + s)
  }
  private add(st: string, dd: Delim) {
    this._line_cells.push(new Cell(st, dd))

    if (dd._type == TokType.NL) { //eol
      var newregion: boolean = false
      var r = this.region()
      if (r == null) {
        newregion = true;
      }
      else if (r._cols.length > 0) {
        for (var [ci, cc] of this._line_cells.entries()) {
          var rc = r._cols[ci]
          if (ci >= r._cols.length) {
            //create new cols
            break;
          }
          if (rc._delim != cc._delim && rc._delim._type != TokType.NL && cc._delim._type != TokType.NL) {
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
          for (var i = 0; i < this._line_cells.length; i++) {
            if (i >= r._cols.length) {
              r._cols.push(new Col(this._line_cells[i]._delim))
            }
            if (st.length > r._cols[i]._size) {
              r._cols[i]._size = st.length;
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

    var text = ""
    var indent = " ".repeat(this._max_indent);

    for (const r of this._regions) {
      for (var li = 0; li < r._cell_lines.length; li++) {
        text += indent

        for (var ci = 0; ci < r._cell_lines[li].length; ci++) {
          var col = r._cols[ci]
          var cell = r._cell_lines[li][ci];
          var gap = ""
          if (cell._text.length > 0) {
            var scount = col._size - cell._text.length;
            assert(scount >= 0);
            var gap = " ".repeat(scount);
          }
          text += cell._text + gap + col._delim?._value;
          // if (ci < r._cols.length - 1) {
          //   lines[i] += " "
          // }
        }
      }
    }
    text = text.substring(0, text.length - 1)//remove /n

    if (debug) {
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
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      msg("Running grid align")
      for (const [si, sel] of editor.selections.entries()) {
        if (sel) {
          var r = new vscode.Range(sel.start.line, sel.start.character, sel.end.line, sel.end.character);
          const text = editor.document.getText(r);
          var tg: TextGrid = new TextGrid(text, LangType.PYTHON);
          editor.edit(eb => {
            eb.replace(r, tg.toString());
          });
        }
      }
    }
  } catch (ex: any) {
    msg(ex)
  }
}
export function activate(context: vscode.ExtensionContext) {


  if (debug) {
    var once = false
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