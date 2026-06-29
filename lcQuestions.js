const LC_QUESTIONS = {
  ADMU: [],
  CSB: [
    {
      field: "csb_team_communication_comfort",
      type: "satisfaction_1_5",
      prompt: "How comfortable do you feel communicating with your team members and team leader? 💬\n\nScale: 1 = Not comfortable, 5 = Very comfortable"
    },
    {
      field: "csb_leadership_development_extent",
      type: "satisfaction_1_5",
      prompt: "To what extent do you feel that your role is helping you develop leadership skills? 🌱\n\nScale: 1 = Not at all, 5 = A lot"
    },
    {
      field: "csb_team_environment_positivity",
      type: "satisfaction_1_5",
      prompt: "How positive and supportive is your team environment? ☀️\n\nScale: 1 = Not positive, 5 = Very positive"
    },
    {
      field: "csb_role_engagement_motivation",
      type: "satisfaction_1_5",
      prompt: "How engaged and motivated do you currently feel in your AIESEC role? 🚀\n\nScale: 1 = Not engaged, 5 = Highly engaged"
    }
  ],
  DLSU: [],
  MC: [],
  UPC: [
    {
      field: "upc_experience_growth_rating",
      type: "satisfaction_1_5",
      prompt: "Rate your current AIESEC experience and how much you feel you are growing in your role ✨\n\nScale:\n1 - I feel that I'm lacking something, as I'm not yet sensing my purpose\n3 - I feel that I'm getting there, as I'm still adjusting to things\n5 - I feel that I'm part of this organization, as I'm having fun and growing"
    },
    {
      field: "upc_value_recognition_rating",
      type: "satisfaction_1_5",
      prompt: "How valued do you feel in our entity, and how much do you feel your contributions are recognized? 💙\n\nScale:\n1 - I don't feel valued, and that my contributions aren't recognized\n3 - I moderately feel valued, and my contributions are sometimes recognized\n5 - I definitely feel valued, and my contributions are always recognized"
    },
    {
      field: "upc_interest_this_year",
      type: "multi_choice",
      options: ["Higher roles", "Exchange", "Local Internship", "None of the above"],
      doneLabel: "Done",
      noneExclusiveOption: "None of the above",
      prompt: "Are you interested in taking up higher roles, going on an exchange, or a local internship this year? 🌟\n\nChoose all that apply, then tap Done."
    },
    {
      field: "upc_needed_support",
      type: "text",
      prompt: "What specific support, initiatives, campaigns, or events do you need from the entity to enhance your experience? 💌"
    },
    {
      field: "upc_partner_brands",
      type: "text",
      prompt: "What kind of brands, companies, or businesses would you want to see us partner with? 🤝"
    },
    {
      field: "upc_additional_concerns",
      type: "text",
      prompt: "Do you have any more concerns you'd like to share? You may use this space freely 💭\n\nHowever, if it's more of a heavy or serious concern, kindly answer this form instead: https://bit.ly/AUPC_GrievanceForm2627"
    },
    {
      type: "message",
      prompt: "Thank you for sharing your thoughts and experiences 💌 If you have any other questions or concerns, feel free to drop a message anytime!\n\nMervinne Militar\nLCVP for Talent Management 26.27\nmervinne.miltiar@aiesec.ph\n@Merbins(TG)"
    }
  ],
  UPD: [
    {
      type: "message",
      prompt: "Hey, AUPD! 😎\n\nI hope you're having an amazing and enriching time in our LC 💙 Please share your honest thoughts and feelings about the operations of our LC and AIESEC in general so far!"
    },
    {
      field: "upd_overall_experience_rating",
      type: "satisfaction_1_5",
      prompt: "Rate your overall AIESEC experience 🤍\n\nScale:\n1 - Something is lacking\n5 - I love being here"
    },
    {
      field: "upd_overall_experience_reason",
      type: "text",
      prompt: "We'd love to hear more about your experience. What led you to that rating? ✨"
    },
    {
      field: "upd_experience_improvement",
      type: "text",
      prompt: "How can we make your experience better? 🌱"
    },
    {
      field: "upd_member_value_rating",
      type: "satisfaction_1_5",
      prompt: "How much do you feel valued as a member of AUPD? 💙\n\nScale: 1 = I don't feel valued, 5 = I feel appreciated and valued"
    },
    {
      field: "upd_safety_welcome_rating",
      type: "satisfaction_1_5",
      prompt: "How safe and welcome do you feel as a member of AUPD? 🫶\n\nScale: 1 = I don't feel safe and welcomed, 5 = I feel safe and included here"
    },
    {
      field: "upd_helping_goals",
      type: "choice",
      options: ["Yes", "No", "Sometimes"],
      prompt: "Do you feel like we're helping you achieve your goals? 🎯"
    },
    {
      field: "upd_goal_support",
      type: "text",
      prompt: "How can we help you achieve your goals? 🌟"
    },
    {
      field: "upd_open_to_higher_roles",
      type: "choice",
      options: ["Yes", "No", "Maybe"],
      prompt: "Would you be open to taking up higher roles in the future? 🚀"
    },
    {
      field: "upd_message_for_eb_crossings",
      type: "text",
      prompt: "Any message for EB Crossings? 🤩"
    },
    {
      field: "upd_interest_national_team",
      type: "choice",
      options: ["Yes", "No"],
      prompt: "Are you interested in being part of the National EST, OC, or Steering Team? 🌍"
    },
    {
      type: "message",
      prompt: "Thank you for your insights and evaluation! 🥰 For any concerns or questions, please don't hesitate to reach out.\n\nJustice Bacorro\nLCVP for Talent Management\njustice.bacorro@aiesec.ph\n@justicebacorro"
    }
  ],
  UPLB: [
    {
      field: "uplb_support_in_role",
      type: "satisfaction_1_5",
      prompt: "On a scale of 1 to 5, how supported do you currently feel in performing your responsibilities as an LCVP, TL, or member? 💙\n\nScale: 1 = Not supported at all, 5 = Very supported"
    },
    {
      field: "uplb_balance_manageability",
      type: "satisfaction_1_5",
      prompt: "On a scale of 1 to 5, how manageable is balancing your AIESEC responsibilities with your academic workload this month? 📚\n\nScale: 1 = Very difficult to balance, 5 = Very manageable"
    },
    {
      field: "uplb_contribution_meaningfulness",
      type: "satisfaction_1_5",
      prompt: "On a scale of 1 to 5, how meaningful do you feel your contributions to the LC are so far this term? 🌱\n\nScale: 1 = Not meaningful at all, 5 = Very meaningful"
    },
    {
      field: "uplb_member_experience_change",
      type: "text",
      prompt: "If you could suggest one change to improve member experience in the LC this term, what would it be? ✨"
    },
    {
      field: "uplb_eb_awareness",
      type: "text",
      prompt: "Is there anything you would like the EB to be more aware of regarding members' current situation or workload? 💭"
    }
  ],
  UPM: [
    {
      field: "upm_understand_values_goals",
      type: "satisfaction_1_5",
      prompt: "Do you understand the values and goals of AIESEC in UP Manila? 💙\n\nScale: 1 = Not at all, 5 = Absolutely"
    },
    {
      field: "upm_struggles_or_complaints",
      type: "text",
      prompt: "Are there things you are struggling with in AIESEC this month, or do you have any concerns or complaints? Please explain in 1 to 3 sentences 💭"
    },
    {
      field: "upm_community_engagement",
      type: "satisfaction_1_5",
      prompt: "Do you feel engaged with the community and internal engagement AIESEC has built? 🤝\n\nScale: 1 = Not at all, 5 = Absolutely"
    },
    {
      field: "upm_workload_fatigue",
      type: "text",
      prompt: "Are you experiencing workload fatigue? Please explain why or why not in 1 to 3 sentences 🌿"
    },
    {
      field: "upm_future_role_interest",
      type: "text",
      prompt: "Are you willing to learn more about your role or other roles in the future? Please explain in 1 to 3 sentences 🚀"
    },
    {
      field: "upm_value_in_aiesec",
      type: "satisfaction_1_5",
      prompt: "Do you feel valued in AIESEC? Do you feel like you are contributing to the organization’s operations? \n\nScale: 1 = Not so much, 5 = Absolutely"
    },
    {
      field: "upm_growth",
      type: "satisfaction_1_5",
      prompt: "Is AUPM helping you grow personally and professionally? \n\nScale: 1 = Not at all, 5 = Absolutely"
    }
  ],
  UST: [
    {
      field: "ust_onboarding_helpfulness",
      type: "satisfaction_1_5",
      prompt: "How helpful was the onboarding process in preparing you for your role this term? 🌟\n\nScale: 1 = Not helpful at all, 5 = Very helpful"
    },
    {
      field: "ust_goal_direction_understanding",
      type: "satisfaction_1_5",
      prompt: "After your first few weeks in the role, how well do you understand how your work contributes to your team's goals and the LC's direction? 🧭\n\nScale: 1 = Not at all, 5 = Very well"
    },
    {
      field: "ust_role_preparedness",
      type: "satisfaction_1_5",
      prompt: "How prepared do you feel to handle the key tasks and responsibilities expected of you this term? 💼\n\nScale: 1 = Not prepared, 5 = Very prepared"
    },
    {
      field: "ust_starting_challenges",
      type: "text",
      prompt: "What has been the most challenging part of starting your AIESEC role this term? 💭"
    },
    {
      field: "ust_needed_support",
      type: "text",
      prompt: "What support, resources, or guidance would help you succeed in your role this term? ✨"
    }
  ],
  Other: []
};

/*
Example:

ADMU: [
  {
    field: "admu_support_feedback",
    type: "text",
    prompt: "What is one thing ADMU can improve to support members better?"
  },
  {
    field: "admu_event_visibility",
    type: "choice",
    prompt: "How visible do ADMU opportunities feel to you right now?",
    options: ["Very visible", "Somewhat visible", "Not very visible", "Other"],
    allowOther: true,
    selectionField: "admu_event_visibility_selection",
    detailField: "admu_event_visibility_other",
    otherPrompt: "What answer should I record instead?"
  }
]
*/

function getLcQuestions(lc) {
  if (!lc) {
    return [];
  }

  return LC_QUESTIONS[lc] || LC_QUESTIONS.Other || [];
}

function getAllLcQuestionFields() {
  const fields = new Set();

  Object.values(LC_QUESTIONS).forEach((questions) => {
    questions.forEach((question) => {
      if (question.field) {
        fields.add(question.field);
      }

      if (question.selectionField) {
        fields.add(question.selectionField);
      }

      if (question.detailField) {
        fields.add(question.detailField);
      }
    });
  });

  return Array.from(fields);
}

module.exports = {
  LC_QUESTIONS,
  getLcQuestions,
  getAllLcQuestionFields
};
