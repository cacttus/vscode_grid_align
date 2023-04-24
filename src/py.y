#builtin: ID, IGNORE, NL, SP, TAB 

%token DQUOT "\""
%token SQUOT "\'"
%token DQUOT_ES "\\\""
%token SQUOT_ES "\\\'"
%token COMMA ","
%token DOT "."
%token COL ":"
%token SCOL ";"
%token ARR "->"
%token QM "?"
%token DOL "$"
%token AMP "@"
%token ASSN "="
%token EQ "=="
%token NEQ "!="
%token GTE ">="
%token LTE "<="
%token GT ">"
%token LT "<"
%token LAND "&&"
%token LOR "||"
%token LNOT "!"
%token BAND "&"
%token BOR "|"
%token BNOT "~"
%token BXOR "^"
%token ADD "+"
%token MUL "*"
%token SUB "-"
%token DIV "/"
%token MOD "%"
%token ADDE "+="
%token MULE "*="
%token SUBE "-="
%token DIVE "/="
%token MODE "%="
%token LSBR "["
%token RSBR "]"
%token LCBR "{"
%token RCBR "}"
%token LPAR "("
%token RPAR ")"

#python
%token LCOM "#"
%token BCOMB "'''"
%token KDEF "def"
%token KCLASS "class"
%token KIF "if"
%token KELIF "elif"
%token KPASS "pass"
%token KNONE "None"
%token KTRUE "True"
%token KFALSE "False"
%token KSELF "self"
%token KIMPORT "import"
%token KFROM "from"
%token KRAISE "raise"
%token KBREAK "break"

%% 

LITERAL: TDQUOT IGNORE TDQUOT | TSQUOT IGNORE TSQUOT;
BCOM: BCOMB IGNORE BCOMB
VAR: ID | OP_ASSN;
VAL: VAR | LITERAL;
OP_ASSN:  VAR TASSN EXPR
        | VAR TADDE EXPR
        | VAR TMULE EXPR
        | VAR TSUBE EXPR
        | VAR TDIVE EXPR
        | VAR TMODE EXPR;
OP_STMT:    EXPR TEQ  EXPR
          | EXPR TNEQ EXPR
          | EXPR TADD EXPR
          | EXPR TMUL EXPR
          | EXPR TSUB EXPR
          | EXPR TDIV EXPR
          | EXPR TMOD EXPR;
EXPR: OP_STMT | OP_ASSN |FNCALL;
STMT: EXPR NL;
FNCALL: VAR FNCALLPARMS | MBRACC FNCALLPARMS;
FNCALLPARMS: LPAR RPAR | LPAR FNCALLPARMS PAR;
EXPRLIST: EXPR | EXPRLIST COMMA EXPR;

%% 


