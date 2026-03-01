---
description: How to commit and push changes to deploy automatically via Vercel
---

After making code changes, run these steps to deploy:

// turbo-all

1. Stage all changes:
```
git add -A
```

2. Commit with a descriptive message:
```
git commit -m "<describe what changed>"
```

3. Push to GitHub (Vercel auto-deploys from main):
```
git push origin main
```
