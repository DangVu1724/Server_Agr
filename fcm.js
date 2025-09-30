const { google } = require("googleapis");
const fetch = require("node-fetch");
const serviceAccount = require("./serviceAccountKey.json");

const PROJECT_ID = serviceAccount.project_id;

// Hàm tạo Access Token từ serviceAccountKey.json
async function getAccessToken() {
  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    null,
    serviceAccount.private_key,
    ["https://www.googleapis.com/auth/firebase.messaging"]
  );
  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

// Hàm gửi thông báo
async function sendFCM(token, title, body) {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title,
            body,
          },
        },
      }),
    }
  );

  return res.json();
}

module.exports = { sendFCM };
