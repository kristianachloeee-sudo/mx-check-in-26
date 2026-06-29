// questions.js

/* ============================================================
   CONFIG
============================================================ */

const TXP_MONTH = "June";
const SURVEY_NAME = "National Membership Survey";
const NATCON_DATES = "July 31-August 2, 2026";

/* ============================================================
   MXS QUESTIONS
   (Codes preserved for Google Sheets)
============================================================ */

const RECEIVE = [
  {
    code: "1.1",
    text: `In the month of ${TXP_MONTH}, I felt clear about my responsibilities and expectations for the month.`
  },
  {
    code: "1.2",
    text: `In the month of ${TXP_MONTH}, I felt supported in my Personal Development and Growth. I have created a PDP and have started working with my direct head on it.`
  },
  {
    code: "2.3",
    text: `In the month of ${TXP_MONTH}, I felt like I was given spaces to be upskilled within my role.`
  },
  {
    code: "4.2",
    text: `In the month of ${TXP_MONTH}, I felt like I was given enough opportunities to be engaged with my community, both locally and nationally.`
  },
  {
    code: "5.2",
    text: `In the month of ${TXP_MONTH}, I felt great and I know where to go to get support emotionally and mentally.`
  },
  {
    code: "6.2",
    text: `In the month of ${TXP_MONTH}, I felt like I was given enough opportunities to engage with my direct team outside of work.`
  },
  {
    code: "6.3",
    text: `In the month of ${TXP_MONTH}, I felt like I was given a chance to review and work with my team to improve our performance.`
  },
  {
    code: "6.4",
    text: `In the month of ${TXP_MONTH}, I felt like I and my team were given the space to engage in team development opportunities.`
  },
  {
    code: "6.5",
    text: "I was given an opportunity to close my experience with my direct leader."
  }
];

const GIVE = [
  {
    code: "1.1",
    text: `In the month of ${TXP_MONTH}, I was able to provide spaces for me to align with my members individually and as a team on their roles and responsibilities.`
  },
  {
    code: "1.2",
    text: `In the month of ${TXP_MONTH}, I was able to guide my members through their PDP and support their personal growth.`
  },
  {
    code: "2.3",
    text: `In the month of ${TXP_MONTH}, I was able to give my members opportunities to be upskilled within their role.`
  },
  {
    code: "4.2",
    text: `In the month of ${TXP_MONTH}, I was able to give my team opportunities to engage with the local and national plenary.`
  },
  {
    code: "5.2",
    text: `In the month of ${TXP_MONTH}, I was able to check in with my members emotionally and mentally.`
  },
  {
    code: "6.2",
    text: `In the month of ${TXP_MONTH}, I was able to initiate engagement opportunities with my direct team outside of work.`
  },
  {
    code: "6.3",
    text: `In the month of ${TXP_MONTH}, I was able to facilitate a performance review with my team and provide recommendations for improvement.`
  },
  {
    code: "6.4",
    text: `In the month of ${TXP_MONTH}, I was able to provide spaces for my team's own development.`
  },
  {
    code: "6.5",
    text: "I gave my members the opportunity to close their experience in a team meeting or O2O for this TXP."
  }
];

const EST = RECEIVE.filter(q =>
  ["1.1","1.2","5.2","6.2","6.3","6.4","6.5"].includes(q.code)
);

/* ============================================================
   LPS
============================================================ */

const LPS = [
{
code:"lps",
text:"On a scale of 1–10, with 10 being the highest, how likely are you to recommend AIESEC as a leadership development programme? Why?"
}
];

/* ============================================================
   EXCHANGE
============================================================ */

const EXCHANGE = [
{
code:"exchange_1",
text:"On a scale of 1–10, with 10 being the highest, how likely are you to go on an exchange (GV, GTa or GTe)?"
},
{
code:"exchange_2",
text:"Which among the following is the biggest influencer to that score?",
type:"choice",
options:[
"Price",
"Timeline",
"Family",
"Academics",
"Others"
]
},
{
code:"exchange_3",
text:"Do you think the price of an exchange (PHP8,000 for GV and PHP9,000–13,000 for GTa/GTe) is worth it? Why or why not?"
},
{
code:"exchange_4",
text:"What can we do more of as an entity to help make exchange more worthwhile or more appealing to you?"
}
];

/* ============================================================
   NATIONAL
============================================================ */

const NATIONAL = [
{
code:"national_1",
text:"I am aware of The Fearless Cup RnR initiative.",
type:"yesno"
},
{
code:"national_2",
text:"I follow our national social media accounts and am in the APHL Network Telegram channel.",
type:"yesno"
},
{
code:"national_3",
text:"What types of national campaigns or internal communications would make you feel more seen and heard as a member of APHL?"
},
{
code:"national_4",
text:"Do you feel incentivised to perform by our national hackathons or sprints? What can we do to encourage or motivate performance for yourself and your LC?"
},
{
code:"national_5",
text:"What would make you join national initiatives? What kinds of experiences would you be inclined to participate in?"
},
{
code:"national_6",
text:"Do you feel like you're growing in your role this TXP? Why or why not?"
}
];

/* ============================================================
   DIRECT LEADER LOGIC
============================================================ */

function getLeaderTargets(role){

switch(role){

case "Member":
return ["TL"];

case "TL":
return ["VP"];

case "VP":
return ["LCP","MCVP"];

case "LCP":
return ["MCP","MC Coach"];

case "MCVP":
return ["MCP"];

default:
return [];

}

}

/* ============================================================
   CONTEXT
============================================================ */

const CONTEXT = [

"What were your top 3 focuses for the month of June?",

"What worked well this month?",

"What could have been improved?",

"What was the context behind your department or LC this month?",

"What are your top focus areas going into July?"

];

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {

TXP_MONTH,

SURVEY_NAME,

NATCON_DATES,

LPS,

EXCHANGE,

NATIONAL,

RECEIVE,

GIVE,

EST,

CONTEXT,

getLeaderTargets

};
