require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const storage = require("./storage");
const questions = require("./questions");
const sheets = require("./sheets");

const TOKEN = process.env.TOKEN;
const FORCE_MONTH = "April";

/* ---------------- INIT ---------------- */

let bot;

if (process.env.WEBHOOK_URL) {
  const express = require("express");
  const app = express();
  app.use(express.json());

  bot = new TelegramBot(TOKEN, { polling: false });

  const path = `/webhook/${TOKEN}`;
  bot.setWebHook(`${process.env.WEBHOOK_URL}${path}`);

  app.post(path, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.listen(process.env.PORT || 3000);
} else {
  bot = new TelegramBot(TOKEN, { polling: true });
}

/* ---------------- CONSTANTS ---------------- */

const yesNo = [["Yes", "No"]];
const scale = [["1: Not Really"], ["3: Somehow"], ["5: Yes Definitely"]];
const roles = [["Member", "TL"], ["EB", "LCP"], ["MCVP"]];
const lcs = [["MC", "ADMU", "CSB"], ["DLSU", "UPC", "UPD"], ["UPLB", "UPM", "UST"]];
const departments = [["TM", "FLA", "OGX"], ["IGV", "IGT", "BD"], ["MKT", "PR", "EWA"]];

function currentMonth() {
  return FORCE_MONTH;
}

const sessions = {};

const contextQuestions = [
  "What were your top 3 focuses for April? 🌟",
  "What worked well? 💙",
  "What could have been improved? 🌱",
  "What was your LC/department context? 🌍",
  "What are your focus areas for May? 🚀"
];

function removeKeyboard() {
  return { remove_keyboard: true };
}

/* ---------------- FLOW HELPERS ---------------- */

function promptEst(uid, session) {
  session.step = "est";
  return bot.sendMessage(uid, "Are you in EST or a National OC this term? 🌍", {
    reply_markup: { keyboard: yesNo, one_time_keyboard: true }
  });
}

function startContext(uid, session) {
  session.step = "context";
  session.context_index = 0;
  session.answers.context = [];

  return sendContextQuestion(uid, session);
}

function sendContextQuestion(uid, session) {
  return bot.sendMessage(
    uid,
    `Question ${session.context_index + 1}/${contextQuestions.length}\n\n${contextQuestions[session.context_index]}`,
    { reply_markup: removeKeyboard() }
  );
}

/* 🔥 FIXED: Proper routing */
function goToPostEst(uid, session) {
  if (session.role === "EB") {
    session.step = "dept";
    return bot.sendMessage(uid, "What is your department?", {
      reply_markup: { keyboard: departments, one_time_keyboard: true }
    });
  }

  if (session.role === "LCP") {
    return startContext(uid, session);
  }

  // Everyone else → skip context
  session.step = "final";
  return bot.sendMessage(uid, "Any last messages? 💬", {
    reply_markup: removeKeyboard()
  });
}

/* ---------------- START ---------------- */

bot.onText(/\/checkin/, (msg) => {
  const uid = msg.from.id;

  sessions[uid] = {
    step: "name",
    role: null,
    answers: {},
    questions: [],
    index: 0,
    kpi_dept: null,
    kpi_index: 0,
    context_index: 0
  };

  bot.sendMessage(
    uid,
    `Hi ${msg.from.first_name}! 💙🐋

April check-in 🌿

Please enter your NAMS Code to begin.`,
    { reply_markup: removeKeyboard() }
  );
});

/* ---------------- MESSAGE HANDLER ---------------- */

bot.on("message", async (msg) => {
  const uid = msg.from.id;
  if (!sessions[uid] || !msg.text || msg.text.startsWith("/")) return;

  const session = sessions[uid];
  const text = msg.text.trim();

  switch (session.step) {
    case "name":
      storage.updateUser(uid, { name: text });
      session.answers.name = text;
      session.step = "lc";
      return bot.sendMessage(uid, "What is your LC?", {
        reply_markup: { keyboard: lcs, one_time_keyboard: true }
      });

    case "lc":
      storage.updateUser(uid, { lc: text });
      session.answers.lc = text;
      session.step = "role";
      return bot.sendMessage(uid, "What is your role?", {
        reply_markup: { keyboard: roles, one_time_keyboard: true }
      });

    case "role":
      storage.updateUser(uid, { role: text });
      session.role = text;

      session.questions = questions.buildQuestionSet(currentMonth(), "receive") || [];
      session.index = 0;
      session.step = "receive";

      await bot.sendMessage(uid, `In ${currentMonth()}, I felt... 💙`);
      return sendQuestion(uid, session);

    case "receive":
      session.answers[`receive_${session.questions[session.index]?.code}`] = text;
      session.index++;

      if (session.index < session.questions.length) return sendQuestion(uid, session);

      if (session.role === "Member") return promptEst(uid, session);

      session.questions = questions.buildQuestionSet(currentMonth(), "give") || [];
      session.index = 0;
      session.step = "give";

      await bot.sendMessage(uid, `In ${currentMonth()}, I was able to...`);
      return sendQuestion(uid, session);

    case "give":
      session.answers[`give_${session.questions[session.index]?.code}`] = text;
      session.index++;

      if (session.index < session.questions.length) return sendQuestion(uid, session);

      return promptEst(uid, session);

    case "est":
      session.answers.in_est = text;

      if (text === "Yes") {
        session.step = "est_project";
        return bot.sendMessage(uid, "Which EST/OC?");
      }

      return goToPostEst(uid, session);

    case "est_project":
      session.answers.est_project = text;
      session.questions = questions.buildQuestionSet(currentMonth(), "est") || [];
      session.index = 0;
      session.step = "est_questions";

      await bot.sendMessage(uid, `EST reflection 🌍`);
      return sendQuestion(uid, session);

    case "est_questions":
      session.answers[`est_${session.questions[session.index]?.code}`] = text;
      session.index++;

      if (session.index < session.questions.length) return sendQuestion(uid, session);

      return goToPostEst(uid, session);

    case "dept":
      session.kpi_dept = text;
      session.answers.kpi = {};
      session.kpi_index = 0;
      session.step = "kpi";

      return bot.sendMessage(uid, `Enter KPIs for ${currentMonth()}`);

    case "kpi":
      const metrics = deptQuestions[session.kpi_dept];
      const metric = metrics[session.kpi_index];

      session.answers.kpi[metric] = text;
      session.kpi_index++;

      if (session.kpi_index < metrics.length) {
        return bot.sendMessage(uid, `Metric ${session.kpi_index + 1}/${metrics.length}\n${metrics[session.kpi_index]}`);
      }

      return startContext(uid, session);

    case "context":
      session.answers.context[session.context_index] = text;
      session.context_index++;

      if (session.context_index < contextQuestions.length)
        return sendContextQuestion(uid, session);

      session.step = "final";
      return bot.sendMessage(uid, "Any last messages? 💬");

    case "final":
      session.answers.final_messages = text;
      return finish(uid, session);
  }
});

/* ---------------- HELPERS ---------------- */

function sendQuestion(uid, session) {
  const q = session.questions[session.index];

  if (!q) {
    return bot.sendMessage(uid, "⚠️ Error loading question. Check questions.js");
  }

  return bot.sendMessage(uid, `Q${session.index + 1}: ${q.text}`, {
    reply_markup: { keyboard: scale, one_time_keyboard: true }
  });
}

/* ---------------- FINISH ---------------- */

async function finish(uid, session) {
  const user = storage.getUser(uid);

  const row = [
    new Date().toISOString(),
    currentMonth(),
    user.name,
    user.name,
    user.lc,
    session.role,
    JSON.stringify(session.answers)
  ];

  try {
    await sheets.submitRow(row);
  } catch (err) {
    console.error(err);
    return bot.sendMessage(uid, "Submission failed. Try again.");
  }

  storage.clearAnswers(uid);

  await bot.sendMessage(uid, `Submitted 💙 Thank you for building #FearlessAPHL`);

  delete sessions[uid];
}
