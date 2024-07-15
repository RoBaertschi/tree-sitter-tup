#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"

enum TokenType {
    STRING,
    // ARROW,
    // FOREACH,
};

struct State {
    // When this is set, ignore anything and create a arrow
    bool make_arrow;
};

void *tree_sitter_tup_external_scanner_create(void) {
    return NULL;
}


void tree_sitter_tup_external_scanner_destroy(void* payload) {
}


unsigned tree_sitter_tup_external_scanner_serialize(void *payload, char *buffer) {
    return 0;
}


void tree_sitter_tup_external_scanner_deserialize(void *payload, char *buffer, unsigned length) {
}


bool tree_sitter_tup_external_scanner_scan(
    void* payload,
    TSLexer *lexer,
    const bool *valid_symbols
) {
    Array(char) next_string = array_new();

    // if (valid_symbols[FOREACH]) {

    //     const char foreach[] = {'f', 'o', 'r', 'e', 'a', 'c', 'h'};

    //     for (int i = 0; i < sizeof(foreach); i++) {
    //         if (foreach[i] != lexer->lookahead) {
    //             return false;
    //         }
    //         lexer->advance(lexer, false);
    //     }
    //     lexer->result_symbol = FOREACH;
    //     return true;

    //     // remove NUL
    //     // if (next_string.size == sizeof(foreach)) {
    //     //     if (memcmp(foreach, next_string.contents, sizeof(foreach))) {
    //     //         array_clear(&next_string);
    //     //         lexer->result_symbol = FOREACH;
    //     //         lexer->mark_end(lexer);
    //     //         return true;
    //     //     }
    //     // }
    // }

    if (valid_symbols[STRING]
            && lexer->lookahead != '%'
            && lexer->lookahead != '^'
            && lexer->lookahead != '&'
            && lexer->lookahead != '$'
            && lexer->lookahead != '@'
    ) {
        lexer->advance(lexer, false);

        while (lexer->lookahead != '\n'
            && lexer->lookahead != '^'
            && !lexer->eof(lexer)) {
            if (lexer->lookahead == '|') {
                // dap|>
                //   ^
                lexer->result_symbol = STRING;
                lexer->mark_end(lexer);
                lexer->advance(lexer, false);
                // dap|>
                //   *^
                if (lexer->lookahead == '>') {
                    return next_string.size > 0;
                } else {
                    lexer->mark_end(lexer);
                }
            } else if (lexer->lookahead == '%'
                || lexer->lookahead == '&'
                || lexer->lookahead == '$'
                || lexer->lookahead == '@'
            ) {
                lexer->result_symbol = STRING;
                return true;
            }

            array_push(&next_string, lexer->lookahead);
            lexer->advance(lexer, false);
            // if (end_marked) {
            //     lexer->mark_end(lexer);
            // }
        }
    }
    return false;
}
