# TEX = pdflatex
# TEX_OPTS = -shell-escape -interaction=nonstopmode -file-line-error
TEX = latexmk -pdflua
TEX_OPTS = -pdflua
BIB = bibtex
OPEN = xdg-open
MAX_TRY = 5

### All standalone CV LaTeX sources in this directory
TEX_MAIN := $(sort $(wildcard cv-aandrieu-*.tex))

### Files that are included (producing .aux file)
INCLUDED_FILES =

### Files that are included/input (not producing .aux file)
OTHER_FILES =

### Default PDF for view (after `make pdf`)
VIEW_PDF = cv-aandrieu-2026-en.pdf

### Files that are not  included/input but should be in the distribution
EXTRA_DIST = \
	Makefile \
	alban-andrieu-19-12-2017.png

VERSION = $(shell git describe --always --dirty)
DIST = cv-src-$(VERSION).tar.gz

PDFS = $(TEX_MAIN:.tex=.pdf)
DONES = $(TEX_MAIN:.tex=.done)

# One line so checkmake does not treat tab-indented continuations as recipe lines.
DIRTY_FILES := $(foreach m,$(TEX_MAIN),$(m:.tex=.aux) $(m:.tex=.bbl) $(m:.tex=.blg) $(m:.tex=.done) $(m:.tex=.lof) $(m:.tex=.lot) $(m:.tex=.out) $(m:.tex=.toc))

NEED_RUN_MSG_REGEX=\(Rerun to get citations correct\)

.PHONY: all pdf view clean clean-all dist test $(PDFS)
.SUFFIX: .tex .aux .bbl .pdf .done

all: pdf

pdf: $(PDFS)

view: pdf
	$(OPEN) '$(VIEW_PDF)'

dist: $(DIST)

clean:
	rm -f *~ */*~ $(DIRTY_FILES) $(DIST)

clean-all: clean
	rm -f $(PDFS)

$(DONES): %.done: %.tex $(EXTRA_DIST)
	CPT=0; while [ $$CPT -lt $(MAX_TRY) ] && $(TEX) $(TEX_OPTS) "$<" && grep -q "$(NEED_RUN_MSG_REGEX)" "$(<:.tex=.log)"; do CPT=$$((CPT+1)); done
	touch "$@"

$(PDFS): %.pdf: %.done

## —— Build 🚀 —————————————————————————————————————————————————————————————————
$(DIST): $(TEX_MAIN) $(EXTRA_DIST)
	tar -czf "$@" $(TEX_MAIN) $(EXTRA_DIST)

test: $(PDFS)
	set -e; for p in $(PDFS); do test -f "$$p"; done
