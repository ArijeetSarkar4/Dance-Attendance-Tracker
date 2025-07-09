# How to Deploy Your KUSA Dance Attendance App to GitHub Pages

Follow these steps to create a public URL for your KUSA Dance Attendance app that you can share with other teachers.

## Step 1: Create a GitHub Account
1. Go to [github.com](https://github.com)
2. Click "Sign up" if you don't have an account
3. Choose a username and complete the registration

## Step 2: Create a New Repository
1. After logging in, click the "+" icon in the top right corner
2. Select "New repository"
3. Name your repository: `kusa-dance-attendance-tracker`
4. Make sure it's set to "Public"
5. Check "Add a README file"
6. Click "Create repository"

## Step 3: Upload Your Files
1. In your new repository, click "uploading an existing file"
2. Drag and drop these files from your computer:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `kusa-logo.svg` (or your custom logo file)
   - `README.md` (optional)
   - `DEPLOYMENT_GUIDE.md` (optional)
3. Write a commit message like "Add KUSA Dance attendance tracker files"
4. Click "Commit changes"

## Step 4: Enable GitHub Pages
1. In your repository, click on "Settings" (top menu)
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click "Save"

## Step 5: Get Your Public URL
1. Wait 2-3 minutes for deployment
2. Your app will be available at:
   `https://[your-username].github.io/kusa-dance-attendance-tracker`
3. GitHub will show you the exact URL in the Pages settings

## Alternative Quick Deployment Options

### Option A: Netlify Drop (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Scroll down to "Deploy manually" section
3. Drag your folder containing all three files
4. Get instant public URL

### Option B: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository
4. Deploy with one click

### Option C: CodePen (For Testing)
1. Go to [codepen.io](https://codepen.io)
2. Create a new pen
3. Copy HTML to HTML section
4. Copy CSS to CSS section  
5. Copy JavaScript to JS section
6. Share the pen URL

## Important Notes

- **Data Storage**: Each user will have their own data stored locally
- **Sharing**: Teachers can bookmark the URL and access their own version
- **Updates**: If you update files, just upload new versions to GitHub
- **Custom Domain**: You can later add a custom domain if desired

## Troubleshooting

- If the page doesn't load, wait a few minutes after enabling Pages
- Make sure all file names are exactly: `index.html`, `styles.css`, `script.js`
- Check that the repository is public, not private

Your KUSA Dance Attendance app will be live and shareable within minutes using any of these methods!
