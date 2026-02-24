// storage.js
const fs = require("fs");
const FILE = "data/users.json";

function load() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getUser(uid) {
  const data = load();
  return data[uid] || {};
}

function updateUser(uid, values) {
  const data = load();
  data[uid] = data[uid] || {};
  data[uid] = { ...data[uid], ...values };
  save(data);
}

function clearAnswers(uid) {
  const data = load();
  if (!data[uid]) return;
  const identity = {
    name: data[uid].name,
    nickname: data[uid].nickname,
    lc: data[uid].lc,
    role: data[uid].role,
    kpi_function: data[uid].kpi_function
  };
  data[uid] = identity;
  save(data);
}

module.exports = { getUser, updateUser, clearAnswers };