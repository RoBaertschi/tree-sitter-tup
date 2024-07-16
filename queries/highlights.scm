[
 (foreach)
 (ifeq)
 (ifneq)
 (ifdef)
 (ifndef)
 "else"
 (endif)
 "include"
 (include_rules)
 "preload"
 "run"
 "preload"
 "export"
 "import"
 "error"
] @keyword


(string) @string
(text) @string.special
(flag) @tag
[
 (percent_flag)
 (array_percent_flag)
] @tag
(tup_identifier) @variable.builtin
(normal) @variable
(reference) @variable.special
(config_var) @variable
(operators) @operator
(arrow) @operator
[
 "$("
 "@("
 "&("
 "("
 ")"
 "|"
] @punctuation.bracket

(comment) @comment
(filename) @filename
(group) @group
(bin) @bin

