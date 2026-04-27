require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const storage = require("./storage");
const questions = require("./questions");
const sheets = require("./sheets");

const TOKEN = process.env.TOKEN;
const FORCE_MONTH = "March";

/* ---------------- BOT INITIALIZATION ---------------- */

let bot;

if (process.env.WEBHOOK_URL) {
  const express = require("express");
  const app = express();
  app.use(express.json());

  bot = new TelegramBot(TOKEN, { polling: false });

  const webhookPath = `/webhook/${TOKEN}`;
  const fullWebhookUrl = `${process.env.WEBHOOK_URL}${webhookPath}`;

  bot.setWebHook(fullWebhookUrl);

  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.get("/", (_req, res) => res.send("MXS Bot running"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
} else {
  bot = new TelegramBot(TOKEN, { polling: true });
}

/* ---------------- KEYBOARDS ---------------- */

const yesNo = [["Yes", "No"]];

const scale = [["1: Not Really"], ["3: Somehow"], ["5: Yes Definitely"]];

const roles = [["Member", "TL"], ["EB", "LCP"], ["MCVP"]];

const lcs = [
  ["MC", "ADMU", "CSB"],
  ["DLSU", "UPC", "UPD"],
  ["UPLB", "UPM", "UST"]
];

const departments = [["TM", "FLA", "OGX"], ["IGV", "IGT", "BD"], ["MKT", "PR", "EWA"]];

/* ---------------- KPI DATA ---------------- */

const deptQuestions = {
  TM: ["P", "TM", "FLA", "OGX", "IGV", "IGT", "MKT", "EWA", "PR", "BD"],

  FLA: [
    "$ Total Revenue Recognised 💰",
    "$ Net Profit 💸",
    "%Budget Variance (GvA) 📈",
    "%FSI Compliance Rate 📋"
  ],

  OGX: ["#APL 👥", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],

  IGV: ["#Opportunities Opened 🔎", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],

  IGT: ["#Opportunities Opened 🔎", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],

  MKT: ["#Digital Campaigns 📱", "Physical Campaigns/Projects 🎪", "#Sign-ups 📝"],

  BD: ["$BD Revenue Recognised 💰", "#GEPP Closed 🤝", "%SOP Compliance 📋", "Average Partner NPS 💯"],

  EWA: [
    "Total Event Sign-ups 📝",
    "#EwA Events Executed 🎪",
    "%EwA2ELD ⚡️",
    "#EwA Partners Closed 🤝",
    "$Event Revenue Recognised 💰"
  ],

  PR: [
    "Total Event Sign-ups 📝",
    "#PR Events Executed 🎪",
    "%PR2ELD ⚡️",
    "#PR Partners Closed 🤝",
    "$Event Revenue Recognised 💰"
  ]
};

/* ---------------- CONTEXT QUESTIONS ---------------- */

const contextQuestions = [
  "What were your top 3 focuses for the month of April? 🌟",
  "What worked well this month in terms of operations? Please provide as much context as possible! 💙",
  "What could have been improved this month in terms of operations? Please provide as much context as possible!  🌱",
  "What was the context of your LC or department this month? Please provide as much information as possible! 🌍",
  "What are your ways forwards and focus areas for May? 🚀"
];

/* ---------------- FORCE MONTH ---------------- */

function currentMonth() {
  return FORCE_MONTH;
}

/* ---------------- SESSION STORAGE ---------------- */

const sessions = {};

/* ---------------- HELPERS ---------------- */

function removeKeyboard() {
  return { remove_keyboard: true };
}

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

  return bot
    .sendMessage(
      uid,
      "Before we wrap up, here are a few leadership reflection questions for this month ✨",
      { reply_markup: removeKeyboard() }
    )
    .then(() => sendContextQuestion(uid, session));
}

function sendContextQuestion(uid, session) {
  return bot.sendMessage(
    uid,
    `Question ${session.context_index + 1} of ${contextQuestions.length}

${contextQuestions[session.context_index]}`,
    { reply_markup: removeKeyboard() }
  );
}

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

  return askNAMS(uid, session);
}

function askNAMS(uid, session, needsReminder = false) {
  session.step = "nams";

  const message = needsReminder
    ? `We can only encode your MXS response once you provide a NAMS reference code.

Please enter your NAMS reference code to continue.`
    : `Before we finish 💙

Please enter your NAMS reference code.

We can only encode your MXS response once a NAMS reference code is provided.`;

  return bot.sendMessage(uid, message, {
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

Let's have a quick chat about how your month went.

This check-in is for the month of ${currentMonth()}, even if you're answering later.

What is your full name?
(Last, First)`,
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
      session.answers.role = text;
      session.questions = questions.buildQuestionSet(currentMonth(), "receive");
      session.index = 0;
      session.step = "receive";

      await bot.sendMessage(
        uid,
        `First, please answer these in the context of whether you received the following standards.

In the month of ${currentMonth()}, I felt... 💙`
      );

      return sendQuestion(uid, session);

    case "receive":
      session.answers[`receive_${session.questions[session.index].code}`] = text;
      session.index++;

      if (session.index < session.questions.length) {
        return sendQuestion(uid, session);
      }

      if (session.role === "Member") {
        return promptEst(uid, session);
      }

      session.questions = questions.buildQuestionSet(currentMonth(), "give");
      session.index = 0;
      session.step = "give";

      await bot.sendMessage(
        uid,
        `Now let's answer these in the context of whether you gave the following standards to your members.

In the month of ${currentMonth()}, I was able to...`
      );

      return sendQuestion(uid, session);

    case "give":
      session.answers[`give_${session.questions[session.index].code}`] = text;
      session.index++;

      if (session.index < session.questions.length) {
        return sendQuestion(uid, session);
      }

      return promptEst(uid, session);

    case "est":
      session.answers.in_est = text;

      if (text === "Yes") {
        session.step = "est_project";

        return bot.sendMessage(uid, "What EST or National OC are you part of?", {
          reply_markup: removeKeyboard()
        });
      }

      return goToPostEst(uid, session);

    case "est_project":
      session.answers.est_project = text;
      session.questions = questions.buildQuestionSet(currentMonth(), "est");
      session.index = 0;
      session.step = "est_questions";

      await bot.sendMessage(
        uid,
        `Please answer these in the context of the standards you received in EST/National OC.

In the month of ${currentMonth()}, I felt... 🌍`
      );

      return sendQuestion(uid, session);

    case "est_questions":
      session.answers[`est_${session.questions[session.index].code}`] = text;
      session.index++;

      if (session.index < session.questions.length) {
        return sendQuestion(uid, session);
      }

      return goToPostEst(uid, session);

    case "dept":
      session.kpi_dept = text;
      session.answers.department = text;
      session.kpi_index = 0;
      session.answers.kpi = {};
      session.step = "kpi";

      await bot.sendMessage(
        uid,
        `Now please input your achieved KPI numbers for the month of ${currentMonth()}.`,
        { reply_markup: removeKeyboard() }
      );

      return sendKPI(uid, session);

    case "kpi": {
      const dept = session.kpi_dept;
      const metric = deptQuestions[dept][session.kpi_index];

      session.answers.kpi[metric] = text;
      session.kpi_index++;

      if (session.kpi_index < deptQuestions[dept].length) {
        return sendKPI(uid, session);
      }

      return startContext(uid, session);
    }

    case "context":
      session.answers.context[session.context_index] = text;
      session.context_index++;

      if (session.context_index < contextQuestions.length) {
        return sendContextQuestion(uid, session);
      }

      return askNAMS(uid, session);

    case "nams":
      if (!text) {
        return askNAMS(uid, session, true);
      }

      session.answers.nams_reference = text;
      session.step = "final";

      return bot.sendMessage(uid, "Any last messages? 💬", {
        reply_markup: removeKeyboard()
      });

    case "final":
      session.answers.final_messages = text;
      return finish(uid, session);

    default:
      return null;
  }
});

/* ---------------- QUESTION SENDER ---------------- */

function sendQuestion(uid, session) {
  const q = session.questions[session.index];

  return bot.sendMessage(
    uid,
    `Question ${session.index + 1} of ${session.questions.length}

${q.text}`,
    { reply_markup: { keyboard: scale, one_time_keyboard: true } }
  );
}

/* ---------------- KPI FUNCTIONS ---------------- */

function sendKPI(uid, session) {
  const dept = session.kpi_dept;
  const metrics = deptQuestions[dept];
  const q = metrics[session.kpi_index];

  return bot.sendMessage(
    uid,
    `Metric ${session.kpi_index + 1} of ${metrics.length}

${q}`
  );
}

/* ---------------- FINISH ---------------- */

async function finish(uid, session) {
  const user = storage.getUser(uid);
  const namsReference = session.answers.nams_reference;

  if (!namsReference) {
    return askNAMS(uid, session, true);
  }

  const row = [
    new Date().toISOString(),
    currentMonth(),
    namsReference,
    user.name,
    user.lc,
    session.role,
    JSON.stringify(session.answers)
  ];

  try {
    await sheets.submitRow(row);
  } catch (err) {
    console.error(err);
    return bot.sendMessage(
      uid,
      "Something went wrong while submitting your response. Please try sending your last message again in a moment."
    );
  }

  storage.clearAnswers(uid);

  await bot.sendMessage(
    uid,
    `Thank you for building #FearlessAPHL with us. 💙🐋

Your feedback for ${currentMonth()} has been submitted.`
  );

  delete sessions[uid];
}
