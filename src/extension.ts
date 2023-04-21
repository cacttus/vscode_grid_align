/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable no-mixed-spaces-and-tabs */
import * as vscode from 'vscode';
import * as path from 'path';
import { Console, assert } from 'console';
import { EOL } from 'os';

enum Align { Left, Right, None }
enum LangType { CS_CPP_JS, PYTHON }
enum DelimType {
  WS, NL,
  DQUOT, SQUOT, DQUOT_ES, SQUOT_ES,
  COMMA, DOT, COL, SCOL,
  BCOMB, BCOME, LCOM,
  EQ_CMP, EQ_ASN, GT, LT, GTE, LTE,
  LPAREN, RPAREN, LSBR, RSBR, LCBR, RCBR,
  ARROW, QM
}

class Lang {
  public _type: LangType
  public _delims: Map<string, Delim> = new Map<string, Delim>();
  public addDelim(d: Delim) {
    this._delims.set(d._value, d);
  }
  public constructor(t: LangType, lc: string, bcb: string, bce: string) {
    this._type = t
    //TODO: settings for the align toks
    this.addDelim(new Delim("\"", Align.None, DelimType.DQUOT));
    this.addDelim(new Delim("\'", Align.None, DelimType.SQUOT));
    this.addDelim(new Delim("\\\"", Align.None, DelimType.DQUOT_ES));
    this.addDelim(new Delim("\\\'", Align.None, DelimType.SQUOT_ES));
    this.addDelim(new Delim("\t", Align.None, DelimType.WS));
    this.addDelim(new Delim("\n", Align.None, DelimType.NL));
    this.addDelim(new Delim(",", Align.Left, DelimType.COMMA));
    this.addDelim(new Delim(".", Align.Left, DelimType.DOT));
    this.addDelim(new Delim(":", Align.Left, DelimType.COL));
    this.addDelim(new Delim(";", Align.Left, DelimType.SCOL));
    this.addDelim(new Delim("->", Align.None, DelimType.ARROW));
    this.addDelim(new Delim("?", Align.None, DelimType.QM));
    this.addDelim(new Delim("=", Align.Left, DelimType.EQ_ASN));
    this.addDelim(new Delim("==", Align.Left, DelimType.EQ_CMP));
    this.addDelim(new Delim(">=", Align.Left, DelimType.GTE));
    this.addDelim(new Delim("<=", Align.Left, DelimType.LTE));
    this.addDelim(new Delim(">", Align.Left, DelimType.GT));
    this.addDelim(new Delim("<", Align.Left, DelimType.LT));
    this.addDelim(new Delim("[", Align.None, DelimType.LSBR));
    this.addDelim(new Delim("]", Align.None, DelimType.RSBR));
    this.addDelim(new Delim("{", Align.None, DelimType.LCBR));
    this.addDelim(new Delim("}", Align.None, DelimType.RCBR));
    this.addDelim(new Delim("(", Align.None, DelimType.LPAREN));
    this.addDelim(new Delim(")", Align.None, DelimType.RPAREN));
    this.addDelim(new Delim(lc, Align.None, DelimType.LCOM));
    this.addDelim(new Delim(bcb, Align.None, DelimType.BCOMB));
    this.addDelim(new Delim(bce, Align.None, DelimType.BCOME));
  }
}

class Delim {
  public _value: string = "";
  public _align: Align;
  public _type: DelimType;
  public constructor(v: string, align: Align, type: DelimType) {
    this._value = v;
    this._align = align;
    this._type = type;
  }
}
class Tok { _str: string = ""; _del: Delim = new Delim("INVLAID", Align.Left, DelimType.ARROW); _idx: number = 0; }
class Lex {
  public in_fn = 0;
  public in_brk = 0;
  public in_brc = 0;
  public in_dq = false;
  public in_sq = false;
  public in_bc = false;
  public in_lc = false;
  public _lang: Lang;
  public _token = ""

  public constructor(lang: Lang) {
    this._lang = lang;
  }
  public ignore() {
    return this.in_dq || this.in_sq || this.in_bc || this.in_lc
  }
  private match(ci: number, text: string) {
    //return a delimiter or nothing
    for (var [k, v] of this._lang._delims.entries()) {
      var ss = text.substring(ci, ci + v._value.length);
      if (ss === v._value) {
        return v;
      }
    }
    return null;
  }

  public parse(ci: number, text: string) {
    //=> Tok, null
    var d = this.match(ci, text);
    if (d != null) {
      var type = d?._type;

      if (this.ignore()) {
        if (type == DelimType.SQUOT && this.in_sq) {
          this.in_sq = false;
        }
        else if (type == DelimType.DQUOT && this.in_dq) {
          this.in_dq = false
        }
        else if (type == DelimType.BCOME && this.in_bc) {
          this.in_bc = false
        }
        else if (type == DelimType.NL && this.in_lc) {
          this.in_lc = false
        }
      }
      else if (type == DelimType.WS || type == DelimType.NL) {
      }
      else if (type == DelimType.LCBR) {
        this.in_brc++;
      }
      else if (type == DelimType.RCBR) {
        this.in_brc--;
      }
      else if (type == DelimType.LSBR) {
        this.in_brk++;
      }
      else if (type == DelimType.RSBR) {
        this.in_brk--;
      }
      else if (type == DelimType.LPAREN) {
        this.in_fn++;
      }
      else if (type == DelimType.RPAREN) {
        this.in_fn--;
      }
      else if (type == DelimType.SQUOT) {
        this.in_sq = !this.in_sq;
      }
      else if (type == DelimType.DQUOT) {
        this.in_dq = !this.in_dq;
      }
      else if (type == DelimType.BCOMB) {
        this.in_bc = true
      }

      if (type == DelimType.NL || (!this.ignore() && d._align != Align.None)) {
        var tk: Tok = { _str: this._token, _del: d, _idx: -1 };
        this._token = ""
        return tk;
      }
    }
    this._token += text[ci];
    return null;

  }
}
class Cell {
  public _text: string = ""
  public constructor(text: string) {
    this._text = text;
  }
}
class Col {
  public _cells: Array<Cell> = [];
  public _size: number = 0;
  public _delim: Delim | null = null;
  public constructor(dd: Delim) {
    this._delim = dd;
  }
}
class FormatRegion {
  public _cols: Array<Col> = [];
  public _linecount: number = 0;
}
class TextGrid {
  public _lineid: number = 0;
  public _colid: number = 0;
  public _lines: Array<string> = [];
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

  public constructor(lines: Array<string>, lang: LangType) {
    this._lines = [];
    for (var i = 0; i < lines.length; i++) {
      this._lines.push(lines[i])
    }
    var tlang: any = null;
    for (var [idx, l] of this._langs.entries()) {
      if (l._type == lang) {
        tlang = l;
        break;
      }
    }
    assert(tlang != null)

    this._lex = new Lex(tlang);

    this._regions.push(new FormatRegion());
  }

  private loopLines(fn: any) {
    for (const [lineid, line] of this._lines.entries()) {
      if (line.length) {
        this._lineid = lineid;
        this._colid = 0;
        fn.call(this, line, lineid)
        this.region()._linecount++;
      }
    }
  }
  private iswsln(c: string) {
    assert(c.length == 1);
    return c[0] == ' ' || c[0] == '\t';
  }
  private region() {
    return this._regions[this._regions.length - 1];
  }
  private add(st: string, dd: Delim, is_last_cell: boolean) {
    var r = this.region();
    var col = null;

    for (var [ci, cc] of r._cols.entries()) {
      if (cc._delim == dd) {
        col = cc;
        break;
      }
    }

    //check grammar - <> delims in above line not sequential
    var rlineid = this._lineid - r._linecount;
    if (rlineid > 0) {
      if (this._colid < r._cols.length) {
        if (r._cols[this._colid]._delim != dd) {
          if (!is_last_cell) {
            this._regions.push(new FormatRegion());
            r = this.region();
            r._cols.push(new Col(dd))
            col = r._cols[r._cols.length - 1];
          }
        }
      }
    }

    if (col == null) {
      r._cols.push(new Col(dd))
      col = r._cols[r._cols.length - 1];
    }

    col._cells.push(new Cell(st));
    if (st.length > col._size) {
      col._size = st.length;
    }

    this._colid++;
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
    if (!this._aligned) {
      this.loopLines(this.align_line);
      this._aligned = true;
    }
  }
  private align_line(line: string, lineid: number) {
    var str = "";
    var started = false;
    var indent = 0;
    line += "\n"

    const tokens: Array<Tok> = []

    if (line.length > 1) {
      for (var ci = 0; ci < line.length; ci++) {
        if (started == false) {
          if (line[ci] == ' ' || line[ci] == '\t') {
            indent++;
          }
          else {
            started = true;
            this.checkIndent(indent);
          }
        }

        var tok = this._lex.parse(ci, line);
        if (tok != null) {
          console.log(tok?._str + " -> " + tok?._del?._value)
          tokens.push(tok)
        }
      }//for


      for (var tk of tokens) {
        this.add(tk._str, tk._del, tk._idx == tokens.length)
      }

    }
  }

  public toString() {
    this.align();

    var lines = []
    var indent = " ".repeat(this._max_indent);

    for (const r of this._regions) {
      for (const [ci, col] of r._cols.entries()) {
        for (var i = 0; i < col._cells.length; i++) {
          var cell = col._cells[i];
          if (i >= lines.length) {
            lines.push(indent);
          }
          var scount = col._size - cell._text.length;
          assert(scount >= 0);
          var gap = " ".repeat(scount);

          //TODO: spaces before/after delim

          lines[i] += cell._text + gap + col._delim?._value;
          if (ci < r._cols.length - 1) {
            lines[i] += " "
          }

        }
      }
    }
    var res = lines.join("");

    console.debug("======RES=======")
    console.debug(res)
    console.debug("======END=======")

    //**DEBUG */
    //**DEBUG */
    //**DEBUG */
    //**DEBUG */
    //**DEBUG */

    //return lines.join("");
    return this._lines.join(EOL);

  }

}
function grid_align() {
  try {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      console.debug("Running grid align")
      for (const [si, sel] of editor.selections.entries()) {
        if (sel) {
          var r = new vscode.Range(sel.start.line, sel.start.character, sel.end.line, sel.end.character);
          const oln = editor.document.getText(r);
          var lines = oln.split(/\r?\n/)
          console.debug("line count=" + lines.length)
          var tg: TextGrid = new TextGrid(lines, LangType.PYTHON);
          editor.edit(eb => {
            eb.replace(r, tg.toString());
          });
        }
      }
    }
  } catch (ex) {
    console.log(ex)
  }
}
export function activate(context: vscode.ExtensionContext) {

  //**TEST***** 
  //**TEST***** 
  //run this with the pre-selected text alreayd selected so we dont got to keep doing this over and over..
  vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
    grid_align()
  });
  //**TEST****
  //**TEST****
  //**TEST****

  const disposable = vscode.commands.registerCommand('extension.grid_align', grid_align);
  context.subscriptions.push(disposable);
}
export function deactivate() { }