package tree_sitter_tup_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-tup"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_tup.Language())
	if language == nil {
		t.Errorf("Error loading Tup grammar")
	}
}
