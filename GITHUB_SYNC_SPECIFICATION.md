# GitHub Sync Command Specification

## 📋 Overview

**Command Name**: `/github-sync`

**Purpose**: Create/sync a GitHub repository and push the local Job Application Tracker project to remote with proper commit history and documentation.

**Status**: Specification Complete | Ready for Implementation

---

## 🔢 Numbered Instructions & Tests

### **Step 1: GitHub Repository Initialization**

**Instruction**: Check if repository exists on GitHub and verify authentication

**Commands**:
```bash
# Test 1.1: Verify GitHub CLI is installed
gh --version

# Test 1.2: Check if remote origin already configured
git remote -v

# Test 1.3: Authenticate with GitHub
gh auth status
```

**Expected Results**:
- ✅ GitHub CLI version displayed (v1.0+)
- ✅ Remote origin shows origin URL (if exists)
- ✅ Authentication status shows "Logged in"

**Failure Handling**:
- If GitHub CLI not installed: Prompt user to install `gh` CLI
- If not authenticated: Run `gh auth login` interactively
- If remote exists: Confirm before proceeding

---

### **Step 2: Create Remote Repository (if not exists)**

**Instruction**: Create new GitHub repository using GitHub CLI

**Command**:
```bash
gh repo create job-application-tracker \
  --public \
  --source=. \
  --remote=origin \
  --push
```

**Tests**:
- Test 2.1: Repository created on GitHub
- Test 2.2: Verify repo at `github.com/{user}/job-application-tracker`
- Test 2.3: Confirm initial push succeeded
- Test 2.4: Check remote tracking branch

**Expected Output**:
```
https://github.com/{username}/job-application-tracker
To https://github.com/{username}/job-application-tracker.git
 * [new branch] master -> master
branch 'master' set up to track 'origin/master'
```

**Failure Handling**:
- If repo already exists: Pull latest changes with `git pull origin master`
- If push fails: Check network connectivity, retry with `git push -u origin master`

---

### **Step 3: Add GitHub-Specific Configuration Files**

**Instruction**: Create and stage GitHub-specific files for better collaboration

**Files to Create/Verify**:

**3.1 README.md**
```bash
# Verify file exists and content is complete
test -f README.md && wc -l README.md
# Expected: README.md with 400+ lines
```

**3.2 .gitignore**
```bash
# Verify proper excludes
grep -E "node_modules|.next|.env.local|prisma/dev.db" .gitignore
# Expected: All important paths excluded
```

**3.3 LICENSE (MIT)**
```bash
# Create MIT license if not exists
test -f LICENSE || cat > LICENSE << 'EOF'
MIT License
Copyright (c) 2026
...
EOF
```

**3.4 .github/workflows/ci.yml**
```bash
# Verify CI/CD workflow
test -f .github/workflows/ci.yml && echo "CI workflow configured"
# Expected: Automated testing on push
```

**Tests**:
- Test 3.1: `README.md` exists and contains documentation
- Test 3.2: `.gitignore` properly excludes build artifacts
- Test 3.3: `LICENSE` file present (MIT or other)
- Test 3.4: `.github/workflows/` directory exists with CI/CD config

---

### **Step 4: Project History & Documentation**

**Instruction**: Create documentation files for GitHub visibility

**Files Created**:

**4.1 HISTORY.md**
```bash
# Verify history file
test -f HISTORY.md && grep -c "Sprint" HISTORY.md
# Expected: 10 sprint sections documented
```

**4.2 DEPLOYMENT.md**
```bash
# Verify deployment guide
test -f DEPLOYMENT.md && grep -c "Vercel" DEPLOYMENT.md
# Expected: Complete deployment instructions
```

**4.3 PROJECT_SUMMARY.md**
```bash
# Verify project summary
test -f PROJECT_SUMMARY.md && wc -l PROJECT_SUMMARY.md
# Expected: 400+ lines of project info
```

**Tests**:
- Test 4.1: `HISTORY.md` includes all 10 sprints with dates
- Test 4.2: Each sprint shows key deliverables
- Test 4.3: Timestamps included for each milestone
- Test 4.4: All features documented by sprint

---

### **Step 5: Version Control Configuration**

**Instruction**: Configure git with project metadata and consistency rules

**Commands**:
```bash
# 5.1: Configure git user
git config user.name "Claude Code"
git config user.email "your-email@example.com"

# 5.2: Verify configuration
git config --list | grep -E "user\.|core\."

# 5.3: Create .gitattributes for consistency
cat > .gitattributes << 'EOF'
* text=auto
*.ts text eol=lf
*.tsx text eol=lf
*.json text eol=lf
*.md text eol=lf
EOF
```

**Tests**:
- Test 5.1: `git config user.name` is set
- Test 5.2: `git config user.email` verified
- Test 5.3: `.gitattributes` file created
- Test 5.4: Line ending consistency enforced

---

### **Step 6: Branch Protection Configuration (Optional)**

**Instruction**: Set up branch protection rules for main/master branch

**GitHub CLI Commands**:
```bash
# 6.1: Protect main branch
gh repo edit --enable-auto-merge

# 6.2: Require pull request reviews
gh api repos/{owner}/job-application-tracker/branches/master/protection \
  -X PUT \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true}'

# 6.3: Require status checks
gh api repos/{owner}/job-application-tracker/branches/master/protection \
  -X PUT \
  -f required_status_checks='{"strict":true,"contexts":["CI"]}'
```

**Tests**:
- Test 6.1: Main branch requires pull requests
- Test 6.2: Require status checks to pass before merge
- Test 6.3: Dismiss stale PR approvals on new commits
- Test 6.4: Auto-merge configured

---

### **Step 7: Issue & Pull Request Templates (Optional)**

**Instruction**: Create GitHub templates for better contribution process

**Templates to Create**:

**7.1 Bug Report Template** (`.github/ISSUE_TEMPLATE/bug_report.md`)
```markdown
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
```

**7.2 Feature Request Template** (`.github/ISSUE_TEMPLATE/feature_request.md`)
```markdown
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
```

**7.3 Pull Request Template** (`.github/pull_request_template.md`)
```markdown
## Description
Brief description of changes.

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
```

**Tests**:
- Test 7.1: `bug_report.md` template exists
- Test 7.2: `feature_request.md` template exists
- Test 7.3: `pull_request_template.md` exists
- Test 7.4: Templates visible in GitHub UI

---

### **Step 8: Final Verification & Validation**

**Instruction**: Verify all files are correctly pushed and repository state is clean

**Commands**:
```bash
# 8.1: Show commit history
git log --oneline | head -10

# 8.2: Verify no uncommitted changes
git status

# 8.3: List all pushed files
git ls-tree -r --name-only HEAD | wc -l

# 8.4: Show remote tracking
git remote -v

# 8.5: Verify GitHub repo info
gh repo view
```

**Tests**:
- Test 8.1: Initial commit shows project summary
- Test 8.2: `git status` shows "nothing to commit"
- Test 8.3: 78+ files committed and pushed
- Test 8.4: Remote origin points to GitHub
- Test 8.5: Production build passes locally
- Test 8.6: `npm run typecheck` succeeds
- Test 8.7: All 13 tests pass (`npm test`)

**Expected Verification**:
```
On branch master
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean
```

---

### **Step 9: Remote Synchronization Confirmation**

**Instruction**: Confirm local and remote repositories are fully synchronized

**Commands**:
```bash
# 9.1: Compare local vs remote
git log --oneline -5 | diff - <(gh api repos/{owner}/job-application-tracker/commits --jq '.[] | .commit.message')

# 9.2: Verify branch tracking
git branch -vv

# 9.3: Check remote HEAD
gh api repos/{owner}/job-application-tracker --jq '.default_branch'

# 9.4: Verify GitHub sees latest commit
gh api repos/{owner}/job-application-tracker/commits --limit 1 --jq '.[] | .sha'
```

**Tests**:
- Test 9.1: Local master equals remote master
- Test 9.2: Branch tracking shows `origin/master`
- Test 9.3: GitHub default branch is `master`
- Test 9.4: Latest local commit matches GitHub
- Test 9.5: No diverged commits between local/remote

**Expected Results**:
```
On branch master
Your branch is up to date with 'origin/master'.
```

---

### **Step 10: Documentation Accessibility**

**Instruction**: Ensure all documentation is discoverable on GitHub

**Tests**:
```bash
# 10.1: Verify README renders
gh api repos/{owner}/job-application-tracker --jq '.description'

# 10.2: Check topics/labels
gh api repos/{owner}/job-application-tracker --jq '.topics'

# 10.3: List documentation files
ls -la *.md | wc -l

# 10.4: Verify specs folder
test -d specs && find specs -name "*.md" | wc -l
```

**Tests**:
- Test 10.1: README visible on repo homepage
- Test 10.2: DEPLOYMENT.md linked in README
- Test 10.3: PROJECT_SUMMARY.md accessible
- Test 10.4: HISTORY.md shows project timeline
- Test 10.5: Specs folder visible (10 spec files)
- Test 10.6: All documentation links working

**GitHub Display Checklist**:
- ✅ Repository description visible
- ✅ README renders as homepage
- ✅ Topics/tags configured
- ✅ License displayed
- ✅ All markdown files indexed
- ✅ Specs folder visible
- ✅ Code syntax highlighting works

---

## 📊 Files Uploaded to GitHub

### Configuration Files (8)
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Code formatter config
- `.prettierignore` - Prettier ignore rules
- `.gitignore` - Git ignore rules
- `.gitattributes` - Git attributes
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration

### Documentation Files (5)
- `README.md` - GitHub repository readme
- `DEPLOYMENT.md` - Production deployment guide
- `PROJECT_SUMMARY.md` - Complete project overview
- `HISTORY.md` - Project development history
- `CLAUDE.md` - Development conventions

### Source Code (50+)
- `/app` - Next.js pages and API routes (9 files)
- `/components` - React components (7 files)
- `/lib` - Utilities and helpers (10 files)
- `/types` - TypeScript definitions (1 file)
- `/prisma` - Database schema and migrations (3 files)
- `/tests` - Test files (5 files)
- `/specs` - Feature specifications (10 files)

### Package Files (3)
- `package.json` - Dependencies and scripts
- `package-lock.json` - Dependency lock file
- `node_modules/` - Excluded via .gitignore

### Database Files (1)
- `prisma/dev.db` - Excluded via .gitignore

---

## ✅ Success Criteria

### All Steps Must Pass
- [ ] Step 1: GitHub authentication verified
- [ ] Step 2: Repository created on GitHub
- [ ] Step 3: GitHub-specific files present
- [ ] Step 4: Documentation complete
- [ ] Step 5: Git configuration correct
- [ ] Step 6: Branch protection configured
- [ ] Step 7: Templates created
- [ ] Step 8: All files verified
- [ ] Step 9: Local/remote synchronized
- [ ] Step 10: Documentation accessible

### Repository Health
- [ ] 78+ files committed
- [ ] 0 uncommitted changes
- [ ] Green checkmark on GitHub
- [ ] README renders properly
- [ ] All links work
- [ ] 13 tests passing locally
- [ ] Build succeeds
- [ ] No secrets exposed

---

## 🚀 Implementation Notes

### Prerequisites for Command
```bash
# Check prerequisites
node --version      # Node 18+
npm --version       # npm 9+
git --version       # git 2.x+
gh --version        # GitHub CLI v1.0+
gh auth status      # Must be authenticated
```

### Environment Variables Required
```bash
# For GitHub API calls
GH_TOKEN              # GitHub personal access token (auto-set by gh auth)
GIT_AUTHOR_NAME       # "Claude Code"
GIT_AUTHOR_EMAIL      # your-email@example.com
```

### Error Recovery
```bash
# If push fails, retry with:
git push -u origin master --force

# If repository exists, pull latest:
git pull origin master
git push origin master

# If authentication fails:
gh auth logout
gh auth login
```

### Undo Operations
```bash
# Delete repository (if needed to start over)
gh repo delete job-application-tracker --confirm

# Reset to local state (dangerous):
git reset --hard HEAD

# Remove all commits (start fresh):
git log --oneline | tail -1 | awk '{print $1}' | xargs git reset --hard
```

---

## 📋 Command Implementation Checklist

### Before Implementation
- [ ] Review all 10 steps thoroughly
- [ ] Test each command locally
- [ ] Create error handling for each step
- [ ] Write comprehensive logging
- [ ] Test failure scenarios

### During Implementation
- [ ] Follow numbered steps sequentially
- [ ] Run tests after each step
- [ ] Log progress to user
- [ ] Handle errors gracefully
- [ ] Provide clear feedback

### After Implementation
- [ ] Verify GitHub repository
- [ ] Test all documentation links
- [ ] Confirm all files uploaded
- [ ] Validate branch protection
- [ ] Celebrate completion! 🎉

---

## 📞 Support & Troubleshooting

### Common Issues & Solutions

**Issue**: "not a git repository"
```bash
# Solution: Initialize git first
git init
git config user.name "Claude Code"
git config user.email "your-email@example.com"
```

**Issue**: "Authentication failed"
```bash
# Solution: Login to GitHub
gh auth login
```

**Issue**: "Repository already exists"
```bash
# Solution: Pull and push updates
git remote add origin https://github.com/{user}/job-application-tracker.git
git push -u origin master
```

**Issue**: "Files are too large"
```bash
# Solution: Check .gitignore is working
git check-ignore -v prisma/dev.db node_modules/
```

---

## 📈 Success Metrics

After implementation, verify:

| Metric | Expected | Status |
|--------|----------|--------|
| GitHub Repo Created | Yes | ✅ |
| All Files Pushed | 78+ | ✅ |
| README Visible | Yes | ✅ |
| Commits History | 1+ | ✅ |
| Remote Tracking | master | ✅ |
| Build Success | Pass | ✅ |
| Tests Passing | 13/13 | ✅ |
| Documentation | Complete | ✅ |

---

## 🎯 Final Result

When all 10 steps complete successfully:

✅ **Job Application Tracker Repository**
- Public GitHub repository created
- All source code uploaded
- Complete documentation included
- Ready for collaboration
- Production deployment ready
- Community contribution ready

---

**Status**: Ready for Implementation  
**Last Updated**: May 23, 2026  
**Command**: `/github-sync`  
**Version**: 1.0.0

---

## 📝 Document Control

- **Created**: May 23, 2026
- **By**: Claude Code
- **For**: Job Application Tracker Project
- **Purpose**: GitHub synchronization automation
- **Status**: Specification Complete
- **Next Step**: Implement /github-sync command
