# GitHub-Sync Command - Usage Guide

## Overview

The `github-sync` command automates the entire process of creating/syncing a GitHub repository and pushing your local project to remote. It implements all 10 steps specified in `GITHUB_SYNC_SPECIFICATION.md`.

---

## Installation

### Option 1: Bash Script (Universal)

```bash
# Make executable
chmod +x github-sync.sh

# Run directly
./github-sync.sh
```

### Option 2: Node.js Script

```bash
# Make executable
chmod +x github-sync.js

# Run directly
./github-sync.js

# Or with Node
node github-sync.js
```

### Option 3: NPM Script (Recommended for projects)

Add to `package.json`:
```json
{
  "scripts": {
    "github-sync": "node github-sync.js"
  }
}
```

Then run:
```bash
npm run github-sync
```

---

## Prerequisites

### Required
- **Git** - Version control system
- **GitHub CLI** (`gh`) - GitHub command line tool
  - Install: https://cli.github.com
  - macOS: `brew install gh`
  - Linux: `sudo apt-get install gh`
  - Windows: `choco install gh` or `winget install GitHub.cli`

### Authentication
```bash
# Check if authenticated
gh auth status

# If not authenticated
gh auth login
```

### Node.js (for Node.js version only)
- Node.js 14+ 
- npm or yarn

---

## Usage

### Basic Usage (Bash)
```bash
./github-sync.sh
```

### Basic Usage (Node.js)
```bash
node github-sync.js
```

### With Environment Variables
```bash
# Bash
REPO_NAME=my-project REPO_OWNER=my-username ./github-sync.sh

# Node.js
REPO_NAME=my-project REPO_OWNER=my-username node github-sync.js
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REPO_NAME` | `job-application-tracker` | GitHub repository name |
| `REPO_OWNER` | Auto-detected | GitHub username/organization |
| `REPO_VISIBILITY` | `public` | Repository visibility (public/private) |
| `SKIP_PAUSE` | `false` | Skip pause prompts (true/false) |

---

## What It Does

### Step-by-Step Execution

#### **Step 1: GitHub Repository Initialization**
- Verifies GitHub CLI installation
- Checks GitHub authentication status
- Verifies git installation
- Confirms git remote configuration

**Output**:
```
✅ GitHub CLI is installed
✅ GitHub authentication verified
✅ User: dorbengoose
✅ Git is installed
```

#### **Step 2: Create Remote Repository**
- Checks if repository already exists
- Creates new repository if needed
- Configures remote origin
- Sets up push tracking

**Output**:
```
✅ Repository created successfully
✅ Repository URL: https://github.com/dorbengoose/job-application-tracker
```

#### **Step 3: GitHub-Specific Configuration**
- Verifies README.md
- Checks .gitignore
- Creates/verifies LICENSE file
- Checks CI/CD workflow configuration

**Output**:
```
✅ README.md exists (450 lines)
✅ .gitignore properly configured
✅ Created MIT LICENSE file
```

#### **Step 4: Project History & Documentation**
- Verifies HISTORY.md (sprint timeline)
- Checks DEPLOYMENT.md
- Confirms PROJECT_SUMMARY.md
- Validates sprint documentation

**Output**:
```
✅ HISTORY.md exists (650 lines)
✅ DEPLOYMENT.md exists (280 lines)
✅ PROJECT_SUMMARY.md exists (420 lines)
✅ HISTORY.md contains 10 sprint sections
```

#### **Step 5: Version Control Configuration**
- Configures git user name/email
- Creates .gitattributes for consistency
- Verifies git settings

**Output**:
```
✅ Git user: Claude Code <noreply@anthropic.com>
✅ .gitattributes created
```

#### **Step 6: Branch Protection (Optional)**
- Attempts to set up branch protection rules
- Requires pull requests for merges
- Enables status checks

**Output**:
```
✅ Branch protection configured
⚠️  Could not configure (requires admin access)
```

#### **Step 7: Issue & PR Templates (Optional)**
- Creates bug report template
- Creates feature request template
- Creates pull request template

**Output**:
```
✅ Bug report template created
✅ Feature request template created
✅ Pull request template created
```

#### **Step 8: Final Verification & Validation**
- Shows commit history
- Checks for uncommitted changes
- Counts committed files
- Verifies TypeScript and tests

**Output**:
```
ℹ️  Showing recent commits...
✅ Working tree clean
✅ 80 files committed
```

#### **Step 9: Remote Synchronization**
- Confirms remote is configured
- Verifies branch tracking
- Checks local/remote parity

**Output**:
```
✅ Remote origin configured
✅ Local and remote commits match
```

#### **Step 10: Documentation Accessibility**
- Verifies docs are on GitHub
- Confirms specs folder
- Displays repository URL

**Output**:
```
✅ README.md is accessible on GitHub
✅ DEPLOYMENT.md is accessible on GitHub
🔗 https://github.com/dorbengoose/job-application-tracker
```

---

## Examples

### Example 1: Sync Existing Project

```bash
# In your project directory
./github-sync.sh

# Output shows 10 steps completing...
# 🎉 GITHUB SYNC COMPLETE
```

### Example 2: Create New Repository

```bash
# Create repo with custom name
REPO_NAME=my-awesome-app ./github-sync.sh

# Creates GitHub repo and pushes local code
```

### Example 3: Private Repository

```bash
# Create as private
REPO_VISIBILITY=private ./github-sync.sh

# Repository created as private
```

### Example 4: Using NPM Script

```json
{
  "scripts": {
    "github-sync": "node github-sync.js"
  }
}
```

```bash
npm run github-sync
```

---

## Output & Logging

### Console Output
The command displays:
- ✅ Success messages in green
- ❌ Error messages in red
- ⚠️  Warning messages in yellow
- ℹ️  Info messages in cyan
- [timestamp] Log entries in blue

### Log File
All output is saved to:
```
./github-sync.log
```

View recent logs:
```bash
tail -f github-sync.log
```

---

## Error Handling & Recovery

### GitHub CLI Not Installed

**Error**:
```
❌ GitHub CLI not installed
```

**Solution**:
```bash
# macOS
brew install gh

# Linux
sudo apt-get install gh

# Windows
choco install gh
```

### Not Authenticated

**Error**:
```
❌ Not authenticated with GitHub
```

**Solution**:
```bash
gh auth login
# Follow prompts to authenticate
```

### Repository Already Exists

**Prompt**:
```
⚠️  Repository already exists
Sync with existing repository? (y/n)
```

**Response**:
- `y` - Sync with existing repo
- `n` - Cancel operation

### Push Failed

**Error**:
```
❌ Failed to push repository
```

**Solutions**:
```bash
# Check network connection
ping github.com

# Verify authentication
gh auth status

# Manual push
git push -u origin master

# Force push (use with caution)
git push -u origin master --force
```

### Uncommitted Changes

**Warning**:
```
⚠️  Uncommitted changes found
Commit changes before push? (y/n)
```

**Response**:
- `y` - Automatically commit changes
- `n` - Continue without committing

---

## Troubleshooting

### Check Current Status

```bash
# View git status
git status

# View remote configuration
git remote -v

# View GitHub repo info
gh repo view
```

### Verify Steps Manually

```bash
# Step 1: Check authentication
gh auth status

# Step 2: Verify remote
git remote -v

# Step 3: Check files
ls -la README.md .gitignore LICENSE

# Step 4: Check documentation
ls -la HISTORY.md DEPLOYMENT.md PROJECT_SUMMARY.md

# Step 5: Check git config
git config --list

# Step 8: Check commits
git log --oneline | head -10

# Step 10: Verify on GitHub
gh repo view --json url -q .url
```

### Debug Mode

```bash
# Bash - Set verbose output
bash -x github-sync.sh

# Node.js - Enable debug
DEBUG=* node github-sync.js
```

---

## Advanced Usage

### Custom Repository Owner

```bash
# For organization repositories
REPO_OWNER=my-org REPO_NAME=shared-project ./github-sync.sh
```

### Scripting/Automation

```bash
#!/bin/bash

# Automated sync in CI/CD
REPO_OWNER=${CI_USER} \
REPO_NAME=${CI_PROJECT} \
SKIP_PAUSE=true \
./github-sync.sh

# Check exit code
if [ $? -eq 0 ]; then
  echo "GitHub sync successful"
else
  echo "GitHub sync failed"
  exit 1
fi
```

### Integration with Other Tools

```bash
# Before deployment
./github-sync.sh && npm run build && npm run deploy

# In GitHub Actions
- name: Sync to GitHub
  run: ./github-sync.sh

# In pre-commit hook
#!/bin/bash
./github-sync.sh
```

---

## What Gets Uploaded

### Documentation
- README.md
- DEPLOYMENT.md
- PROJECT_SUMMARY.md
- HISTORY.md
- And more...

### Source Code
- All application files
- Configuration files
- Test files
- Database schema

### Configuration
- GitHub workflows
- ESLint, Prettier, TypeScript configs
- Environment templates

### Total
- 80+ files
- Complete project history
- All documentation
- Production-ready code

---

## Best Practices

### Before Running

1. **Verify Prerequisites**
   ```bash
   gh --version  # GitHub CLI installed
   git --version # Git installed
   gh auth status # Authenticated
   ```

2. **Check Status**
   ```bash
   git status    # No uncommitted changes
   git log -1    # Recent commits exist
   ```

3. **Test Build** (if applicable)
   ```bash
   npm run build     # Builds successfully
   npm test          # Tests pass
   ```

### During Execution

1. Review each step's output
2. Note any warnings
3. Handle prompts appropriately
4. Monitor the log file

### After Completion

1. Verify repository on GitHub
   ```bash
   open "https://github.com/$(gh api user -q .login)/$(git remote get-url origin | sed 's/.*\///' | sed 's/\.git//')"
   ```

2. Check that all files are uploaded
   ```bash
   gh repo view --json pushedAt
   ```

3. Review README visibility
   ```bash
   gh repo view
   ```

---

## FAQ

### Q: Can I run this multiple times?
**A:** Yes. The script checks if the repository exists and skips creation if it does.

### Q: What if I want a private repository?
**A:** Use `REPO_VISIBILITY=private ./github-sync.sh`

### Q: Does this delete anything locally?
**A:** No. The script only reads files and creates new ones. No local files are deleted.

### Q: Can I use this with private GitHub repositories?
**A:** Yes, but you need proper GitHub credentials and permission configured.

### Q: How do I run this in CI/CD?
**A:** Set `SKIP_PAUSE=true` and ensure `gh` CLI is authenticated in the CI environment.

### Q: What's the difference between Bash and Node.js versions?
**A:** Both implement the same 10 steps. Bash is more portable, Node.js better integrates with npm projects.

---

## Support

### Getting Help

1. **Check logs**:
   ```bash
   cat github-sync.log
   ```

2. **Review specification**:
   ```bash
   cat GITHUB_SYNC_SPECIFICATION.md
   ```

3. **Verify prerequisites**:
   ```bash
   ./github-sync.sh --help  # If implemented
   ```

4. **Manual steps**:
   Follow the 10 steps in `GITHUB_SYNC_SPECIFICATION.md` manually

---

## Related Files

- `GITHUB_SYNC_SPECIFICATION.md` - Complete 10-step specification
- `GITHUB_UPLOAD_SUMMARY.md` - Project completion summary
- `README.md` - Project documentation
- `DEPLOYMENT.md` - Deployment guide

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-23 | Initial release with Bash and Node.js implementations |

---

## License

MIT License - See LICENSE file

---

**Last Updated**: May 23, 2026  
**Status**: ✅ Production Ready  
**Implementations**: Bash + Node.js
