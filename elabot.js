const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const token = fs.readFileSync(".access").toString().trim();
const fetch = require("node-fetch");
const request = require("request");

const bot = new TelegramBot(token, { polling: true });

async function getBlockHeight() {
  const headers = {
    "content-type": "application/json;",
  };
  const dataString = '{"method": "getcurrentheight"}';
  const params = {
    method: "POST",
    headers: headers,
    body: dataString,
  };

  const block = await fetch("https://api.elastos.io/ela", params);
  const height = await block.json();
  return height.result
}


// Command section
bot.onText(/\/election/, async (msg, data) => {
  console.log(`Election Command Triggered ${Date()}`);
  const chatId = msg.chat.id;

  const electionClose = 1184530;
  //const block = await fetch("https://node1.elaphant.app/api/v1/block/height");
  const height = await getBlockHeight();

  const blocksToGo = electionClose - parseInt(height);
  const secondsRemaining = blocksToGo < 0 ? 0 : blocksToGo * 2 * 60;
  let days = Math.floor(secondsRemaining / (60 * 60 * 24));
  let hours = Math.floor((secondsRemaining % (60 * 60 * 24)) / (60 * 60));
  let minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
  let seconds = Math.floor(secondsRemaining % 60);

  const crc = await fetch("https://node1.elaphant.app/api/v1/crc/rank/height/99999999999999999?state=active");
  const res = await crc.json();

  let ranks = "<b>Cyber Republic Council Election Status</b>" + "\n" + "\n";

  res.result.forEach((candidate) => {
    // ranks = ranks + "{0:<20} {1}".format(key, value) + "\n"
    ranks =
      ranks +
      `${candidate.Rank}. ${candidate.Nickname}  --  ${parseFloat(candidate.Votes).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}` +
      "\n";

    if (candidate.Rank === 12) {
      ranks = ranks + "\n";
    }
  });

  // ranks = ranks + `\n<b>Election close in ${blocksToGo} blocks</b>\n${days} days, ${hours} hours, ${minutes} minutes`;
  ranks = ranks + `\n<b>Election closed</b>\n${days} days, ${hours} hours, ${minutes} minutes`;

  ranks = ranks + `\n \nOnce the election concludes, please use /council to view the official results.`;
  //See <a href="https://elanodes.com">elanodes</a> for more details.`;

  bot.sendMessage(chatId, ranks, { parse_mode: "HTML" }, { disable_web_page_preview: true });
});

bot.onText(/\/council/, async (msg, data) => {
  console.log(`Council Command Triggered ${Date()}`);

  const chatId = msg.chat.id;

  const headers = {
    "content-type": "application/json;",
  };
  const dataString = '{"method": "listcurrentcrs","params":{"state":"all"}}';
  const options = {
    url: "http://localhost:20336/",
    method: "POST",
    headers: headers,
    body: dataString,
    auth: {
      user: "7a4b60740236af60dc0e8cf427dc55ff",
      pass: "8e1bc7bd65ae0cf3de0d610f886b5c0a",
    },
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      let list = JSON.parse(body);
      list = list.result.crmembersinfo;

      let council = "<b>Cyber Republic Council Incumbents</b>" + "\n" + "\n";
      list.forEach((member) => {
        council = council + `${member.nickname}  --  ${member.state}` + "\n";
      });
      council =
        council +
        `\nDisplays the active council. Will update once the election closes. Use /election for current status.`;
      bot.sendMessage(chatId, council, { parse_mode: "HTML" });
    }
  }
  request(options, callback);
});

bot.onText(/\/halving/, async (msg, data) => {
  console.log(`Halving Command Triggered ${Date()}`);

  const chatId = msg.chat.id;

  const halvingBlock = 1051200;
  //const block = await fetch("https://node1.elaphant.app/api/v1/block/height");
  const height = await getBlockHeight();

  const blocksToGo = halvingBlock - parseInt(height);
  const secondsRemaining = blocksToGo * 2 * 60;

  let days = Math.floor(secondsRemaining / (60 * 60 * 24));
  let hours = Math.floor((secondsRemaining % (60 * 60 * 24)) / (60 * 60));
  let minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);

  let halving = `<b>Elastos Halving Countdown</b> \n \n${days} days, ${hours} hours, ${minutes} minutes`;

  bot.sendMessage(chatId, halving, { parse_mode: "HTML" });
});

bot.onText(/\/proposals/, async (msg, data) => {
  console.log(`Proposals Command Triggered ${Date()}`);

  const res = await fetch("https://api.cyberrepublic.org/api/cvote/list_public?voteResult=all");
  const proposalList = await res.json();

  const headers = {
    "content-type": "application/json;",
  };
  const dataString = '{"method": "getcurrentheight"}';
  const params = {
    method: "POST",
    headers: headers,
    body: dataString,
  };

  const height = await getBlockHeight();

  const active = proposalList.data.list.filter((item) => {
    return item.proposedEndsHeight > height && item.status === "PROPOSED";
  });

  let proposals = `<pre><b>Cyber Republic Active Proposals</b></pre>`;
  // const active = proposalList.data.list[0];

  if (active.length > 0) {
    let index = 0;
    active.reverse().forEach((item, index) => {
      index++;
      const secondsRemaining =
        parseFloat(item.proposedEndsHeight) - parseFloat(height) < 0
          ? 0
          : (parseFloat(item.proposedEndsHeight) - parseFloat(height)) * 2 * 60;
      const days = Math.floor(secondsRemaining / (60 * 60 * 24));
      const hours = Math.floor((secondsRemaining % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);

      // proposals = `<strong>${item.title}</strong> \n \n<b>Proposed by</b> - ${item.proposedBy} \n<b>Status</b> - ${item.status} \n<b>Time remaining</b> - ${days} days, ${hours} hours, ${minutes} minutes\n \n`;
      proposals += `\n\n<strong>${index}. ${item.title}</strong> \n \n<b>Proposed by</b> - ${item.proposedBy} \n<b>Time remaining</b> - ${days} days, ${hours} hours, ${minutes} minutes\n \n`;

      let support = 0;
      let reject = 0;
      let undecided = 0;
      let abstention = 0;
      let unchained = [];

      item.voteResult.forEach((vote) => {
	if (vote.value === "support" && vote.status === "chained") support++;
        if (vote.value === "reject" && vote.status === "chained") reject++;
        if (vote.value === "undecided") undecided++;
        if (vote.value === "abstention" && vote.status === "chained") abstention++;
        if (vote.value !== "undecided" && vote.status === "unchain") {
          unchained.push(`${council[vote.votedBy]} voted ${vote.value} but did not chain the vote`);
	}
      });

      let unchainedList = `<u>Warnings</u>\n`;
        if (unchained.length > 0) {
        unchained.forEach((warning) => {
          unchainedList += `${warning}\n`
        });
      }

      proposals += `<b><u>Council Votes</u></b>\n&#9989;  Support - <b>${support}</b>\n&#10060;  Reject - <b>${reject}</b>\n&#128280;  Abstain - <b>${abstention}</b>\n&#9888;  Undecided - <b>${undecided}</b>\n\n`;
      if (unchained.length > 0) proposals += `${unchainedList}\n`;
      proposals += `<i><a href='https://www.cyberrepublic.org/proposals/${item._id}'>View on Cyber Republic website</a></i>`; 
    });
    bot.sendMessage(msg.chat.id, proposals, { parse_mode: "HTML" });
  } else {
    proposals += `\n\nThere are currently no proposals in the council voting period`;
    bot.sendMessage(msg.chat.id, proposals, { parse_mode: "HTML" });
  }
});

// Automated section
const council = {
  "60cf124660cb2c00781146e2": "Elation Studios",
  "60c444e0a9daba0078a58aed": "Ryan | Starfish Labs",
  "60c4826d77d3640078f4ddfe": "Rebecca Zhu",
  "60cff34cc05ef80078cf60e8": "SJun Song",
  "5ee045869e10fd007849e3d2": "The Strawberry Council",
  "5c738c9a471cb3009422b42e": "Jingyu Niu",
  "5b4e46dbccac490035e4072f": "Sash | Elacity 🐘",
  "62a97bb904223900785a5897": "MButcho ● Nenchy",
  "5b481442e3ffea0035f4e6e7": "DR",
  "62b1a5c804223900785aa988": "Infi",
  "62bc8a196705da0078a4e378": "Phantz Club",
  "5d14716f43816e009415219b": "PG BAO",
};

const Test = "-501549984"; // Bot test group
const CRcouncil = "-1001709678925"; // CR council group
const Elastos_Main = "-1001243388272"; // elastos main chat
const Elastos_New = "-1001780081897"; // new elastos group

let storedAlerts = {};
setInterval(async () => {
  const res = await fetch("https://api.cyberrepublic.org/api/cvote/list_public?voteResult=all");
  const proposalList = await res.json();

  // const block = await fetch("https://node1.elaphant.app/api/v1/block/height");
  const height = await getBlockHeight()

  const active = proposalList.data.list.filter((item) => {
    return item.proposedEndsHeight > height && item.status === "PROPOSED";
  });

  if (active.length > 0) {
    active.forEach((item) => {
      let support = 0;
      let reject = 0;
      let abstention = 0;
      let undecided = 0;
      let undecideds = [];
      let unchained = [];

      item.voteResult.forEach((vote) => {
        if (vote.value === "support" && vote.status === "chained") support++;
        if (vote.value === "reject" && vote.status === "chained") reject++;
        if (vote.value === "undecided") {
          undecided++;
          undecideds.push(vote.votedBy);
        }
        if (vote.value === "abstention" && vote.status === "chained") abstention++;
	if (vote.value !== "undecided" && vote.status === "unchain") {
	  unchained.push(`${council[vote.votedBy]} voted ${vote.value} but did not chain the vote`);
	}
      });

      let tally = `<u>Current voting status</u>\n&#9989;  Support - <b>${support}</b>\n&#10060;  Reject - <b>${reject}</b>\n&#128280;  Abstain - <b>${abstention}</b>\n&#9888;  Undecided - <b>${undecided}</b>\n\n`;
      let unchainedList = `<u>Warnings</u>\n`;
      if (unchained.length > 0) {
	unchained.forEach((warning) => {
	  unchainedList += `${warning}\n`
	});
      }
      let undecidedList = `<u>Council members who have not yet voted</u>\n`;
      let failedList = `<u>Council members who failed to vote</u>\n`;
      if (undecideds.length === 0) {
        undecidedList = `<b>&#128526; Everyone voted! Well done!</b>\n`;
        failedList = `<b>&#128526; Everyone voted! Well done!</b>\n`;
      } else {
        undecideds.forEach((member) => {
          undecidedList += `${council[member]}\n`;
          failedList += `${council[member]} &#9785\n`;
        });
      }

      let message = "";

      const blocksRemaining = item.proposedEndsHeight - height;
      console.log("Blocks remaining: " + blocksRemaining);

      if (blocksRemaining > 4990) {
        if (storedAlerts[item._id] === 7) return;
        message = `<strong>&#10055; Whoa! A new proposal is now open for voting! &#128064;</strong>\n\n${item.title}\n\n`;
        storedAlerts[item._id] = 7;
      } else if (blocksRemaining < 3600 && blocksRemaining > 3550) {
        if (storedAlerts[item._id] === 5) return;
        message = `<strong>&#128076; Reminder! There are <u>5 days</u> remaining to vote on proposal:</strong>\n\n${item.title}\n\n`;
        storedAlerts[item._id] = 5;
      } else if (blocksRemaining < 2160 && blocksRemaining > 2110) {
        if (storedAlerts[item._id] === 3) return;
        message = `<strong>&#128073; Hey you! &#128072; There are <u>3 days</u> remaining to vote on proposal:</strong>\n\n${item.title}\n\n${tally}`;
        if (unchained.length > 0) message += `${unchainedList}\n`;
	if (undecidedList.length > 0) message += `${undecidedList}\n`;
        storedAlerts[item._id] = 3;
      } else if (blocksRemaining < 720 && blocksRemaining > 670) {
        if (storedAlerts[item._id] === 1) return;
        message = `<strong>&#9888; Warning! &#9888; There is only <u>1 day</u> remaining to vote on proposal:</strong>\n\n${item.title}\n\n${tally}`;
        if (unchained.length > 0) message += `${unchainedList}\n`;
        if (undecidedList.length > 0) message += `${undecidedList}\n`;
        storedAlerts[item._id] = 1;
      } else if (blocksRemaining < 360 && blocksRemaining > 310) {
        if (storedAlerts[item._id] === 0.5) return;
        message = `<strong>&#8252; Alert! &#8252; There are only <u>12 hours</u> remaining to vote on proposal:</strong>\n\n${item.title}\n\n${tally}`;
        if (unchained.length > 0) message += `${unchainedList}\n`;
	if (undecidedList.length > 0) message += `${undecidedList}\n`;
        storedAlerts[item._id] = 0.5;
      } else if (blocksRemaining <= 7) {
        if (storedAlerts[item._id] === 0) return;
        message = `<strong>&#9760; The council voting period has elapsed for proposal:</strong>\n\n${item.title}\n\n${tally}`;
	if (unchained.length > 0) message += `${unchainedList}\n`;
	if (undecidedList.length > 0) message += `${failedList}\n`;
        storedAlerts[item._id] = 0;
      } else {
        return;
      }

      message += `<i><a href='https://www.cyberrepublic.org/proposals/${item._id}'>View the full proposal here</a></i>\n\nUse /proposals to fetch real time voting status`;
      bot.sendMessage(CRcouncil, message, { parse_mode: "HTML" });
      //bot.sendMessage(Elastos_Main, message, { parse_mode: "HTML" });
      //bot.sendMessage(Elastos_New, message, { parse_mode: "HTML" });
    });
  }
}, 300000);
