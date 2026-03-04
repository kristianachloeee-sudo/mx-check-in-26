require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const storage = require("./storage");
const sheets = require("./sheets");

const TOKEN = process.env.TOKEN;

// ------------------ MONTH / QUESTIONS ------------------
const FEBRUARY_INDEX = 1; // 0 = January

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const MONTHLY = [
  { code: "1.1", base: "clear about responsibilities this month 📝" },
  { code: "1.2", base: "supported in personal growth 🌱" },
  { code: "2.3", base: "given spaces to learn and improve within the role 📚" },
  { code: "4.2", base: "given chances to engage with the community 🤝" },
  { code: "5.2", base: "doing okay and know where to get support 💛" },
  { code: "6.2", base: "given opportunities to bond with the team 🫂" },
  { code: "6.3", base: "given opportunities for the team to review progress together 📊" },
  { code: "6.4", base: "given team spaces for development ⚡" },
  { code: "2.1", base: "given enough transition to start the role confidently 🔑" },
  { code: "2.2", base: "able to understand the tools and systems needed 💻" },
  { code: "3.1", base: "introduced to AIESEC social platforms 🌐" },
  { code: "3.2", base: "clearly explained our community rules 📜" },
  { code: "4.1", base: "added to communication channels 📬" },
  { code: "5.1", base: "oriented to their tools and workspaces 🛠️" },
  { code: "6.1", base: "given a team-building space to feel connected to my team 🌟" }
];

function buildQuestionSet(monthIndex, phase){
  const monthName = MONTH_NAMES[monthIndex];
  // For now, just return all questions with month added
  return MONTHLY.map(q => ({
    code: q.code,
    text: `This ${monthName}, ${q.base}`
  }));
}

// ------------------ KEYBOARDS ------------------
const yesNo = [["Yes","No"]];
const scale = [["1: Not Really","3: Somehow","5: Yes Definitely"]];
const roles = [["Member","TL"],["EB","LCP"],["MCVP","EST/National OC"]];
const lcvpFunctions = [["TM","FLA","OGX"],["IGV","IGT","BD"],["MKT","EWA","PR"]];

// ------------------ KPI DATA ------------------
const deptQuestions = {
  TM:["P","TM","FLA","OGX","IGV","IGT","MKT","EWA","PR","BD"],
  FLA:["$ Total Revenue Recognised 💰", "$ Net Profit 💸", "%Budget Variance (GvA) 📈", "%FSI Compliance Rate 📋"],
  OGX: ["#APL 👥","#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],
  IGV: ["#Opportunities Opened 🔎", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],
  IGT: ["#Opportunities Opened 🔎", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],
  MKT:["#Digital Campaigns 📱", "Physical Campaigns/Projects 🎪 (if you have a PR/EwA dept handling this, place N/A)", "#Sign-ups 📝"],
  BD:["$BD Revenue Recognised 💰","#GEPP Closed 🤝","%SOP Compliance 📋", "Average Partner NPS 💯"],
  EWA:["Total Event Sign-ups 📝", "#EwA Events Executed 🎪", "%EwA2ELD ⚡️", "#EwA Partners Closed 🤝", "$Event Revenue Recognised 💰"],
  PR:["Total Event Sign-ups 📝","#PR Events Executed 🎪", "%PR2ELD ⚡️", "#PR Partners Closed 🤝", "$Event Revenue Recognised 💰"]
};

// ------------------ SESSION MEMORY ------------------
const sessions = {};

// ------------------ BOT SETUP ------------------
let bot;
if (process.env.WEBHOOK_URL) {
  const express = require("express");
  const app = express();
  app.use(express.json());

  bot = new TelegramBot(TOKEN, { polling: false });
  const webhookPath = `/webhook/${TOKEN}`;
  const fullWebhookUrl = `${process.env.WEBHOOK_URL}${webhookPath}`;

  bot.setWebHook(fullWebhookUrl).catch(err => console.error("setWebHook error:", err));

  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  app.get("/", (req, res) => res.send("OK"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
} else {
  bot = new TelegramBot(TOKEN, { polling: true });
}

// ------------------ START COMMAND ------------------
bot.onText(/\/checkin/, (msg)=>{
  const uid = msg.from.id;

  sessions[uid] = { step:"name", role:null, answers:{}, phase:"receive", index:0 };

  bot.sendMessage(uid,
`Hi ${msg.from.first_name}! 
We just want to hear how your month went ✨ Please take 3 minutes to answer this quick check-in!
#FearlessAPHL 💙🐋

What’s your full name? (Last, First)`);
});

// ------------------ MESSAGE HANDLER ------------------
bot.on("message", async(msg)=>{
  const uid = msg.from.id;
  if(!sessions[uid] || msg.text.startsWith("/")) return;

  const session = sessions[uid];
  const text = msg.text;

  switch(session.step){

    // -------- BASIC INFO --------
    case "name":
      storage.updateUser(uid,{name:text});
      session.step="nickname";
      return bot.sendMessage(uid,"Great! What should we call you?");

    case "nickname":
      storage.updateUser(uid,{nickname:text});
      session.step="lc";
      return bot.sendMessage(uid,"Which LC are you from?",{
        reply_markup:{keyboard:[["AdMU","CSB","DLSU"],["UPC","UPD","UPLB"],["UPM","UST","MC"],["EST/National OC"]],one_time_keyboard:true}
      });

    case "lc":
      storage.updateUser(uid,{lc:text});
      session.step="role";
      return bot.sendMessage(uid,"What’s your role?",{reply_markup:{keyboard:roles,one_time_keyboard:true}});

    case "role":
      storage.updateUser(uid,{role:text});
      session.role = text;

      session.questions = buildQuestionSet(FEBRUARY_INDEX, "receive");
      session.index = 0;
      session.step = "receive";

      return bot.sendMessage(uid, session.questions[0].text, {reply_markup:{keyboard:scale,one_time_keyboard:true}});

    // -------- RECEIVE --------
    case "receive":
      session.answers[`receive_${session.questions[session.index].code}`] = text;
      session.index++;

      if(session.index < session.questions.length)
        return bot.sendMessage(uid, session.questions[session.index].text, {reply_markup:{keyboard:scale,one_time_keyboard:true}});

      if(session.role === "Member"){
        session.step="est";
        return bot.sendMessage(uid,"Are you part of EST or National OC?",{reply_markup:{keyboard:yesNo,one_time_keyboard:true}});
      }

      session.questions = buildQuestionSet(FEBRUARY_INDEX, "give");
      session.index = 0;
      session.step = "give";

      return bot.sendMessage(uid,"Now thinking about your team 👇",{reply_markup:{remove_keyboard:true}})
        .then(()=>bot.sendMessage(uid, session.questions[0].text, {reply_markup:{keyboard:scale,one_time_keyboard:true}}));

    // -------- GIVE --------
    case "give":
      session.answers[`give_${session.questions[session.index].code}`] = text;
      session.index++;

      if(session.index < session.questions.length)
        return bot.sendMessage(uid, session.questions[session.index].text, {reply_markup:{keyboard:scale,one_time_keyboard:true}});

      session.step = "est";
      return bot.sendMessage(uid,"Are you part of EST or National OC?",{reply_markup:{keyboard:yesNo,one_time_keyboard:true}});

    // -------- EST --------
    case "est":
      if(text==="Yes"){
        session.step="est_project";
        return bot.sendMessage(uid,"Which National/OC project are you part of?");
      }
      if(session.role==="EB") return proceedAchievements(uid, session);
      return finishCheckIn(uid, session);

    case "est_project":
      session.answers.est_project=text;
      session.questions = buildQuestionSet(FEBRUARY_INDEX, "est");
      session.index = 0;
      session.step = "est_questions";
      return bot.sendMessage(uid, session.questions[0].text, {reply_markup:{keyboard:scale,one_time_keyboard:true}});

    case "est_questions":
      session.answers[`est_${session.questions[session.index].code}`] = text;
      session.index++;

      if(session.index < session.questions.length)
        return bot.sendMessage(uid, session.questions[session.index].text, {reply_markup:{keyboard:scale,one_time_keyboard:true}});

      if(session.role==="EB") return proceedAchievements(uid, session);
      return finishCheckIn(uid, session);

    // -------- EB KPI --------
    case "deptQuestions":
      session.kpi_dept=text;
      session.kpi_index=0;
      session.answers[text]={};
      session.step="achievements_dept";
      return sendKPIQuestion(uid, session);

    case "achievements_dept":
      const dept=session.kpi_dept;
      session.answers[dept][session.kpi_index]=text;
      session.kpi_index++;

      if(session.kpi_index < deptQuestions[dept].length)
        return sendKPIQuestion(uid, session);

      session.step="final_messages";
      return bot.sendMessage(uid,"Any final messages you'd like to share?");

    case "final_messages":
      session.answers.final_messages=text;
      return finishCheckIn(uid, session);
  }
});

// ------------------ KPI FUNCTIONS ----------------
function proceedAchievements(uid, session){
  session.step="deptQuestions";
  bot.sendMessage(uid,"Which department are you an EB of?",{reply_markup:{keyboard:lcvpFunctions,one_time_keyboard:true}});
}

function sendKPIQuestion(uid, session){
  const dept = session.kpi_dept;
  const metrics = deptQuestions[dept];
  const q = metrics[session.kpi_index];

  const text = dept==="TM"
    ? `How many people are in the "${q}" department? (Please input it as #VP, #TL, #Members, #Directors - Example: 1, 3, 9, 0) 👥`
    : typeof q==="object"
      ? `How many ${q.code} did you achieve this month? ${q.text}`
      : q;

  bot.sendMessage(uid, text);
}

// ------------------ FINISH ----------------
async function finishCheckIn(uid, session){
  const user = storage.getUser(uid);

  const row = [
    new Date().toISOString(),
    user.name,
    user.nickname,
    user.lc,
    session.role,
    JSON.stringify(session.answers)
  ];

  try{ await sheets.submitRow(row); }
  catch(err){ console.error("Google Sheets error:", err); }

  storage.clearAnswers(uid);
  bot.sendMessage(uid,"Thank you! 💙🐋\nYour feedback has been submitted ✨ Thank you for building #FearlessAPHL with us!");
  delete sessions[uid];
}
