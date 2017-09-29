# Electron Radius Parser

![Radius parser in action](https://www.pictshare.net/hqo7jwopiw.jpg)

![Display days where a specific user was logged in](https://www.pictshare.net/10s7euqici.jpg)

# Features

- Detect radius log files on Windows NPS automatically
- Drag and Drop NPS log files into the program to parse
- Graphs of usage per Access point, day or hour
- List of failed logins with extended rejection reasons
- List of connected users with detailed information on which day of the month they were connected


# Features in the future
- Live watching the log files for changes
- More graphs
- Filter for users or access points


## Start via installer
Head over to the [Releases](https://github.com/HaschekSolutions/electron-radius-parser/releases) page.

## Start via source

```bash
# If you just want to run the app
npm install
npm start

# If you want to build an executable (win only atm)
npm install electron-builder -g
npm install
npm run dist
```