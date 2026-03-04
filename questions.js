// questions.js

/* ------------------------------------------------ */
/* QUESTION BANK — NEUTRAL BASE MEANING             */
/* (Never edit codes after launch)                  */
/* ------------------------------------------------ */

const MONTHLY = [
  { code: "1.1", base: "clear about responsibilities this month 📝" },
  { code: "1.2", base: "supported in personal growth 🌱" },
  { code: "2.3", base: "given spaces to learn and improve within the role 📚" },
  { code: "4.2", base: "given chances to engage with the community 🤝" },
  { code: "5.2", base: "doing okay and know where to get support 💛" },
  { code: "6.2", base: "given opportunities to bond with the team 🫂" },
  { code: "6.3", base: "given opportunities for the team to review progress together 📊" },
  { code: "6.4", base: "given team spaces for development ⚡" }
  { code: "2.1", base: "given enough transition to start the role confidently 🔑" },
  { code: "2.2", base: "able to understand the tools and systems needed 💻" },
  { code: "3.1", base: "introduced to AIESEC social platforms 🌐" },
  { code: "3.2", base: "clearly explained our community rules 📜" },
  { code: "4.1", base: "added to communication channels 📬" },
  { code: "5.1", base: "oriented to their tools and workspaces 🛠️" },
  { code: "6.1", base: "given a team-building space to feel connected to my team 🌟" }
];

const JULY = [
  { code: "6.5", base: "given a proper closing experience with the team 🎉" }
];


/* ------------------------------------------------ */
/* PHRASE GENERATOR                                 */
/* mode = receive | give | est                      */
/* ------------------------------------------------ */

function phrase(mode, month, base) {

  switch(mode) {

    case "receive":
      return `This ${month}, I was ${base}.`;

    case "give":
      return `This ${month}, I made sure my members were ${base}.`;

    case "est":
      return `This ${month}, within the project, we were ${base}.`;

    default:
      return base;
  }
}


/* ------------------------------------------------ */
/* SPECIAL OVERRIDES (for wording that must differ) */
/* ------------------------------------------------ */

function overrideText(code, mode, month) {

  // personal growth question reads awkward in give/est → rewrite manually
  if (code === "1.2") {
    if (mode === "receive")
      return `This ${month}, I felt supported by my leader in my personal growth 🌱`;

    if (mode === "give")
      return `This ${month}, I actively supported my members in their personal growth 🌱`;

    if (mode === "est")
      return `This ${month}, I experienced personal or professional growth within the project 🌱`;
  }

  return null;
}


/* ------------------------------------------------ */
/* BUILDER                                          */
/* ------------------------------------------------ */

function buildQuestionSet(month, mode="receive") {

  let questions = [...MONTHLY];

  if (month === "February") questions = questions.concat(FEBRUARY);
  if (month === "July") questions = questions.concat(JULY);

  return questions.map(q => {

    const override = overrideText(q.code, mode, month);

    return {
      code: q.code,
      text: override || phrase(mode, month, q.base)
    };

  });

}

module.exports = { buildQuestionSet };
