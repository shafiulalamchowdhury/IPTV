# 1. Initialize git in the folder
git init

# 2. Add all files (index.html, images, local playlists)
git add .

# 3. Create the initial commit
git commit -m "Initial commit of redesigned IPTV player"

# 4. Rename default branch to main
git branch -M main

# 5. Link your local project to your GitHub repository
git remote add origin https://github.com/shafiulalamchowdhury/IPTV.git

# 6. Push the code to GitHub (this may ask you to sign in)
git push -u origin main
