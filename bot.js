require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const storage = require("./storage");
const questions = require("./questions");
const sheets = require("./sheets");
const lcQuestionsModule = require("./lc-questions");

const TOKEN = process.env.TOKEN;

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

  app.get("/", (_req, res) => res.send("NAMS Bot running"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
} else {
  bot = new TelegramBot(TOKEN, { polling: true });
}

/* ---------------- KEYBOARDS ---------------- */
const yesNo = [["Yes", "No"]];
const scale = [["1: Not Really"], ["3: Somehow"], ["5: Yes Definitely"]];
const roles = [["Member", "TL"], ["VP", "LCP"], ["MCVP"]];
const lcs = [["MC", "ADMU", "CSB"], ["DLSU", "UPC", "UPD"], ["UPLB", "UPM", "UST"]];
const departments = [["TM", "FLA", "OGX"], ["IGV", "IGT", "BD"], ["MKT", "PR", "EWA"]];
const exchangeInfluencers = [["Price", "Timeline"], ["Family", "Academics"], ["Others - Please specify"]];
const natconOptions = [["HELL YEAH 🔥"], ["NOPE ZZZ 😴"], ["STILL DECIDING 🤔"]];

/* ---------------- VALID OPTIONS ---------------- */
const VALID_ROLES = new Set(["Member", "TL", "VP", "LCP", "MCVP"]);
const VALID_LCS = new Set(["MC", "ADMU", "CSB", "DLSU", "UPC", "UPD", "UPLB", "UPM", "UST"]);
const VALID_DEPARTMENTS = new Set(["TM", "FLA", "OGX", "IGV", "IGT", "BD", "MKT", "PR", "EWA"]);
const VALID_YES_NO = new Set(["Yes", "No"]);
const VALID_EXCHANGE_INFLUENCERS = new Set(["Price", "Timeline", "Family", "Academics", "Others - Please specify"]);
const VALID_NATCON_OPTIONS = new Set(["HELL YEAH 🔥", "NOPE ZZZ 😴", "STILL DECIDING 🤔"]);

/* ---------------- KPI DATA ---------------- */
const deptQuestions = {
  TM: ["P", "TM", "FLA", "OGX", "IGV", "IGT", "MKT", "EWA", "PR", "BD"],
  FLA: ["$ Total Revenue Recognised 💰", "$ Net Profit 💸", "%Budget Variance (GvA) 📈", "%FSI Compliance Rate 📋"],
  OGX: ["#APL 👥", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],
  IGV: ["#Opportunities Opened 🔎", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],
  IGT: ["#Opportunities Opened 🔎", "#APD ✅", "#RE ✈️", "#FI 🌍", "Average NPS 💯"],
  MKT: ["#Digital Campaigns 📱", "Physical Campaigns/Projects 🎪", "#Sign-ups 📝"],
  BD: ["$BD Revenue Recognised 💰", "#GEPP Closed 🤝", "%SOP Compliance 📋", "Average Partner NPS 💯"],
  EWA: ["Total Event Sign-ups 📝", "#EwA Events Executed 🎪", "%EwA2ELD ⚡️", "#EwA Partners Closed 🤝", "$Event Revenue Recognised 💰"],
  PR: ["Total Event Sign-ups 📝", "#PR Events Executed 🎪", "%PR2ELD ⚡️", "#PR Partners Closed 🤝", "$Event Revenue Recognised 💰"]
};

/* ---------------- SESSION STORE ---------------- */
const sessions = {};

function currentMonth() {
  return questions.TXP_MONTH;
}

function removeKeyboard() {
  return { remove_keyboard: true };
}

function getQuestionsForLC(lc) {
  if (!lcQuestionsModule) return [];

  if (typeof lcQuestionsModule === "function") {
    return lcQuestionsModule(lc) || [];
  }

  if (typeof lcQuestionsModule.getQuestionsForLC === "function") {
    return lcQuestionsModule.getQuestionsForLC(lc) || [];
  }

  if (typeof lcQuestionsModule.getLcQuestions === "function") {
    return lcQuestionsModule.getLcQuestions(lc) || [];
  }

  return [];
}

function isValidChoice(value, validSet) {
  return typeof value === "string" && validSet.has(value);
}

function sendInvalidChoiceMessage(uid, message, keyboard) {
  return bot.sendMessage(uid, message, {
    reply_markup: { keyboard, one_time_keyboard: true }
  });
}

function getQuestionByIndex(list, index) {
  if (!Array.isArray(list)) return null;
  if (typeof index !== "number") return null;
  if (index < 0 || index >= list.length) return null;
  return list[index];
}

function getQuestionCode(question, fallbackPrefix, index) {
  if (!question || typeof question !== "object") {
    return `${fallbackPrefix}_${index}`;
  }

  if (question.code) return question.code;
  if (question.field) return question.field;

  return `${fallbackPrefix}_${index}`;
}

function getQuestionText(question) {
  if (!question || typeof question !== "object") return "";
  return question.text || question.prompt || "";
}

function getQuestionType(question) {
  if (!question || typeof question !== "object") return null;
  return question.type || null;
}

function getQuestionOptions(question) {
  if (!question || typeof question !== "object") return [];
  return Array.isArray(question.options) ? question.options : [];
}

async function advancePastMessageOnlyLcQuestions(uid, session) {
  while (true) {
    const q = getQuestionByIndex(session.lc_questions, session.lc_index);

    if (!q) {
      return askNatCon(uid, session);
    }

    const type = getQuestionType(q);
    const text = getQuestionText(q);

    if (type !== "message") {
      return sendLCQuestion(uid, session);
    }

    await bot.sendMessage(uid, text, { reply_markup: removeKeyboard() });
    session.lc_index += 1;
  }
}

function shouldAskEst(role) {
  return ["Member", "TL", "VP", "LCP", "MCVP"].includes(role);
}

/* ---------------- INTRO MESSAGE ---------------- */
const INTRO_MESSAGE = `Hi there! Welcome to the last National AIESEC Membership Survey for this TXP 💙

We'd really love your honest thoughts here 😊 Your responses help us understand your experience better and add more context to what comes up in your MXS Check-In.

The more open you are, the easier it is for us to create better spaces, stronger support, and more meaningful experiences for members across the network ✨

This should only take a few minutes, and we'll go one question at a time 🌼`;

/* ---------------- START ---------------- */
bot.onText(/\/start|\/checkin/, (msg) => {
  const uid = msg.from.id;

  sessions[uid] = {
    step: "name",
    role: null,
    lc: null,
    answers: {},
    lps_index: 0,
    exchange_index: 0,
    national_index: 0,
    leader_targets: [],
    leader_questions: [],
    leader_index: 0,
    mxs_questions: [],
    mxs_index: 0,
    est_index: 0,
    est_questions: [],
    kpi_dept: null,
    kpi_index: 0,
    context_index: 0,
    lc_questions: [],
    lc_index: 0
  };

  bot
    .sendMessage(uid, INTRO_MESSAGE, { reply_markup: removeKeyboard() })
    .then(() =>
      bot.sendMessage(
        uid,
        "Please enter your unique personal NAMS Code to begin. If you don't have one, just type your first and last name instead 📝"
      )
    )
    .catch((err) => {
      console.error("Failed to start survey:", err);
    });
});

/* ---------------- MESSAGE HANDLER ---------------- */
bot.on("message", async (msg) => {
  const uid = msg.from.id;
  if (!sessions[uid] || !msg.text || msg.text.startsWith("/")) return;

  const session = sessions[uid];
  const text = msg.text.trim();

  try {
    switch (session.step) {
      case "name":
        storage.updateUser(uid, { name: text });
        session.answers.name = text;
        session.step = "role";

        return bot.sendMessage(uid, "What's your role? 🎭", {
          reply_markup: { keyboard: roles, one_time_keyboard: true }
        });

      case "role":
        if (!isValidChoice(text, VALID_ROLES)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose your role using one of the provided buttons 😊",
            roles
          );
        }

        storage.updateUser(uid, { role: text });
        session.role = text;
        session.step = "lps";
        session.lps_index = 0;

        await bot.sendMessage(uid, "Let's start with some quick thoughts 🌟", {
          reply_markup: removeKeyboard()
        });
        return sendLPSQuestion(uid, session);

      case "lps": {
        const lpsQ = getQuestionByIndex(questions.LPS, session.lps_index);
        if (!lpsQ) {
          return handleFlowError(uid, session, "LPS question not found.");
        }

        session.answers[lpsQ.code] = text;
        session.lps_index += 1;

        if (session.lps_index < questions.LPS.length) {
          return sendLPSQuestion(uid, session);
        }

        session.step = "exchange";
        session.exchange_index = 0;

        await bot.sendMessage(uid, "Now let's talk about exchange opportunities! ✈️");
        return sendExchangeQuestion(uid, session);
      }

      case "exchange": {
        const exchQ = getQuestionByIndex(questions.EXCHANGE, session.exchange_index);
        if (!exchQ) {
          return handleFlowError(uid, session, "Exchange question not found.");
        }

        if (exchQ.type === "choice" && !isValidChoice(text, VALID_EXCHANGE_INFLUENCERS)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose one of the provided options for this question 😊",
            exchangeInfluencers
          );
        }

        session.answers[exchQ.code] = text;
        session.exchange_index += 1;

        if (session.exchange_index < questions.EXCHANGE.length) {
          return sendExchangeQuestion(uid, session);
        }

        session.step = "national";
        session.national_index = 0;

        await bot.sendMessage(uid, "Some questions about the national network 🇵🇭");
        return sendNationalQuestion(uid, session);
      }

      case "national": {
        const natQ = getQuestionByIndex(questions.NATIONAL, session.national_index);
        if (!natQ) {
          return handleFlowError(uid, session, "National question not found.");
        }

        if (natQ.type === "yesno" && !isValidChoice(text, VALID_YES_NO)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose Yes or No using the provided buttons 😊",
            yesNo
          );
        }

        session.answers[natQ.code] = text;
        session.national_index += 1;

        if (session.national_index < questions.NATIONAL.length) {
          return sendNationalQuestion(uid, session);
        }

        session.leader_targets = questions.getLeaderTargets(session.role);
        session.leader_questions = questions.getDirectLeaderQuestions(session.leader_targets);
        session.leader_index = 0;

        if (Array.isArray(session.leader_questions) && session.leader_questions.length > 0) {
          session.step = "direct_leader";
          await bot.sendMessage(uid, "Time for some feedback on your direct leaders 🌟");
          return sendDirectLeaderQuestion(uid, session);
        }

        return startMXS(uid, session);
      }

      case "direct_leader": {
        const leaderQ = getQuestionByIndex(session.leader_questions, session.leader_index);
        if (!leaderQ) {
          return handleFlowError(uid, session, "Direct leader question not found.");
        }

        session.answers[leaderQ.code] = text;
        session.leader_index += 1;

        if (session.leader_index < session.leader_questions.length) {
          return sendDirectLeaderQuestion(uid, session);
        }

        return startMXS(uid, session);
      }

      case "mxs_receive": {
        const receiveQ = getQuestionByIndex(session.mxs_questions, session.mxs_index);
        if (!receiveQ) {
          return handleFlowError(uid, session, "MXS receive question not found.");
        }

        session.answers[`receive_${receiveQ.code}`] = text;
        session.mxs_index += 1;

        if (session.mxs_index < session.mxs_questions.length) {
          return sendMXSQuestion(uid, session);
        }

        if (session.role !== "Member") {
          session.mxs_questions = questions.GIVE;
          session.mxs_index = 0;
          session.step = "mxs_give";

          await bot.sendMessage(uid, `In ${currentMonth()}, I was able to... 💪`);
          return sendMXSQuestion(uid, session);
        }

        return startEst(uid, session);
      }

      case "mxs_give": {
        const giveQ = getQuestionByIndex(session.mxs_questions, session.mxs_index);
        if (!giveQ) {
          return handleFlowError(uid, session, "MXS give question not found.");
        }

        session.answers[`give_${giveQ.code}`] = text;
        session.mxs_index += 1;

        if (session.mxs_index < session.mxs_questions.length) {
          return sendMXSQuestion(uid, session);
        }

        return startEst(uid, session);
      }

      case "est":
        if (!isValidChoice(text, VALID_YES_NO)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose Yes or No using the provided buttons 😊",
            yesNo
          );
        }

        session.answers.in_est = text;

        if (text === "Yes") {
          session.step = "est_project";
          return bot.sendMessage(uid, "Which EST/OC? 🌍", {
            reply_markup: removeKeyboard()
          });
        }

        return goToPostEst(uid, session);

      case "est_project":
        session.answers.est_project = text;
        session.est_questions = questions.EST;
        session.est_index = 0;
        session.step = "est_questions";

        if (!Array.isArray(session.est_questions) || session.est_questions.length === 0) {
          return goToPostEst(uid, session);
        }

        await bot.sendMessage(uid, "EST reflection 🌍", {
          reply_markup: removeKeyboard()
        });
        return sendEstQuestion(uid, session);

      case "est_questions": {
        const estQ = getQuestionByIndex(session.est_questions, session.est_index);
        if (!estQ) {
          return goToPostEst(uid, session);
        }

        session.answers[`est_${estQ.code}`] = text;
        session.est_index += 1;

        if (session.est_index < session.est_questions.length) {
          return sendEstQuestion(uid, session);
        }

        return goToPostEst(uid, session);
      }

      case "dept":
        if (!isValidChoice(text, VALID_DEPARTMENTS)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose your department using one of the provided buttons 😊",
            departments
          );
        }

        if (!Array.isArray(deptQuestions[text])) {
          return sendInvalidChoiceMessage(
            uid,
            "That department isn't available right now. Please choose one of the provided buttons 😊",
            departments
          );
        }

        session.kpi_dept = text;
        session.answers.department = text;
        session.answers.kpi = {};
        session.kpi_index = 0;
        session.step = "kpi";

        await bot.sendMessage(uid, `Let's log your KPIs for ${currentMonth()} 📊`, {
          reply_markup: removeKeyboard()
        });
        return sendKPI(uid, session);

      case "kpi": {
        const dept = session.kpi_dept;
        const metrics = deptQuestions[dept];

        if (!Array.isArray(metrics) || metrics.length === 0) {
          return handleFlowError(uid, session, "KPI metrics not found for department.");
        }

        const metric = metrics[session.kpi_index];
        if (!metric) {
          return handleFlowError(uid, session, "KPI metric not found.");
        }

        session.answers.kpi[metric] = text;
        session.kpi_index += 1;

        if (session.kpi_index < metrics.length) {
          return sendKPI(uid, session);
        }

        return startContext(uid, session);
      }

      case "context": {
        const contextQ = getQuestionByIndex(questions.CONTEXT, session.context_index);
        if (!contextQ) {
          return handleFlowError(uid, session, "Context question not found.");
        }

        session.answers.context = session.answers.context || [];
        session.answers.context[session.context_index] = text;
        session.context_index += 1;

        if (session.context_index < questions.CONTEXT.length) {
          return sendContextQuestion(uid, session);
        }

        return askLC(uid, session);
      }

      case "lc":
        if (!isValidChoice(text, VALID_LCS)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose your LC using one of the provided buttons 😊",
            lcs
          );
        }

        storage.updateUser(uid, { lc: text });
        session.lc = text;
        session.answers.lc = text;

        session.lc_questions = getQuestionsForLC(text);
        session.lc_index = 0;

        if (Array.isArray(session.lc_questions) && session.lc_questions.length > 0) {
          session.step = "lc_specific";
          await bot.sendMessage(uid, `A few questions specific to ${text} 🏠`);
          return advancePastMessageOnlyLcQuestions(uid, session);
        }

        return askNatCon(uid, session);

      case "lc_specific": {
        const lcQ = getQuestionByIndex(session.lc_questions, session.lc_index);
        if (!lcQ) {
          return askNatCon(uid, session);
        }

        const lcType = getQuestionType(lcQ);
        const lcText = getQuestionText(lcQ);
        const lcCode = getQuestionCode(lcQ, "lc_question", session.lc_index);

        if (lcType === "message") {
          await bot.sendMessage(uid, lcText, { reply_markup: removeKeyboard() });
          session.lc_index += 1;
          return advancePastMessageOnlyLcQuestions(uid, session);
        }

        if (lcType === "choice") {
          const lcOptions = getQuestionOptions(lcQ);
          if (lcOptions.length > 0 && !lcOptions.includes(text)) {
            return bot.sendMessage(uid, "Please choose one of the provided options 😊", {
              reply_markup: {
                keyboard: lcOptions.map((opt) => [opt]),
                one_time_keyboard: true
              }
            });
          }
        }

        if (lcType === "yesno" && !isValidChoice(text, VALID_YES_NO)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose Yes or No using the provided buttons 😊",
            yesNo
          );
        }

        session.answers[lcCode] = text;
        session.lc_index += 1;

        if (session.lc_index < session.lc_questions.length) {
          return advancePastMessageOnlyLcQuestions(uid, session);
        }

        return askNatCon(uid, session);
      }

      case "natcon":
        if (!isValidChoice(text, VALID_NATCON_OPTIONS)) {
          return sendInvalidChoiceMessage(
            uid,
            "Please choose one of the provided NatCon options 😊",
            natconOptions
          );
        }

        session.answers.natcon = text;
        session.step = "final";
        return bot.sendMessage(uid, "Any last messages or thoughts you'd like to share? 💬", {
          reply_markup: removeKeyboard()
        });

      case "final":
        session.answers.final_messages = text;
        return finish(uid, session);

      default:
        return bot.sendMessage(
          uid,
          "Something got a little lost on our end 😅 Please send /checkin to restart the survey."
        );
    }
  } catch (err) {
    console.error("Unhandled bot message error:", err);
    return bot.sendMessage(
      uid,
      "Something went wrong while saving your response 😅 Please try sending that answer again."
    );
  }
});

/* ---------------- QUESTION SENDERS ---------------- */

function sendLPSQuestion(uid, session) {
  const q = getQuestionByIndex(questions.LPS, session.lps_index);
  if (!q) {
    return handleFlowError(uid, session, "LPS question not found during send.");
  }

  return bot.sendMessage(uid, q.text, { reply_markup: removeKeyboard() });
}

function sendExchangeQuestion(uid, session) {
  const q = getQuestionByIndex(questions.EXCHANGE, session.exchange_index);
  if (!q) {
    return handleFlowError(uid, session, "Exchange question not found during send.");
  }

  if (q.type === "choice") {
    return bot.sendMessage(uid, q.text, {
      reply_markup: { keyboard: exchangeInfluencers, one_time_keyboard: true }
    });
  }

  return bot.sendMessage(uid, q.text, { reply_markup: removeKeyboard() });
}

function sendNationalQuestion(uid, session) {
  const q = getQuestionByIndex(questions.NATIONAL, session.national_index);
  if (!q) {
    return handleFlowError(uid, session, "National question not found during send.");
  }

  if (q.type === "yesno") {
    return bot.sendMessage(uid, q.text, {
      reply_markup: { keyboard: yesNo, one_time_keyboard: true }
    });
  }

  return bot.sendMessage(uid, q.text, { reply_markup: removeKeyboard() });
}

function sendDirectLeaderQuestion(uid, session) {
  const q = getQuestionByIndex(session.leader_questions, session.leader_index);
  if (!q) {
    return handleFlowError(uid, session, "Direct leader question not found during send.");
  }

  return bot.sendMessage(uid, q.text, { reply_markup: removeKeyboard() });
}

function sendMXSQuestion(uid, session) {
  const q = getQuestionByIndex(session.mxs_questions, session.mxs_index);
  if (!q) {
    return handleFlowError(uid, session, "MXS question not found during send.");
  }

  return bot.sendMessage(uid, `Q${session.mxs_index + 1}: ${q.text}`, {
    reply_markup: { keyboard: scale, one_time_keyboard: true }
  });
}

function sendEstQuestion(uid, session) {
  const q = getQuestionByIndex(session.est_questions, session.est_index);
  if (!q) {
    return goToPostEst(uid, session);
  }

  return bot.sendMessage(uid, `Q${session.est_index + 1}: ${q.text}`, {
    reply_markup: { keyboard: scale, one_time_keyboard: true }
  });
}

function sendKPI(uid, session) {
  const metrics = deptQuestions[session.kpi_dept];
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return handleFlowError(uid, session, "KPI metrics missing during send.");
  }

  const metric = metrics[session.kpi_index];
  if (!metric) {
    return handleFlowError(uid, session, "KPI metric missing during send.");
  }

  return bot.sendMessage(
    uid,
    `Metric ${session.kpi_index + 1}/${metrics.length}\n${metric}`,
    { reply_markup: removeKeyboard() }
  );
}

function sendContextQuestion(uid, session) {
  const q = getQuestionByIndex(questions.CONTEXT, session.context_index);
  if (!q) {
    return handleFlowError(uid, session, "Context question not found during send.");
  }

  return bot.sendMessage(
    uid,
    `Question ${session.context_index + 1}/${questions.CONTEXT.length}\n\n${q}`,
    { reply_markup: removeKeyboard() }
  );
}

function sendLCQuestion(uid, session) {
  const q = getQuestionByIndex(session.lc_questions, session.lc_index);
  if (!q) {
    return askNatCon(uid, session);
  }

  const type = getQuestionType(q);
  const text = getQuestionText(q);
  const options = getQuestionOptions(q);

  if (type === "choice" && options.length > 0) {
    return bot.sendMessage(uid, text, {
      reply_markup: {
        keyboard: options.map((opt) => [opt]),
        one_time_keyboard: true
      }
    });
  }

  if (type === "yesno") {
    return bot.sendMessage(uid, text, {
      reply_markup: { keyboard: yesNo, one_time_keyboard: true }
    });
  }

  return bot.sendMessage(uid, text, { reply_markup: removeKeyboard() });
}

/* ---------------- FLOW HELPERS ---------------- */

function startMXS(uid, session) {
  session.mxs_questions = questions.RECEIVE;
  session.mxs_index = 0;
  session.step = "mxs_receive";

  return bot
    .sendMessage(uid, `MXS Check-In time 📋 In ${currentMonth()}, I felt... 💙`, {
      reply_markup: removeKeyboard()
    })
    .then(() => sendMXSQuestion(uid, session));
}

function startEst(uid, session) {
  if (!shouldAskEst(session.role)) {
    return goToPostEst(uid, session);
  }

  session.step = "est";
  return bot.sendMessage(uid, "Are you in EST or a National OC this term? 🌍", {
    reply_markup: { keyboard: yesNo, one_time_keyboard: true }
  });
}

function goToPostEst(uid, session) {
  if (session.role === "VP") {
    session.step = "dept";
    return bot.sendMessage(uid, "What's your department? 🏢", {
      reply_markup: { keyboard: departments, one_time_keyboard: true }
    });
  }

  if (session.role === "LCP") {
    return startContext(uid, session);
  }

  return askLC(uid, session);
}

function startContext(uid, session) {
  session.step = "context";
  session.context_index = 0;
  session.answers.context = [];

  return bot
    .sendMessage(uid, "Leadership reflection time ✨", {
      reply_markup: removeKeyboard()
    })
    .then(() => sendContextQuestion(uid, session));
}

function askLC(uid, session) {
  session.step = "lc";
  return bot.sendMessage(uid, "What's your LC? 🏠", {
    reply_markup: { keyboard: lcs, one_time_keyboard: true }
  });
}

function askNatCon(uid, session) {
  session.step = "natcon";
  return bot.sendMessage(uid, questions.NATCON_QUESTION.text, {
    reply_markup: { keyboard: natconOptions, one_time_keyboard: true }
  });
}

function handleFlowError(uid, session, reason) {
  console.error("Survey flow error:", reason, {
    step: session && session.step,
    role: session && session.role,
    lc: session && session.lc
  });

  return bot.sendMessage(
    uid,
    "Something went wrong in the survey flow 😅 Your responses are still safe. Please send your last answer again, or restart with /checkin if needed."
  );
}

/* ---------------- FINISH ---------------- */
async function finish(uid, session) {
  const user = storage.getUser(uid) || {};
  const namsReference = session.answers.name || user.name || "";

  const row = [
    new Date().toISOString(),
    currentMonth(),
    namsReference,
    user.name || session.answers.name || "",
    session.lc || session.answers.lc || user.lc || "",
    session.role || user.role || "",
    JSON.stringify(session.answers)
  ];

  try {
    await sheets.submitRow(row);
  } catch (err) {
    console.error("Google Sheets submission failed:", err);
    return bot.sendMessage(
      uid,
      "Your responses are all saved, but submission didn't go through just yet 😅 Please send any message to try submitting again."
    );
  }

  try {
    storage.clearAnswers(uid);
  } catch (err) {
    console.error("Failed to clear stored answers:", err);
  }

  await bot.sendMessage(
    uid,
    `You're all done! 🎉 Thank you for building #FearlessAPHL with us this TXP.

To those who are stepping up and staying for another semester, see you soon~ 💙

And for those who are finishing up their experience, best of luck to whatever comes next! 🌟`,
    { reply_markup: removeKeyboard() }
  );

  delete sessions[uid];
}
