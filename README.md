# Questlog: setting it up on your iPhone

Everything here is done in Safari and the Files app. It takes about 20 minutes, one time.
You'll use two free services: **Firebase** (Google sign-in and saving progress) and **GitHub Pages** (puts the app on the web).

## What's in the zip

```
questlog/
├── README.md          this guide
├── firestore.rules    security rules you paste into Firebase (step 3)
└── app/               the app: these are the files you upload to GitHub (step 6)
```

---

## Part 1: Firebase

### 1. Create the project
1. In Safari, go to **console.firebase.google.com** and sign in with your Google account.
2. Tap **Create a project**, name it `questlog`, and continue. You can switch off Google Analytics.
3. On the project page, tap the **Web** icon `</>` to add a web app. Give it a nickname. **Leave "Firebase Hosting" unticked.** Tap **Register app**.
4. Firebase shows a block of code that starts `const firebaseConfig = {`. Copy everything between the `{ }` and keep it for step 5.
   (Lost it? It's under ⚙️ **Project settings → General → Your apps**.)

### 2. Turn on Google sign-in
1. Open the menu (☰) → **Build → Authentication → Get started**.
2. Tap **Google**, switch it on, choose your email as the support email, and **Save**.

### 3. Create the database and add the rules
1. Menu → **Build → Firestore Database → Create database**.
2. Location: **europe-west2 (London)**. You can't change this later.
3. Choose **Start in production mode** and create it.
4. Open the **Rules** tab. Delete what's there, paste in the whole of `firestore.rules`, and tap **Publish**.
   To open the file: in the Files app, long-press `firestore.rules` → **Quick Look**, select all, copy. If that doesn't work, ask Claude to paste the rules into the chat.

## Part 2: The app files

### 4. Unzip
Save the zip to the Files app (On My iPhone), then tap it once. A `questlog` folder appears next to it.

### 5. Add your Firebase config
`app/firebase-config.js` needs your values from step 1. Easiest option: paste your config into the chat with Claude and ask for an updated `firebase-config.js`, then replace the old file with the new one.
(These values aren't passwords. They only identify your project, and the rules from step 3 do the protecting.)

## Part 3: GitHub Pages

### 6. Upload
1. Go to **github.com** and create a free account. Your username becomes part of the web address.
2. Tap **+** → **New repository**. Name it `questlog`, set it to **Public**, tick **Add a README file**, and create it.
3. Tap **Add file → Upload files**. If you don't see this, tap **aA** in Safari's address bar → **Request Desktop Website**.
4. Tap **choose your files**, open the `questlog/app` folder, select **all 9 files**, and tap **Commit changes**.
   Upload the files themselves, not the `app` folder. The repository should list `index.html` at the top level.

### 7. Switch on Pages
1. In the repository, open **Settings → Pages**.
2. Under **Branch**, choose **main** and **/(root)**, then **Save**.
3. After a minute or two, refresh. The page shows your address: `https://YOURUSERNAME.github.io/questlog/`

### 8. Allow that address to sign in
Back in Firebase: **Authentication → Settings → Authorized domains → Add domain**, and enter `YOURUSERNAME.github.io` (no `https://`, no `/questlog`).

### 9. Play
Open your address in Safari and tap **Sign in with Google**. Then tap **Share → Add to Home Screen** to install it like an app.

---

## Inviting friends
Send them your address, or use **Guild → Copy invite link** in the app. Each friend signs in with their own Google account and gets a private save. Friends see each other's hero name, level, title, class, gear and streak in the Guild tab. Quests, gold and history stay private.

**Only letting your friends in:** by default anyone with the link can sign in. To limit it, edit the rules in **Firestore → Rules** following the comment near the top, add your friends' Gmail addresses, and **Publish**.

## Making changes later
When Claude updates the app, it tells you which files changed. In your GitHub repository, tap **Add file → Upload files**, pick the changed files, and **Commit changes**. Files with the same name are replaced. The new version shows up within a few minutes; close and reopen the app to load it.
Don't re-upload `firebase-config.js` unless you're changing it, or you'll overwrite your config with the placeholder.

## Troubleshooting
| Message | Fix |
|---|---|
| "Firebase isn't set up yet" | `firebase-config.js` on GitHub still has placeholders. Upload your filled-in one. |
| "This web address isn't allowed to sign in yet" | Do step 8. Check the spelling of `YOURUSERNAME.github.io`. |
| "Google sign-in is switched off" | Do step 2. |
| "Couldn't load your save: permission-denied" | Paste and publish the rules (step 3.4), or check the email allow-list. |
| Sign-in does nothing in the home-screen app | Try once more with a good connection. If it still fails, use the app in Safari for now and tell Claude what happened. |
| A 404 page at your address | Wait a few minutes after step 7, and check that `index.html` sits at the top of the repository, not inside a folder. |
