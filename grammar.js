/**
 * @file tup
 * @author RoBaertschi
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />"
// @ts-check
//

const percent_flags = ["%", "e", "O", "d", "g"];
const array_percent_flags = ["b", "B", "o", "f", "i"];

const text_flags = ["b", "c", "j", "o", "s", "t"];

const file_regex = /[^^\"\s%]/;
const quoted_file_regex = /(?:(?:\\")|[^"\s%]|[ ])/;
const quoted_exclude_file_regex = /(?:(?:\\")|[^"\s%]|[ ])/;

module.exports = grammar({
  name: "tup",
  extras: _ => [/[\r\t\f\v ]/],
  rules: {
    program: $ => repeat($.statement),
    statement: $ => choice(
      $.rule,
      $.var,
      $.append,
      $.ifeq,
      $.ifdef,
      $.error,
      $.include,
      $.include_rules,
      $.run,
      $.preload,
      $.export,
      $.import,
      $.gitignore,
      $.comment,
      $.macro,
      "\n"
    ),
    comment: $ => seq("#", $.until_end, "\n"),
    gitignore: _ => seq(".gitignore", "\n"),
    import: $ => seq("import", $.identifier, "=", field("default", $.until_end), "\n"),
    export: $ => seq("export", $.identifier, "\n"),
    preload: $ => seq("preload", repeat1(choice($.normal_file, $.quoted_normal_file)), "\n"),
    run: $ => seq("run", field("command", $.until_end), "\n"),
    include_rules: _ => seq("include_rules", "\n"),
    include: $ => seq("include", field("file", $.until_end), "\n"),
    error: $ => seq("error", field("message", $.until_end), "\n"),
    ifeq: $ => seq(
      choice("ifeq", "ifneq"),
      "(",
      repeat(injectionOr($, /[^\n,]/)),
      ",",
      repeat(injectionOr($, /[^\n,]/)),
      ")",
      "\n",
      repeat($.statement),
      optional(seq(
        "else",
        "\n",
        repeat($.statement),
      )),
      seq("endif", "\n"),
    ),
    ifdef: $ => seq(
      choice("ifdef", "ifndef"),
      $.identifier,
      "\n",
      repeat($.statement),
      optional(seq(
        "else",
        "\n",
        repeat($.statement),
      )),
      seq("endif", "\n"),
    ),
    var: $ => seq($.identifier, choice("=", ":="), field("value", $.until_end), "\n"),
    append: $ => seq($.identifier, "+=", field("value", $.until_end), "\n"),
    until_end: _ => /[^\n]*/,
    identifier: _ => token(/[^\s)]+/),
    macro: $ => seq(
      field("macro_name", /![^\s!]+/),
      "=",
      field("inputs", repeat($._file)),
      optional(field("order_only_inputs", seq("|", repeat1($._file)))),
      $.arrow,
      optional($.text),
      optional($.command),
      $.arrow,
      field("outputs", repeat($._file)),
      "\n",
    ),
    rule: $ => seq(":",
      optional("foreach"),
      field("inputs", repeat($._file)),
      optional(field("order_only_inputs", seq("|", repeat1($._file)))),
      $.arrow,
      optional($.text),
      optional($.command),
      $.arrow,
      field("outputs", repeat($._file)),
      optional(field("extra_outputs", seq("|", repeat($._file)))),
      optional($.bin),
      "\n"
    ),
    // HACK: IMPORTANT THE ORDER OF arrow AND *_file MATTER, KEEP THAT IN MIND
    arrow: _ => /[||]>/,
    bin: _ => /\{[^\s}]*}/,
    exclude_file: $ => seq(
      "^",
      prec.right(
        repeat1(
          injectionOr($, file_regex,)
        )
      )
    ),
    quoted_exclude_file: $ => seq(
      "\"^",
      repeat1(
        injectionOr($, quoted_exclude_file_regex,)
      ),
      "\""
    ),
    normal_file: $ => prec.right(
      repeat1(
        injectionOr($, file_regex)
      )
    ),
    quoted_normal_file: $ => seq(
      "\"",
      repeat1(injectionOr($, quoted_file_regex)),
      "\""
    ),
    _file: $ => choice($.exclude_file, $.quoted_exclude_file, $.normal_file, $.quoted_normal_file),
    text: $ => seq("^", optional($.text_flags), " ", /[^\n\^\r]*/, "^"),
    text_flags: _ => repeat1(choice(...text_flags)),
    flag: _ => choice(...percent_flags.map(v => token.immediate("%" + v)), ...array_percent_flags.map(v => token.immediate(seq("%", /\d*/, v))), token.immediate(seq("%<", /[^\s>]*/, ">"))),
    variable: $ => seq(choice(token("$("), token("&("), token("@(")), $.identifier, token(")")),
    command: $ => repeat1(injectionOr($, /[^\n\r]/)),
  },
})

/**
 * @param {GrammarSymbols<"flag" | "variable">} $
 * @param {RuleOrLiteral} rule
 * @returns {RuleOrLiteral}
 */
function injectionOr($, rule) {
  return choice($.flag, $.variable, rule)
}

//module.exports = grammar({
//  name: "tup",
//  inline: ($) => [$._definition],
//  extras: ($) => [$.comment, /[\s]/, alias(token(seq("\\", /\r?\n|\r/)), "\\")],
//  externals: ($) => [$.command, $.string_to_fileend],
//  rules: {
//    tupfile: ($) => repeat($._definition),
//    _definition: ($) =>
//      choice($.rule, $.variable_statement, $._keyword, $.macro_decleration),
//    rule: ($) =>
//      seq(
//        token(": "),
//        optional($.input_statement),
//        optional(field("order_only_inputs", $.piped_files)),
//        $.arrow,
//        optional($.text),
//        optional(
//          repeat1(
//            choice(
//              $.command,
//              $.array_percent_flag,
//              $.percent_flag,
//              $.variable_reference,
//            ),
//          ),
//        ),
//        $.arrow,
//        optional(field("outputs", $.files)),
//        optional(field("extra_outputs", $.piped_files)),
//        optional($.group),
//        optional($.bin),
//        optional("\n"),
//      ),
//
//    foreach: ($) => token(prec(1, "foreach")),
//    gitignore: ($) => token(prec(1, ".gitignore")),
//    input_statement: ($) =>
//      choice(
//        seq($.foreach, field("inputs", $.inputfiles)),
//        field("inputs", $.inputfiles),
//      ),
//    arrow: ($) => token("|>"),
//    files: ($) => repeat1($.filename),
//    inputfiles: $ => repeat1(choice($.filename, $.group, $.bin)),
//    filename: ($) =>
//      choice($.percent_flag, $.array_percent_flag, prec.left(/[^<>{}%|\\\s]+/)),
//    // For order-only inputs and extra outputs
//    piped_files: ($) => seq("|", $.files),
//    comment: ($) => token(prec(-1, /#.*/)),
//    // TODO: write custom scanner for this, as tup allows {ddd}} but we currently don't'
//    group: ($) => seq("<", /[^\s>]+/, ">"),
//    bin: ($) => seq("{", /[^\s}]+/, prec.right(1, "}")),
//    percent_flag: ($) =>
//      choice(
//        new RegExp(`%[${percent_flags.join("")}]`),
//        seq(token("%"), $.group),
//      ),
//    array_percent_flag: ($) =>
//      new RegExp(`%[0-9]*[${array_percent_flags.join("")}]`),
//
//    flag: ($) => prec(1, token(choice("b", "c", "j", "o", "s", "t"))),
//    text: ($) =>
//      seq(
//        "^",
//        optional($.flag),
//        optional(choice($.percent_flag, $.array_percent_flag, / [^^]*/)),
//        "^",
//      ),
//    identifier: ($) =>
//      repeat1(
//        choice($.tup_identifier, $.reference, $.normal, $.variable_reference),
//      ),
//    tup_identifier: ($) => prec(2, new RegExp(`TUP_${var_regex}`)),
//    reference: ($) => prec(1, new RegExp(`&${var_regex}`)),
//    normal: ($) => new RegExp(`${var_regex}`),
//    operators: ($) => choice("=", "+=", ":="),
//    variable_statement: ($) =>
//      seq(
//        $.identifier,
//        $.operators,
//        alias($.string_to_fileend, $.string),
//        optional("\n"),
//      ),
//    variable_reference: ($) =>
//      seq(
//        choice(
//          choice(token("$("), token("${")),
//          choice(token("@("), token("@{")),
//          choice(token("&("), token("&{")),
//        ),
//        repeat1(
//          choice(
//            $.tup_identifier,
//            $.normal,
//            $.percent_flag,
//            $.array_percent_flag,
//          ),
//        ),
//        choice(")", "}"),
//      ),
//
//    string: ($) => repeat1(choice(/./, $.variable_reference)),
//    ifeq: ($) => "ifeq",
//    ifneq: ($) => "ifneq",
//    ifdef: ($) => "ifdef",
//    ifndef: ($) => "ifndef",
//    include: ($) => seq("include", $.filename),
//    include_rules: ($) => "include_rules",
//    preload: ($) => seq("preload", $.filename),
//    run: ($) => seq("run", alias($.string_to_fileend, $.string)),
//    export: ($) => seq("export", $.normal),
//    import: ($) =>
//      seq("import", $.normal, token("="), alias($.string_to_fileend, $.string)),
//
//    if_compare: ($) =>
//      seq(
//        choice($.ifeq, $.ifneq),
//        "(",
//        $.string,
//        ",",
//        $.string,
//        ")",
//        "\n",
//        repeat($._definition),
//        optional($.else),
//        $.endif,
//      ),
//
//    config_var: () => new RegExp(var_regex),
//
//    if: ($) =>
//      seq(
//        choice($.ifdef, $.ifndef),
//        $.config_var,
//        "\n",
//        repeat($._definition),
//        optional($.else),
//        $.endif,
//      ),
//    else: ($) => seq("else", "\n", repeat($._definition)),
//    // ifs only support 8 levels of nesting, we don't implement this restriction,
//    // as it brings more unnecessary complexity, as it is a implementation
//    // detail and not really important for a syntax parser, this would be more
//    // of a lsp feature
//    endif: ($) => "endif",
//
//    error: ($) => seq("error", alias($.string_to_fileend, $.string)),
//
//    macro_decleration: ($) =>
//      seq(
//        token("!"),
//        /[^\s]+/,
//        "=",
//        optional($.input_statement),
//        optional(field("order_only_inputs", $.piped_files)),
//        $.arrow,
//        optional($.text),
//        repeat1(
//          choice(
//            $.command,
//            $.array_percent_flag,
//            $.percent_flag,
//            $.variable_reference,
//          ),
//        ),
//        $.arrow,
//        optional(field("outputs", $.files)),
//        optional("\n"),
//      ),
//    _keyword: ($) =>
//      seq(
//        choice(
//          $.gitignore,
//          $.if_compare,
//          $.if,
//          $.error,
//          $.include,
//          $.include_rules,
//          $.run,
//          $.preload,
//          $.export,
//          $.import,
//        ),
//        optional("\n"),
//      ),
//  },
//});
