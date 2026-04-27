// questions.js

/* ------------------------------------------------ */
/* QUESTION BANK — DO NOT CHANGE CODES              */
/* ------------------------------------------------ */

const MONTHLY = [
  { code: "1.1" },
  { code: "1.2" },
  { code: "2.3" },
  { code: "4.2" },
  { code: "5.2" },
  { code: "6.2" },
  { code: "6.3" },
  { code: "6.4" }
];

const EST_CODES = ["1.1", "1.2", "5.2", "6.2", "6.3", "6.4"];

/* ------------------------------------------------ */
/* MARCH OVERRIDES                                  */
/* ------------------------------------------------ */

function overrideText(code, mode, month) {
  if (month !== "March") return null;

  if (mode === "receive") {
    const receive = {
      "1.1": "In the month of March, I felt clear about my responsibilities and expectations for the month.",
      "1.2": "In the month of March, I felt supported in my Personal Development and Growth. I have created a PDP and have started working with my direct head on it.",
      "2.3": "In the month of March, I felt like I was given spaces to be upskilled within my role.",
      "4.2": "In the month of March, I felt like I was given enough opportunities to be engaged with my community, both locally and nationally.",
      "5.2": "In the month of March, I felt great and I know where to go to get support emotionally and mentally.",
      "6.2": "In the month of March, I felt like I was given enough opportunities to engage with my direct team outside of work.",
      "6.3": "In the month of March, I felt like I was given a chance to review and work with my team to improve our performance.",
      "6.4": "In the month of March, I felt like I, and my team, were given the space to engage in team development opportunities."
    };

    return receive[code] || null;
  }

  if (mode === "give") {
    const give = {
      "1.1": "In the month of April, I was able to provide spaces for me to align with my members individually and as a team their roles and responsibilities for the month.",
      "1.2": "In the month of April, I was able to guide my members through their PDP and supported them through their personal growth.",
      "2.3": "In the month of April, I was able to give my members opportunities to be upskilled and capacitated for their role.",
      "4.2": "In the month of April, I was able to give my team opportunities to engage with the local and national plenary.",
      "5.2": "In the month of April, I was able to check-in with my members to ensure they are doing fine emotionally and mentally. I also ensured they are aware of where to get support should they need it.",
      "6.2": "In the month of April, I was able to initiate engagement opportunities with my direct team outside of work.",
      "6.3": "In the month of April, I was able to facilitate a performance review for my team and for us to provide recommendations for improvement.",
      "6.4": "In the month of April, I was able to provide spaces for my team for their own development (ex. LEAD Spaces, Soft Skills, etc.)."
    };

    return give[code] || null;
  }

  if (mode === "est") {
    const est = {
      "1.1": "In the month of April, I felt clear about my responsibilities and expectations for the month.",
      "1.2": "In the month of April, I felt like this role has given me the opportunity to grow and feel supported in my personal development.",
      "5.2": "In the month of April, I felt great and I know where to go to get support emotionally and mentally.",
      "6.2": "In the month of April, I felt like I was given enough opportunities to engage with my direct team outside of work.",
      "6.3": "In the month of April, I felt like I was given a chance to review and work with my team to improve our performance.",
      "6.4": "In the month of April, I felt like I, and my team, were given the space to engage in team development opportunities."
    };

    return est[code] || null;
  }

  return null;
}

/* ------------------------------------------------ */
/* BUILDER                                          */
/* ------------------------------------------------ */

function buildQuestionSet(month, mode = "receive") {
  const source =
    mode === "est"
      ? MONTHLY.filter((q) => EST_CODES.includes(q.code))
      : MONTHLY;

  return source.map((q) => ({
    code: q.code,
    text: overrideText(q.code, mode, month)
  }));
}

module.exports = { buildQuestionSet };
