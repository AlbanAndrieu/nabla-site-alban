# —— Inspired by ———————————————————————————————————————————————————————————————
# https://www.strangebuzz.com/en/snippets/the-perfect-makefile-for-symfony

# Setup ————————————————————————————————————————————————————————————————————————

# Parameters
SHELL         = bash
ME            = $(shell whoami)

PORT          = 8091
NUMPROC := $(shell grep -c ^processor /proc/cpuinfo)
# Only take half as many processors as available
NPROC := $(shell echo "$(NUMPROC)/2"|bc)
NPROC := 1

# Image
APP_NAME     = nabla-site-alban
OCI_REGISTRY = github.com/AlbanAndrieu/nabla-site-bababou
AWS_REGION   = eu-west-3
OCI_IMAGE := $(OCI_REGISTRY)/$(APP_NAME)
OCI_TAG := $${OCI_TAG:-"1.2.3"}
IMAGE_NEXT_TAG := $${OCI_IMAGE_TAG:-"latest"}
IMAGE := $(OCI_IMAGE):$(OCI_TAG)

TRIVY_VULN_TYPE = "os,library"
TRIVY_SECURITY_CHECKS = "vuln,config,secret"
TRIVY_GLOBAL_SECURITY_CHECKS = --security-checks ${TRIVY_SECURITY_CHECKS} --vuln-type ${TRIVY_VULN_TYPE}
TRIVY_ARGS = --skip-dirs .direnv --skip-dirs .venv --skip-dirs ./node_modules --skip-dirs /usr/local/lib/python3.12/dist-packages/ansible/galaxy/ --skip-dirs /home/ubuntu/.local/lib/python3.12/site-packages/awscli/ --skip-dirs /home/ubuntu/.local/share/virtualenvs/ --skip-dirs /home/ubuntu/.local/lib/python3.12/site-packages/rsa/ --skip-dirs /home/ubuntu/.local/lib/python3.12/site-packages/botocore/data/ --skip-dirs /usr/lib/node_modules/ --skip-files /usr/local/bin/container-structure-test
CS_SEVERITY_REPORT_THRESHOLD = "HIGH,CRITICAL"

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD   ?= sphinx-build
SOURCEDIR     = docs/source
BUILDDIR      = build

# Executables: local only
# DOCKER        = docker

GIT_BRANCH = $$(git symbolic-ref --short HEAD)
DOCKER_COMPOSE_UP = "export GIT_BRANCH=$(GIT_BRANCH) && docker-compose up"
DOCKER_COMPOSE_DOWN = "export GIT_BRANCH=$(GIT_BRANCH) && docker-compose down"
DOCKER_RUN = "export GIT_BRANCH=$(GIT_BRANCH) && docker-compose run"

# Misc
.DEFAULT_GOAL = build
.PHONY       =  # Not needed here, but you can put your all your targets to be sure
	            # there is no name conflict between your files and your targets.

## —— 🐝 The Strangebuzz Docker Makefile 🐝 ———————————————————————————————————

_welcome: ## Print a Welcome screen
	curl -s https://raw.githubusercontent.com/AlbanAndrieu/AlbanAndrieu/master/welcome.txt

.PHONY: help Makefile
help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile
# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

prepare-pipenv:
	@echo "Setting up pipenv and installing packages"
	@which pipenv || python3 -m pip install pipenv
	@python -m pipenv install --dev --site-packages

## —— All 🎵 ———————————————————————————————————————————————————————————————
.PHONY: all
all: down clean build up test

## —— Clean Docker 🧹🐳💩 ———————————————————————————————————————————————————————————————
.PHONY: clean-docker
clean-docker:
	@echo "=> Cleaning image..."
	@docker rmi $(IMAGE)

## —— Clean Docker Docker 🧹🐳💩 ———————————————————————————————————————————————————————————————
.PHONY: clean-docker-compose
clean-docker-compose:
	@echo "Cleaning things up..."
	@"$(DOCKER_COMPOSE_DOWN)" -v
	@docker system prune -f

## —— Clean 🧹 ———————————————————————————————————————————————————————————————
.PHONY: clean
clean: clean-docker-compose clean-docker

## —— Formating 🧪🔗 ———————————————————————————————————————————————————————————————
.PHONY: fmt
fmt: ## Run formating
	@echo "=> Executing formating..."
	shfmt -i 2 -ci -w *.sh || true

## —— Docker 🐳 ————————————————————————————————————————————————————————————————
.PHONY: build-docker
build-docker:  ## Build container with docker
	@echo "=> Building image..."
	docker build --secret id=CI_JOB_TOKEN,env=CI_PIP_NABLA_TOKEN --secret id=read-npm-token,env=CI_JOB_TOKEN --build-arg ENV=dev -t $(IMAGE) .

## —— Pdf 🤖 ————————————————————————————————————————————————————————————————
.PHONY: build-pdf
build-pdf:  ## Build with latex
	@echo "=> Building latex..."
	latexmk -pdflua ./public/cv/cv-aandrieu-2026-*.tex -aux-directory=./public/cv -output-directory=./public/cv

## —— Build 🚀 —————————————————————————————————————————————————————————————————
.PHONY: build
build: build-pdf

## —— Up Docker ✅🐳 —————————————————————————————————————————————————————————————————
.PHONY: up-docker
up-docker:
	@echo "up docker"
	docker run -it $(IMAGE)

## —— Up ✅ —————————————————————————————————————————————————————————————————
.PHONY: up
up: up-gunicorn # Serve up (gunicorn)

.PHONY: down
down:
	@echo "down"

.PHONY: run
run: down up

## —— Doc 📜 —————————————————————————————————————————————————————————————————
.PHONY: doc
doc: ## Documentation
	@echo "=> Doc..."
	@sphinx-build ./docs/source _build --color -W -bhtml

## —— Lint 🧪 —————————————————————————————————————————————————————————————————
.PHONY: ruff
ruff: ## Linter ruff
	@echo "=> Linter flake8..."
	flake8 ./nabla/ tests  --config .flake8 --count --exit-zero --max-line-length=88 --max-complexity=12 --statistics
	@echo "=> Linter ruff..."
	@ruff format

## —— Debug 📜🐳 —————————————————————————————————————————————————————————————————
.PHONY: debug
debug: ## Enter container
	@echo "=> Debuging image..."
	@echo "docker run -it -u 0 --entrypoint /bin/bash --env CI_PIP_NABLA_TOKEN=$${CI_PIP_NABLA_TOKEN} --env CI_JOB_TOKEN=$${CI_JOB_TOKEN} $(IMAGE)"
	docker run -it --entrypoint /bin/bash --env CI_PIP_NABLA_TOKEN=$${CI_PIP_NABLA_TOKEN} --env CI_JOB_TOKEN=$${CI_JOB_TOKEN} $(IMAGE)

## —— Project 🐝🐳 ———————————————————————————————————————————————————————————————
.PHONY: start
start: ## Run container
	@echo "=> Executing image..."
	docker run -it -v /var/run/docker.sock:/var/run/docker.sock $(IMAGE)

## —— Tests 🧪 —————————————————————————————————————————————————————————————————
.PHONY: test
test: test-semgrep

## —— Deploy Docker 💾🐳 ———————————————————————————————————————————————————————————————
.PHONY: deploy-docker
deploy-docker: ## Push
	@echo "=> Tagging image..."
	docker tag $(IMAGE) $(OCI_IMAGE):$(IMAGE_NEXT_TAG)
	@echo "=> Pushing image..."
	@echo "=> By Hand 👊 => docker push $(OCI_IMAGE):$(IMAGE_NEXT_TAG)"
	@echo "=> By Hand ✌ => docker push $(OCI_IMAGE):latest"

## —— Deploy 💾👑 ———————————————————————————————————————————————————————————————
.PHONY: deploy
deploy: deploy-docker ## Push to registry
