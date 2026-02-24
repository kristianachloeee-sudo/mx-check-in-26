require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const storage = require("./storage");
const questions = require("./questions");
const sheets = require("./sheets");

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

/* ------------------ KEYBOARDS ------------------ */
const yesNo = [["Yes","No"]];
const scale = [["1: Not Really","3: Somehow","5: Yes Definitely"]];
const roles = [["Member","TL"],["EB","LCP"],["MCVP","EST/National OC"]];
const lcvpFunctions = [["TM","FLA","OGX"],["IGV","IGT","BD"],["MKT","EWA","PR"]];

/* ------------------ KPI DATA ------------------ */
const exchangeMetrics = [
  { code:"#APL", text:"Applications received (PPL) 📥" },
  { code:"#ACC", text:"Accepted ✅" },
  { code:"#APD", text:"Approved 📝" },
  { code:"#RE", text:"Realised 🎯" },
  { code:"#FI", text:"Finished 🏁" },
  { code:"#CO", text:"Complete 🎉" }
];

const deptQuestions = {
  TM:["P","TM","FLA","OGX","IGV","IGT","MKT","EWA","PR","BD"],
  FLA:["Revenue for the month 💰","PnL for the month 💰"],
  OGX:exchangeMetrics,
  IGV:exchangeMetrics,
  IGT:exchangeMetrics,
  MKT:["Sign-ups 📝"],
  BD:["MOAs 🤝","Meetings 🤝","OP Secured 🤝","GEPP (Non-OP Exchange Partners) Secured 🤝","Revenue 💰"],
  EWA:["Event Sign-ups 🎉","Events Executed 🎉","%SU-APL 🎉"],
  PR:["Event Sign-ups 🎉","Events Executed 🎉","%SU-APL 🎉"]
};

function currentMonth(){
  return new Date().toLocaleString("default",{month:"long"});
}

/* ------------------ SESSION MEMORY ------------------ */
const sessions = {};

/* ------------------ START ------------------ */
bot.onText(/\/checkin/, (msg)=>{
  const uid = msg.from.id;

  sessions[uid]={
    step:"name",
    role:null,
    answers:{},
    phase:"receive", // receive → give → est → kpi → finish
    index:0
  };

  bot.sendMessage(uid,
`Hi ${msg.from.first_name}! 
We just want to hear how your month went ✨ Please take 3 minutes to answer this quick check-in!
#FearlessAPHL 💙🐋

What’s your full name? (Last, First)`);
});

/* ------------------ MESSAGE HANDLER ------------------ */
bot.on("message", async(msg)=>{
  const uid = msg.from.id;
  if(!sessions[uid] || msg.text.startsWith("/")) return;

  const session = sessions[uid];
  const text = msg.text;

/* BASIC INFO */
switch(session.step){

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
  session.role=text;

  session.questions = questions.buildQuestionSet(currentMonth(),"receive");
  session.index=0;
  session.step="receive";

  return bot.sendMessage(uid,session.questions[0].text,{reply_markup:{keyboard:scale,one_time_keyboard:true}});

/* RECEIVE STANDARDS */
case "receive":
  session.answers[`receive_${session.questions[session.index].code}`]=text;
  session.index++;

  if(session.index < session.questions.length)
    return bot.sendMessage(uid,session.questions[session.index].text,{reply_markup:{keyboard:scale,one_time_keyboard:true}});

  // MEMBERS STOP HERE (no giving standards)
  if(session.role==="Member"){
    session.step="est";
    return bot.sendMessage(uid,"Are you part of EST or National OC?",{reply_markup:{keyboard:yesNo,one_time_keyboard:true}});
  }

  // others proceed to give standards
  session.questions = questions.buildQuestionSet(currentMonth(),"give");
  session.index=0;
  session.step="give";

  return bot.sendMessage(uid,"Now thinking about your team 👇",{reply_markup:{remove_keyboard:true}})
  .then(()=>bot.sendMessage(uid,session.questions[0].text,{reply_markup:{keyboard:scale,one_time_keyboard:true}}));

/* GIVE STANDARDS */
case "give":
  session.answers[`give_${session.questions[session.index].code}`]=text;
  session.index++;

  if(session.index < session.questions.length)
    return bot.sendMessage(uid,session.questions[session.index].text,{reply_markup:{keyboard:scale,one_time_keyboard:true}});

  session.step="est";
  return bot.sendMessage(uid,"Are you part of EST or National OC?",{reply_markup:{keyboard:yesNo,one_time_keyboard:true}});

/* EST FLOW */
case "est":
  if(text==="Yes"){
    session.step="est_project";
    return bot.sendMessage(uid,"Which National/OC project are you part of?");
  }

  if(session.role==="EB") return proceedAchievements(uid,session);
  return finishCheckIn(uid,session);

case "est_project":
  session.answers.est_project=text;
  session.questions = questions.buildQuestionSet(currentMonth(),"est");
  session.index=0;
  session.step="est_questions";
  return bot.sendMessage(uid,session.questions[0].text,{reply_markup:{keyboard:scale,one_time_keyboard:true}});

case "est_questions":
  session.answers[`est_${session.questions[session.index].code}`]=text;
  session.index++;

  if(session.index < session.questions.length)
    return bot.sendMessage(uid,session.questions[session.index].text,{reply_markup:{keyboard:scale,one_time_keyboard:true}});

  if(session.role==="EB") return proceedAchievements(uid,session);
  return finishCheckIn(uid,session);

/* EB KPI FLOW */
case "deptQuestions":
  session.kpi_dept=text;
  session.kpi_index=0;
  session.answers[text]={};
  session.step="achievements_dept";
  return sendKPIQuestion(uid,session);

case "achievements_dept":
  const dept=session.kpi_dept;
  session.answers[dept][session.kpi_index]=text;
  session.kpi_index++;

  if(session.kpi_index < deptQuestions[dept].length)
    return sendKPIQuestion(uid,session);

  session.step="final_messages";
  return bot.sendMessage(uid,"Any final messages you'd like to share?");

case "final_messages":
  session.answers.final_messages=text;
  return finishCheckIn(uid,session);

}
});

/* ------------------ KPI FUNCTIONS ------------------ */
function proceedAchievements(uid,session){
  session.step="deptQuestions";
  bot.sendMessage(uid,"Which department are you an EB of?",{reply_markup:{keyboard:lcvpFunctions,one_time_keyboard:true}});
}

function sendKPIQuestion(uid,session){
  const dept=session.kpi_dept;
  const metrics=deptQuestions[dept];
  const q=metrics[session.kpi_index];

  const text = dept==="TM"
    ? `How many people are in the "${q}" department? (Please input it as #VP, #TL, #Members, #Directors - Example: 1, 3, 9, 0) 👥`
    : typeof q==="object"
      ? `How many ${q.code} did you achieve this month? ${q.text}`
      : q;

  bot.sendMessage(uid,text);
}

/* ------------------ FINISH ------------------ */
async function finishCheckIn(uid,session){
  const user=storage.getUser(uid);

  const row=[
    new Date().toISOString(),
    user.name,
    user.nickname,
    user.lc,
    session.role,
    JSON.stringify(session.answers)
  ];

  try{ await sheets.submitRow(row); }
  catch(err){ console.error("Google Sheets error:",err); }

  storage.clearAnswers(uid);
  bot.sendMessage(uid,"Thank you! 💙🐋\nYour feedback has been submitted ✨ Thank you for building #FearlessAPHL with us!");
  delete sessions[uid];
}