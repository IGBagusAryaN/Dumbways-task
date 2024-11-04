// helpers.js
const hbs = require("hbs");

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


hbs.registerHelper("get_distance_time", (timePost) => {
  console.log("Type of timePost:", typeof timePost);
  console.log("Value of timePost:", timePost);

  if (!timePost || (typeof timePost !== "string" && !(timePost instanceof Date))) {
      return "Tanggal tidak valid";
  }

  // Jika timePost adalah string, coba ubah menjadi objek Date
  if (typeof timePost === "string") {
      timePost = new Date(timePost);
  }

  // Cek apakah timePost adalah objek Date yang valid
  if (isNaN(timePost.getTime())) {
      return "Tanggal tidak valid";
  }

  const timeNow = new Date();
  const distance = timeNow - timePost;

  const seconds = Math.floor(distance / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
      return `${seconds} detik yang lalu`;
  } else if (minutes < 60) {
      return `${minutes} menit yang lalu`;
  } else if (hours < 24) {
      return `${hours} jam yang lalu`;
  } else {
      return `${days} hari yang lalu`;
  }
});



hbs.registerHelper('techIcon', function (techName) {
  const icons = {
      html: '<img class="img-icon" src="../assets/svg/html5.svg" width="22">',
      css: '<img class="img-icon" src="../assets/svg/css3.svg" width="22">',
      react: '<img class="img-icon" src="../assets/svg/reactjs.svg"width="22">',
      javascript: '<img class="img-icon" src="../assets/svg/javascript.svg"width="22">',
  };
  return new hbs.SafeString(icons[techName] || "");
});

module.exports = hbs;
