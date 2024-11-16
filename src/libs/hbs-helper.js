// helpers.js
const hbs = require("hbs");
const handlebars = require("handlebars");

hbs.registerHelper("get_project_duration", (start, end) => {
  if (!start || !end) return "Tanggal tidak valid";

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate) || isNaN(endDate)) return "Tanggal tidak valid";

  let totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30);
  totalDays %= 30;
  const days = totalDays;

  let result = "";
  if (months > 0) result += `${months} bulan `;
  if (days > 0) result += `${days} hari`;

  return result.trim() || "0 hari";
});
11

hbs.registerHelper('techIcon', function (techName) {
  const icons = {
      html: '<img class="img-icon" src="../assets/svg/html5.svg" width="22">',
      css: '<img class="img-icon" src="../assets/svg/css3.svg" width="22">',
      react: '<img class="img-icon" src="../assets/svg/reactjs.svg"width="22">',
      javascript: '<img class="img-icon" src="../assets/svg/javascript.svg"width="22">',
  };
  return new hbs.SafeString(icons[techName] || "");
});

hbs.registerHelper("json", function(context) {
  return JSON.stringify(context);
});
hbs.registerHelper("encodeURIComponent", function(context) {
  return encodeURIComponent(context);
});

module.exports = hbs;
