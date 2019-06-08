/*
    QMK Docs discord bot
    Copyright (C) 2019  Elliot Powell

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

var svnUltimate = require("node-svn-ultimate");
var fs = require("fs");
const baseURL = "https://docs.qmk.fm/#/";

const Discord = require("discord.js");
const client = new Discord.Client();

docs = {}

const TOKEN = "REPLACE WITH TOKEN"

client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity("Clacking Hard 2MCUs")
	client.fetchUser("198473355580538880", true).then(myUser => {
		client.ownerAvatarURL = myUser.avatarURL; // My user's avatar is here!
	})
});

client.on("message", msg => {
  if (msg.content.substring(0, 2) == "$s") {
    args = msg.content.slice(3).trim();
    console.log("New Search with term: ", args);
    search(args).then(data => {
      if (data.urls.length > 0) {
        respone = new Discord.RichEmbed()
          .setTitle("Results:")
					.setColor("#d0ef07")
					.setAuthor("QMK Docs", "https://qmk.fm/qmk_icon_48.png")
					.setFooter("Bot created by e11i0t23#7272", client.ownerAvatarURL);
        urls.forEach(url => {
          title = url.replace(baseURL, "");
          title = title.replace(/_/g, " ");
          title = title.slice(0, -3);
          respone.addField(title, url);
        });
        msg.channel.send(respone);
      }
    });
  }
});

function updateDocs() {
  return new Promise((resolve, reject) => {
    svnUltimate.commands.checkout(
      "https://github.com/qmk/qmk_firmware/trunk/docs/",
      "./docs",
      function(err) {
        console.log("Checkout complete");
        //docs = {};
        fs.readdir("./docs/", (err, files) => {
          if (err) console.log(err);
          let jsfile = files.filter(f => f.split(".").pop() === "md");
          if (jsfile.length <= 0) {
            console.log("Couldn't find docs.");
            return;
          }
          jsfile.forEach((f, i) => {
            console.log(f);
            fs.readFile(`./docs/${f}`, "utf8", (err, data) => {
              if (err) throw err;
              //console.log(data);
              docs[f] = data;
              if (f == jsfile[jsfile.length - 1]) resolve(true);
            });
          });
        });
      }
    );
  });
}

function search(term) {
  termJoint = term.replace(/\s/gi, "_").toLowerCase();
  urls = [];
  return new Promise((resolve, reject) => {
    Object.keys(docs).forEach((key, idx, arr) => {
      if (key.includes(termJoint)) {
        console.log("FOUND");
        console.log(baseURL + key);
        urls.push(baseURL + key);
      }
      if (idx == arr.length - 1) {
        resolve({
          type: "title",
          urls: urls
        });
      }
    });
    if (urls.length === 0) {
      Object.keys(docs).forEach((key, idx, arr) => {
        if (docs[key].includes(term)) {
          console.log("FOUND");
          console.log(baseURL + key);
          urls.push(baseURL + key);
        }
        if (idx == arr.length - 1) {
          resolve({
            type: "text",
            urls: urls
          });
        }
      });
    }
  });
}

updateDocs()
  .then(() =>client.login(TOKEN))
  .then(() => setInterval(updateDocs().then().catch(), 300000)).catch();
