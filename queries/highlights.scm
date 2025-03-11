[
 "foreach"
 "ifeq"
 "ifneq"
 "ifdef"
 "ifndef"
 "else"
 "endif"
 "include"
 "include_rules"
 "run"
 "preload"
 "export"
 "import"
 "error"
 ".gitignore"
] @keyword


(until_end) @string
(comment) @comment
(error message: (until_end) @emphasis.strong)
(text) @string.special
(flag) @tag
[
 (flag)
] @tag
((identifier) @variable.builtin (#match? @variable.builtin "TUP_*"))
(variable) @variable
["=" ":=" "+="] @operator
(arrow) @punctuation.delimiter
[
 "$("
 "@("
 "&("
 "("
 ")"
 "|"
] @punctuation.bracket

[
 (exclude_file)
 (normal_file)
 ] @string.special.path
[
 (quoted_exclude_file)
 (quoted_normal_file)
 ] @string.special.path
(bin) @string.special

