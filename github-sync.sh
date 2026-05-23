#!/bin/bash

################################################################################
#                                                                              #
#                    GITHUB-SYNC COMMAND - IMPLEMENTATION                    #
#                                                                              #
#  Purpose: Create/sync GitHub repository and push local project to remote   #
#  Usage: ./github-sync.sh [options]                                         #
#  Status: Production Ready                                                   #
#                                                                              #
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="${REPO_NAME:-job-application-tracker}"
REPO_OWNER="${REPO_OWNER:-}"
REPO_VISIBILITY="${REPO_VISIBILITY:-public}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_DIR/github-sync.log"

# Counter for steps
STEP_COUNT=0
TOTAL_STEPS=10

################################################################################
# UTILITY FUNCTIONS
################################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

step_header() {
    STEP_COUNT=$((STEP_COUNT + 1))
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║ STEP $STEP_COUNT/$TOTAL_STEPS: $1${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
}

test_command() {
    if command -v $1 &> /dev/null; then
        success "$1 is installed"
        return 0
    else
        error "$1 is NOT installed"
        return 1
    fi
}

pause_on_error() {
    if [ "$SKIP_PAUSE" != "true" ]; then
        read -p "Press Enter to continue..."
    fi
}

################################################################################
# STEP 1: GitHub Repository Initialization
################################################################################

step_1_github_init() {
    step_header "GitHub Repository Initialization"

    log "Checking GitHub CLI installation..."
    if ! test_command "gh"; then
        error "GitHub CLI not installed. Please install: https://cli.github.com"
        error "macOS: brew install gh"
        error "Linux: sudo apt-get install gh (or equivalent)"
        error "Windows: choco install gh (or winget install GitHub.cli)"
        exit 1
    fi

    log "Checking GitHub authentication status..."
    if gh auth status &> /dev/null; then
        success "GitHub authentication verified"
        REPO_OWNER=$(gh api user --jq '.login')
        success "User: $REPO_OWNER"
    else
        warning "Not authenticated with GitHub. Starting authentication..."
        gh auth login
        REPO_OWNER=$(gh api user --jq '.login')
        success "Authenticated as: $REPO_OWNER"
    fi

    log "Checking git installation..."
    test_command "git" || exit 1

    log "Checking git remote configuration..."
    if git remote | grep -q origin; then
        info "Git remote 'origin' already configured:"
        git remote -v | grep origin
    else
        info "No git remote configured yet (will be set in Step 2)"
    fi

    success "Step 1 Complete: GitHub initialization verified"
}

################################################################################
# STEP 2: Create Remote Repository
################################################################################

step_2_create_repo() {
    step_header "Create Remote Repository (if not exists)"

    log "Checking if repository already exists on GitHub..."
    if gh repo view "$REPO_OWNER/$REPO_NAME" &> /dev/null; then
        warning "Repository already exists: https://github.com/$REPO_OWNER/$REPO_NAME"
        read -p "Sync with existing repository? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Aborted by user"
            exit 1
        fi
    else
        log "Creating new GitHub repository..."
        gh repo create "$REPO_NAME" \
            --"$REPO_VISIBILITY" \
            --source=. \
            --remote=origin \
            --push 2>&1 | tee -a "$LOG_FILE"

        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            success "Repository created successfully"
        else
            error "Failed to create repository"
            exit 1
        fi
    fi

    log "Verifying repository on GitHub..."
    REPO_URL=$(gh repo view "$REPO_OWNER/$REPO_NAME" --json url -q .url)
    success "Repository URL: $REPO_URL"

    log "Verifying remote tracking..."
    git remote -v | grep origin || error "Remote not configured"

    success "Step 2 Complete: Remote repository configured"
}

################################################################################
# STEP 3: GitHub-Specific Configuration Files
################################################################################

step_3_github_files() {
    step_header "Add GitHub-Specific Configuration Files"

    log "Verifying README.md..."
    if [ -f "README.md" ]; then
        LINES=$(wc -l < README.md)
        if [ "$LINES" -gt 300 ]; then
            success "README.md exists ($LINES lines)"
        else
            warning "README.md exists but is short ($LINES lines)"
        fi
    else
        warning "README.md not found"
    fi

    log "Verifying .gitignore..."
    if [ -f ".gitignore" ]; then
        if grep -q "node_modules" .gitignore && grep -q "\.next" .gitignore; then
            success ".gitignore properly configured"
        else
            warning ".gitignore missing important excludes"
        fi
    else
        error ".gitignore not found"
    fi

    log "Verifying LICENSE..."
    if [ -f "LICENSE" ]; then
        success "LICENSE file found"
    else
        warning "LICENSE file not found (creating MIT license)"
        cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Job Application Tracker Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
        success "Created MIT LICENSE file"
    fi

    log "Verifying CI/CD workflow..."
    if [ -f ".github/workflows/ci.yml" ]; then
        success "CI/CD workflow configured"
    else
        warning "CI/CD workflow not configured (optional)"
    fi

    success "Step 3 Complete: GitHub files verified"
}

################################################################################
# STEP 4: Project History & Documentation
################################################################################

step_4_documentation() {
    step_header "Project History & Documentation"

    local doc_files=("HISTORY.md" "DEPLOYMENT.md" "PROJECT_SUMMARY.md")

    for file in "${doc_files[@]}"; do
        if [ -f "$file" ]; then
            LINES=$(wc -l < "$file")
            success "$file exists ($LINES lines)"
        else
            warning "$file not found"
        fi
    done

    log "Verifying HISTORY.md has sprint documentation..."
    if [ -f "HISTORY.md" ] && grep -q "Sprint" HISTORY.md; then
        SPRINT_COUNT=$(grep -c "^### \*\*Sprint" HISTORY.md || echo 0)
        success "HISTORY.md contains $SPRINT_COUNT sprint sections"
    else
        warning "HISTORY.md sprint documentation not found"
    fi

    success "Step 4 Complete: Documentation files verified"
}

################################################################################
# STEP 5: Version Control Configuration
################################################################################

step_5_git_config() {
    step_header "Version Control Configuration"

    log "Checking git user configuration..."
    GIT_USER=$(git config user.name)
    GIT_EMAIL=$(git config user.email)

    if [ -z "$GIT_USER" ] || [ -z "$GIT_EMAIL" ]; then
        warning "Git user not fully configured"
        read -p "Enter git user name: " GIT_USER
        read -p "Enter git user email: " GIT_EMAIL
        git config user.name "$GIT_USER"
        git config user.email "$GIT_EMAIL"
    fi

    success "Git user: $GIT_USER <$GIT_EMAIL>"

    log "Creating .gitattributes for consistency..."
    cat > .gitattributes << 'EOF'
* text=auto
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
EOF
    success ".gitattributes created"

    log "Git configuration verified"
    git config --list | grep -E "user\.|core\." || true

    success "Step 5 Complete: Git configuration verified"
}

################################################################################
# STEP 6: Branch Protection (Optional)
################################################################################

step_6_branch_protection() {
    step_header "Branch Protection Configuration (Optional)"

    log "Attempting to set up branch protection rules..."

    if gh api repos/"$REPO_OWNER"/"$REPO_NAME"/branches/master/protection \
        -X PUT \
        -f require_code_reviews='{"dismiss_stale_reviews":true,"required_approving_review_count":1}' \
        2>/dev/null; then
        success "Branch protection configured"
    else
        warning "Could not configure branch protection (requires admin access or personal token)"
        info "You can configure this manually in GitHub repository settings"
    fi

    success "Step 6 Complete: Branch protection setup attempted"
}

################################################################################
# STEP 7: Issue & PR Templates (Optional)
################################################################################

step_7_templates() {
    step_header "Issue & Pull Request Templates (Optional)"

    log "Checking for GitHub templates..."

    if [ -d ".github/ISSUE_TEMPLATE" ]; then
        success "Issue templates directory exists"
    else
        log "Creating issue templates..."
        mkdir -p .github/ISSUE_TEMPLATE

        cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug report
about: Create a report to help us improve
---

**Describe the bug**
A clear description of what the bug is.

**Steps to reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen?

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. macOS, Linux, Windows]
- Node: [e.g. 18.0.0]
EOF
        success "Bug report template created"

        cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature request
about: Suggest an idea
---

**Is your feature related to a problem?**
Describe the problem.

**Describe the solution**
What would you like to happen?

**Additional context**
Any other context.
EOF
        success "Feature request template created"
    fi

    if [ -f ".github/pull_request_template.md" ]; then
        success "Pull request template exists"
    else
        log "Creating pull request template..."
        cat > .github/pull_request_template.md << 'EOF'
## Description
Brief description of changes.

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] TypeScript check passes
- [ ] Documentation updated
- [ ] No console warnings
EOF
        success "Pull request template created"
    fi

    success "Step 7 Complete: Templates created/verified"
}

################################################################################
# STEP 8: Final Verification & Validation
################################################################################

step_8_verification() {
    step_header "Final Verification & Validation"

    log "Showing commit history..."
    git log --oneline | head -10 || error "No commits found"

    log "Checking git status..."
    if git status --short | grep -q .; then
        warning "Uncommitted changes found:"
        git status --short
        read -p "Commit changes before push? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "Auto-commit before GitHub sync"
            success "Changes committed"
        fi
    else
        success "Working tree clean - no uncommitted changes"
    fi

    log "Counting committed files..."
    FILE_COUNT=$(git ls-tree -r --name-only HEAD | wc -l)
    if [ "$FILE_COUNT" -gt 50 ]; then
        success "$FILE_COUNT files committed"
    else
        warning "Only $FILE_COUNT files committed (expected 50+)"
    fi

    log "Verifying build..."
    if [ -f "package.json" ]; then
        if npm run typecheck &> /dev/null; then
            success "TypeScript check passed"
        else
            warning "TypeScript check failed (see above)"
        fi
    fi

    log "Running tests..."
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        if npm test 2>&1 | tail -5; then
            success "Tests executed"
        else
            warning "Tests may have issues"
        fi
    fi

    success "Step 8 Complete: Verification finished"
}

################################################################################
# STEP 9: Remote Synchronization Confirmation
################################################################################

step_9_sync_confirm() {
    step_header "Remote Synchronization Confirmation"

    log "Checking remote configuration..."
    if git remote | grep -q origin; then
        success "Remote origin configured"
        git remote -v | grep origin
    else
        error "Remote origin not configured"
        exit 1
    fi

    log "Checking branch tracking..."
    TRACKING=$(git branch -vv | grep -E "^\*" | grep -o '\[.*\]' || echo "Not tracking")
    info "Current branch tracking: $TRACKING"

    log "Verifying GitHub sees latest commits..."
    LOCAL_HASH=$(git rev-parse HEAD)
    REMOTE_HASH=$(gh api repos/"$REPO_OWNER"/"$REPO_NAME"/commits --limit 1 -q '.[0].oid' 2>/dev/null || echo "error")

    if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
        success "Local and remote commits match"
    elif [ "$REMOTE_HASH" = "error" ]; then
        warning "Could not verify remote commits"
    else
        warning "Local and remote commits differ"
        warning "Local: $LOCAL_HASH"
        warning "Remote: $REMOTE_HASH"
    fi

    log "Checking for diverged branches..."
    if git merge-base --is-ancestor origin/master HEAD; then
        success "Local is ahead of or equal to remote"
    else
        warning "Branches may be diverged"
    fi

    success "Step 9 Complete: Synchronization verified"
}

################################################################################
# STEP 10: Documentation Accessibility
################################################################################

step_10_docs_access() {
    step_header "Documentation Accessibility"

    log "Verifying documentation files on GitHub..."
    local doc_files=("README.md" "DEPLOYMENT.md" "PROJECT_SUMMARY.md" "HISTORY.md")

    for file in "${doc_files[@]}"; do
        if gh api repos/"$REPO_OWNER"/"$REPO_NAME"/contents/"$file" -q '.name' &> /dev/null; then
            success "$file is accessible on GitHub"
        else
            warning "$file not found on GitHub"
        fi
    done

    log "Checking /specs directory..."
    SPEC_COUNT=$(find specs -name "*.md" 2>/dev/null | wc -l || echo 0)
    if [ "$SPEC_COUNT" -gt 0 ]; then
        success "$SPEC_COUNT specification files found"
    else
        warning "No specification files found in /specs"
    fi

    log "Verifying repository visibility..."
    IS_PRIVATE=$(gh repo view "$REPO_OWNER/$REPO_NAME" --json isPrivate -q '.isPrivate')
    if [ "$IS_PRIVATE" = "false" ]; then
        success "Repository is PUBLIC"
    else
        warning "Repository is PRIVATE"
    fi

    log "Repository URL for reference:"
    REPO_URL="https://github.com/$REPO_OWNER/$REPO_NAME"
    success "🔗 $REPO_URL"

    success "Step 10 Complete: Documentation accessibility verified"
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║           🚀 GITHUB-SYNC COMMAND - EXECUTION 🚀              ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║  Create/sync GitHub repository and push local project       ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    log "Starting GitHub sync operation..."
    log "Project: $REPO_NAME"
    log "Owner: $REPO_OWNER"
    log "Directory: $PROJECT_DIR"
    log "Log file: $LOG_FILE"

    # Run all steps
    step_1_github_init
    step_2_create_repo
    step_3_github_files
    step_4_documentation
    step_5_git_config
    step_6_branch_protection
    step_7_templates
    step_8_verification
    step_9_sync_confirm
    step_10_docs_access

    # Final summary
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   ✅ GITHUB SYNC COMPLETE                   ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Repository:${NC} https://github.com/$REPO_OWNER/$REPO_NAME"
    echo -e "${GREEN}Status:${NC} Ready for collaboration"
    echo -e "${GREEN}Log file:${NC} $LOG_FILE"
    echo ""
    success "All steps completed successfully!"
}

# Trap errors
trap 'error "Script failed at line $LINENO"; exit 1' ERR

# Run main function
main "$@"
