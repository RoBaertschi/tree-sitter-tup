/// <reference types="tree-sitter-cli/dsl" />"
// @ts-check
//

const percent_flags = ["%", "e", "O", "d", "g"];
const array_percent_flags = ["b", "B", "o", "f", "i"];

module.exports = grammar({
  name: "tup",
  inline: ($) => [$._definition],
  extras: ($) => [$.comment, /[\s]/, alias(token(seq("\\", /\r?\n|\r/)), "\\")],
  externals: ($) => [$.command],
  rules: {
    tupfile: ($) => repeat($._definition),
    _definition: ($) =>
      choice(seq($.gitignore, "\n"), $.rule, $.variable_statement),
    rule: ($) =>
      seq(
        token(": "),
        optional($.input_statement),
        optional(field("order_only_inputs", $.piped_files)),
        $.arrow,
        optional($.text),
        repeat1(choice($.command, $.array_percent_flag, $.percent_flag)),
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
        seq($.foreach, field("inputs", $.files)),
        field("inputs", $.files),
      ),
    arrow: ($) => token("|>"),
    // TODO: add ^^ syntax
    files: ($) => repeat1($.filename),
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
    filename: ($) =>
      choice(
        prec.left($.percent_flag),
        $.array_percent_flag,
        /[^/<>{}%|\\\s]+/,
      ),

    flag: ($) => prec(1, token(choice("b", "c", "j", "o", "s", "t"))),
    text: ($) =>
      seq(
        "^",
        optional($.flag),
        optional(choice($.percent_flag, $.array_percent_flag, / [^^]*/)),
        "^",
      ),
    identifier: ($) => choice($.tup_identifier, $.reference, $.normal),
    tup_identifier: ($) => prec(2, /TUP_[\w\d]*/),
    reference: ($) => prec(1, /&[\w\d]+/),
    normal: ($) => /[\w\d]+/,
    operators: ($) => choice("=", "+=", ":="),
    variable_statement: ($) =>
      seq($.identifier, $.operators, /[^\n]+/, optional("\n")),
  },
});
