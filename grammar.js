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
const var_regex = "[\\w\\d\\-_\\.]+";

module.exports = grammar({
  name: "tup",
  inline: ($) => [$._definition],
  extras: ($) => [$.comment, /[\s]/, alias(token(seq("\\", /\r?\n|\r/)), "\\")],
  externals: ($) => [$.command, $.string_to_fileend],
  rules: {
    tupfile: ($) => repeat($._definition),
    _definition: ($) =>
      choice($.rule, $.variable_statement, $._keyword, $.macro_decleration),
    rule: ($) =>
      seq(
        token(": "),
        optional($.input_statement),
        optional(field("order_only_inputs", $.piped_files)),
        $.arrow,
        optional($.text),
        optional(
          repeat1(
            choice(
              $.command,
              $.array_percent_flag,
              $.percent_flag,
              $.variable_reference,
            ),
          ),
        ),
        $.arrow,
        optional(field("outputs", $.files)),
        optional(field("extra_outputs", $.piped_files)),
        optional($.group),
        optional($.bin),
        optional("\n"),
      ),

    foreach: ($) => token(prec(1, "foreach")),
    gitignore: ($) => token(prec(1, ".gitignore")),
    input_statement: ($) =>
      choice(
        seq($.foreach, field("inputs", $.inputfiles)),
        field("inputs", $.inputfiles),
      ),
    arrow: ($) => token("|>"),
    files: ($) => repeat1($.filename),
    inputfiles: $ => repeat1(choice($.filename, $.group, $.bin)),
    filename: ($) =>
      choice($.percent_flag, $.array_percent_flag, prec.left(/[^<>{}%|\\\s]+/)),
    // For order-only inputs and extra outputs
    piped_files: ($) => seq("|", $.files),
    comment: ($) => token(prec(-1, /#.*/)),
    // TODO: write custom scanner for this, as tup allows {ddd}} but we currently don't'
    group: ($) => seq("<", /[^\s>]+/, ">"),
    bin: ($) => seq("{", /[^\s}]+/, prec.right(1, "}")),
    percent_flag: ($) =>
      choice(
        new RegExp(`%[${percent_flags.join("")}]`),
        seq(token("%"), $.group),
      ),
    array_percent_flag: ($) =>
      new RegExp(`%[0-9]*[${array_percent_flags.join("")}]`),

    flag: ($) => prec(1, token(choice("b", "c", "j", "o", "s", "t"))),
    text: ($) =>
      seq(
        "^",
        optional($.flag),
        optional(choice($.percent_flag, $.array_percent_flag, / [^^]*/)),
        "^",
      ),
    identifier: ($) =>
      repeat1(
        choice($.tup_identifier, $.reference, $.normal, $.variable_reference),
      ),
    tup_identifier: ($) => prec(2, new RegExp(`TUP_${var_regex}`)),
    reference: ($) => prec(1, new RegExp(`&${var_regex}`)),
    normal: ($) => new RegExp(`${var_regex}`),
    operators: ($) => choice("=", "+=", ":="),
    variable_statement: ($) =>
      seq(
        $.identifier,
        $.operators,
        alias($.string_to_fileend, $.string),
        optional("\n"),
      ),
    variable_reference: ($) =>
      seq(
        choice(
          choice(token("$("), token("${")),
          choice(token("@("), token("@{")),
          choice(token("&("), token("&{")),
        ),
        repeat1(
          choice(
            $.tup_identifier,
            $.normal,
            $.percent_flag,
            $.array_percent_flag,
          ),
        ),
        choice(")", "}"),
      ),

    string: ($) => repeat1(choice(/./, $.variable_reference)),
    ifeq: ($) => "ifeq",
    ifneq: ($) => "ifneq",
    ifdef: ($) => "ifdef",
    ifndef: ($) => "ifndef",
    include: ($) => seq("include", $.filename),
    include_rules: ($) => "include_rules",
    preload: ($) => seq("preload", $.filename),
    run: ($) => seq("run", alias($.string_to_fileend, $.string)),
    export: ($) => seq("export", $.normal),
    import: ($) =>
      seq("import", $.normal, token("="), alias($.string_to_fileend, $.string)),

    if_compare: ($) =>
      seq(
        choice($.ifeq, $.ifneq),
        "(",
        $.string,
        ",",
        $.string,
        ")",
        "\n",
        repeat($._definition),
        optional($.else),
        $.endif,
      ),

    config_var: () => new RegExp(var_regex),

    if: ($) =>
      seq(
        choice($.ifdef, $.ifndef),
        $.config_var,
        "\n",
        repeat($._definition),
        optional($.else),
        $.endif,
      ),
    else: ($) => seq("else", "\n", repeat($._definition)),
    // ifs only support 8 levels of nesting, we don't implement this restriction,
    // as it brings more unnecessary complexity, as it is a implementation
    // detail and not really important for a syntax parser, this would be more
    // of a lsp feature
    endif: ($) => "endif",

    error: ($) => seq("error", alias($.string_to_fileend, $.string)),

    macro_decleration: ($) =>
      seq(
        token("!"),
        /[^\s]+/,
        "=",
        optional($.input_statement),
        optional(field("order_only_inputs", $.piped_files)),
        $.arrow,
        optional($.text),
        repeat1(
          choice(
            $.command,
            $.array_percent_flag,
            $.percent_flag,
            $.variable_reference,
          ),
        ),
        $.arrow,
        optional(field("outputs", $.files)),
        optional("\n"),
      ),
    _keyword: ($) =>
      seq(
        choice(
          $.gitignore,
          $.if_compare,
          $.if,
          $.error,
          $.include,
          $.include_rules,
          $.run,
          $.preload,
          $.export,
          $.import,
        ),
        optional("\n"),
      ),
  },
});
