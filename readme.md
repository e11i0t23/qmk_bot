# QMK Bot

A simple discord bot for searching [The Qmk Docs](docs.qmk.fm) straight from discord  

## Setup  
- install subversion(svn) from [here](https://subversion.apache.org/) or using `apt install subversion` on debian
- run `yarn` in order to download required node_modules
- create a new bot application on https://discordapp.com/developers/applications
- create a .env file based of the example but replace `yourBotToken` with your client token


## Starting the bot  
    yarn start

## Using the bot  
enter `$s YOURSEARCHTERM`  
the bot will then respond with an embed of relevent doc pages