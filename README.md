# DNT Bank Output

This repo contains a simple web app to read the the raw output `.txt` files and then post it to https://thj-dnt.web.app/bank.

We currently have 4 banker characters:
1. Dntbank
2. Dntdoze
3. Dntepics
4. Dntspells

More info on what goes where is posted on the DNT Discord server in the **#bank-and-requests** channel.

## Create Output Files

1. Open your THJ dir, create a new dir called `outputs`
2. Login to the banker account, type `!banker` in **#officer-chat** to get the credentials.
3. Login to the `Dntbank` character.
4. Run the command `/output inventory outputs/Dntbank-Inventory.txt` # this filename must match exactly
5. Rinse and repeat for each character, make sure to name the file appropriately.

Once you have the 4 files you'll need to get them added to this repo.

## Update This Repo
1. Download GitHub Desktop
2. Clone this repo (there is an option to open in GitHub Desktop if you click the green 'Code' button)
3. In GitHub Desktop, create a branch, name it `YYYYMMDD` e.g. `20250107`
4. Find the cloned directory
5. Overwrite the files in `./src/assets`
6. Commit your changes
7. Push your changes to remote
8. Create a [new Pull Request](https://github.com/amber-valderez/thj-dnt/pulls) based off your branch
9. GitHub Actions will deploy your changes

## Improvements
* Move the files to S3 or GDrive, have GitHub Actions poll for changes every 5 minutes
