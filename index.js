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

require("dotenv").config();
const curl = new (require("curl-request"))();

const docsURL = "https://docs.qmk.fm/#/";
const statusURL = "http://api.qmk.fm/v1";

const Discord = require("discord.js");
const client = new Discord.Client();

var docs = {};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("Clacking Hard 2MCUs");
  client.fetchUser("198473355580538880", true).then(myUser => {
    client.ownerAvatarURL = myUser.avatarURL; // My user's avatar is here!
  });
  setInterval(getStatus, 5000);
  //getStatus()
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
          title = url.replace(docsURL, "");
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
  console.log("Fetching Docs");
  return new Promise((resolve, reject) => {
    svnUltimate.commands.checkout(
      "https://github.com/qmk/qmk_firmware/trunk/docs/",
      "./docs",
      function(err) {
        if(err){
          console.log(err);
        }
        console.log("Checkout complete");
        //docs = {};
        fs.readdir("./docs/", (err, files) => {
          if (err) console.log(err);
          let jsfile = files.filter(f => f.split(".").pop() === "md");
          if (jsfile.length <= 0) {
            reject(new Error("Docs couldn't be found"));
            return;
          }
          jsfile.forEach((f) => {
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
  var termJoint = term.replace(/\s/gi, "_").toLowerCase();
  var urls = [];
  return new Promise((resolve, reject) => {
    if(docs[0]==null) reject(new Error("Docs not found"));
    Object.keys(docs).forEach((key, idx, arr) => {
      if (key.includes(termJoint)) {
        console.log("FOUND");
        console.log(docsURL + key);
        urls.push(docsURL + key);
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
          console.log(docsURL + key);
          urls.push(docsURL + key);
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

var prevousQueue = 0;
var status = 200;
var queue = 0;

function getStatus() {
  console.log("getting status");
  curl.get(statusURL).then(({ statusCode, body, headers }) => {
    console.log(statusCode, body, headers);
    queue = body.queue_length;
    if (queue >= 50) {
      if (status == 200) {
        client.channels.get(process.env.STATUSCHANNEL).send(
          new Discord.RichEmbed()
            .setTitle("WARNING")
            .setDescription("Long compile queue, possible error detected")
            .setAuthor(
              "QMK Bot",
              "https://qmk.fm/qmk_icon_48.png",
              "https://github.com/e11i0t23/qmk_bot"
            )
            .setTimestamp(new Date())
            .setFooter("Bot created by e11i0t23#7272", client.ownerAvatarURL)
            .setColor(4594479)
            .addField("QUEUE LENGTH:", queue)
        );
        status = 503;
        prevousQueue = queue;
      }
    } else if (status == 503 && (prevousQueue < queue || queue == 0)) {
      status = 200;
      prevousQueue = queue;
    }
    console.log(queue, status);
  });
}

updateDocs()
  .then(() => client.login(process.env.TOKEN))
  .then(() => setInterval(updateDocs, 300000))
  .catch((err) => console.log(err));
