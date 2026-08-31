# Publish to your own GitHub Pages site

These steps use a free GitHub account and the included GitHub Actions workflow. If you do not yet have GitHub, use the beginner path below.

## Beginner path: create and connect GitHub

1. Go to [github.com](https://github.com/) and choose **Sign up**. You may continue with your Google account or use an email address.
2. Choose a username you are comfortable displaying in the website address. Complete GitHub's email verification and any security prompts yourself.
3. Turn on two-factor authentication when GitHub offers it, and store recovery codes somewhere private.
4. In Claude, open **Settings → Connectors**, find GitHub, and choose **Connect**. Sign in to GitHub yourself and approve only the repository access Claude needs. Connector labels can change; if you do not see GitHub, ask Claude to guide you from the screen you see.
5. Never paste a GitHub password, two-factor code, recovery code, personal access token, or browser cookie into a chat. Claude can pause while you complete sign-in and authorization privately.

Then paste the **First-time GitHub setup** prompt from `COPYABLE_PROMPTS.md` into Claude. The agent should explain each step in ordinary language, create the repository, verify the privacy exclusions, and tell you the final website address.

## Manual publishing steps

1. Create a new public GitHub repository, for example `law-school-practice-lab`. Do not initialize it with extra files.
2. Run the bootstrap command from `README.md` with your GitHub username and repository name.
3. Run `npm run verify` locally. Do not continue if any failure is reported.
4. Upload the project files to your new repository, excluding `node_modules/`, `_site/`, and `sources/`. The included `.gitignore` excludes these automatically when Git is used correctly.
5. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **GitHub Actions**.
6. Open the **Actions** tab and wait for “Deploy Practice Lab to GitHub Pages” to finish successfully.
7. Visit `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY/`.
8. Confirm the displayed question count and open at least one explanation. On an iPhone, use Safari's Share menu and choose **Add to Home Screen**.

For later updates, add only verified derivative questions and metadata, run `npm run verify`, and push the changed project files. The workflow rebuilds and publishes only the safe `_site` artifact.

Never commit the `sources/` folder, casebook PDFs, slide decks, Canvas exports, `.env` files, tokens, browser profiles, or authenticated links. Before the first upload, confirm that `git status` does not list anything under `sources/`.
