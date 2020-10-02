// User session model
type USER_SESSION = {
  id: string;
  sheetRow: number;
  type: string;
  comment: string;
  demand: string;
  accessTime: string;
};

// check result model
type CHECK_RESULT = {
  result: boolean;
  message: string;
};

// LINE MESSAGE API ACCESS TOKEN
const ACCESS_TOKEN = "【自分のアクセストーケン】";
// Google spread sheet id
const SPREAD_SHEET_ID = "【自分のID】";
// Response URL
const RESPONSE_URL = "https://api.line.me/v2/bot/message/reply";

// Message
const MSG_INCOMPATIBLE_TYPE = "テキストで送信してください。";
const MSG_SELECT_TYPE =
  "電気・水道・通信・食費・その他・入金・現在のいずれかを入力してください。";
const MSG_NUM_MONEY = "金額は数値で入力してください。";
const MSG_INPUT_MONEY = "金額を入力してください。";
const MSG_INPUT_COMMENT = "詳細を入力してください。";

/**
 * main function
 * @param entry
 */
function doPost(entry) {
  const request = JSON.parse(entry.postData.contents).events[0];

  // response token is not defined.
  if (typeof request.replyToken === "undefined") {
    return;
  }

  // Get reply token
  const replyToken = request.replyToken;

  // Get Spread-Sheet
  const dataSheet = SpreadsheetApp.openById(SPREAD_SHEET_ID).getSheets()[0];
  const userSheet = SpreadsheetApp.openById(SPREAD_SHEET_ID).getSheets()[1];

  // Get session
  const userSession = getUserSession(userSheet, request.source.userId);

  // message type is not 'text'
  if (request.message.type !== "text") {
    setResponseData(replyToken, MSG_INCOMPATIBLE_TYPE);
    return ContentService.createTextOutput(
      JSON.stringify({ content: "POST OK" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Trim and get text message
  let trimMessage = request.message.text.trim();

  // Switch with session info
  let messageRes: CHECK_RESULT;
  let responseMessage: string;
  switch (userSession.demand) {
    case "money":
      // Validation
      trimMessage = getBeforeSpaceWord(trimMessage);
      trimMessage = removeSign(trimMessage);
      messageRes = checkMoneyMessage(trimMessage);
      if (!messageRes.result) {
        // error
        responseMessage = messageRes.message;
        break;
      }
      setDataSheet(dataSheet, userSession, trimMessage);
      responseMessage = "残金: " + getLastMoneyData(dataSheet) + "円";
      userSession.demand = "";
      userSession.comment = "";
      userSession.type = "";
      break;

    case "comment":
      // Validation
      messageRes = checkCommentMessage(trimMessage);
      if (!messageRes.result) {
        // error
        responseMessage = messageRes.message;
        break;
      }
      responseMessage = MSG_INPUT_MONEY;
      userSession.demand = "money";
      userSession.comment = trimMessage;
      break;

    case "type":
    default:
      // Validation
      trimMessage = getBeforeSpaceWord(trimMessage);
      messageRes = checkTypeMessage(trimMessage);
      if (!messageRes.result) {
        // error
        responseMessage = messageRes.message;
        break;
      }
      if (trimMessage === "現在") {
        responseMessage = "現在: " + getLastMoneyData(dataSheet) + "円";
        userSession.demand = "type";
      } else if (
        trimMessage === "電気" ||
        trimMessage === "水道" ||
        trimMessage === "通信"
      ) {
        responseMessage = MSG_INPUT_MONEY;
        userSession.type = trimMessage;
        userSession.demand = "money";
      } else {
        responseMessage = MSG_INPUT_COMMENT;
        userSession.type = trimMessage;
        userSession.demand = "comment";
      }
      break;
  }

  // update session
  setUserSession(userSheet, userSession);

  // return
  setResponseData(replyToken, responseMessage);
  return ContentService.createTextOutput(
    JSON.stringify({ content: "POST OK" })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Check message for type
 * @param message text message
 */
function checkTypeMessage(message: string): CHECK_RESULT {
  // type check
  const checkRes: CHECK_RESULT = {
    result: true,
    message: "",
  };
  switch (message) {
    case "電気":
    case "水道":
    case "通信":
    case "食費":
    case "その他":
    case "入金":
    case "現在":
      break;
    default:
      checkRes.result = false;
      checkRes.message = MSG_SELECT_TYPE;
      break;
  }

  return checkRes;
}

/**
 * check message for comment
 * @param _message text message
 */
function checkCommentMessage(_message: string): CHECK_RESULT {
  const checkRes: CHECK_RESULT = {
    result: true,
    message: "",
  };

  return checkRes;
}

/**
 * check message for money
 * @param message text message
 */
function checkMoneyMessage(message: string): CHECK_RESULT {
  const numRegex = new RegExp(/^[0-9]+(\.[0-9]+)?$/);

  // check
  const checkRes: CHECK_RESULT = {
    result: true,
    message: "",
  };
  if (!numRegex.test(message)) {
    checkRes.result = false;
    checkRes.message = MSG_NUM_MONEY;
  }

  return checkRes;
}

/**
 * Get before whitespace word
 * @param message message text
 */
function getBeforeSpaceWord(message: string): string {
  if (message.match(/\s+/)) {
    return message.split(/\s+/)[0];
  } else {
    return message;
  }
}

/**
 * Remove the sign
 * @param message text message
 */
function removeSign(message: string): string {
  return message.replace(/,|\\/, "");
}

/**
 * find user session info in sheet.
 * @param sheet sheet data
 * @param userId request user id
 * @return session info
 */
function getUserSession(sheet: any, userId: string): USER_SESSION {
  const sheetData = sheet.getDataRange().getValues();
  const userSession: USER_SESSION = {
    id: userId,
    sheetRow: 0,
    type: "",
    comment: "",
    demand: "",
    accessTime: "",
  };

  // Search in the sheet
  for (let idx = 0; idx < sheetData.length; idx++) {
    if (sheetData[idx][0] === userId) {
      userSession.sheetRow = idx + 1;
      userSession.type = sheetData[idx][1];
      userSession.comment = sheetData[idx][2];
      userSession.demand = sheetData[idx][3];
      userSession.accessTime = sheetData[idx][4];
      break;
    }
  }

  return userSession;
}

/**
 * Set user session info to sheet
 * @param sheet set user session to sheet
 * @param userSession session sheet
 */
function setUserSession(sheet: any, userSession: USER_SESSION): void {
  if (userSession.sheetRow === 0) {
    sheet.appendRow([
      userSession.id,
      userSession.type,
      userSession.comment,
      userSession.demand,
      getYYYYmmddHHMMSS(),
    ]);
  } else {
    const row = userSession.sheetRow;
    sheet.getRange(row, 1).setValue(userSession.id);
    sheet.getRange(row, 2).setValue(userSession.type);
    sheet.getRange(row, 3).setValue(userSession.comment);
    sheet.getRange(row, 4).setValue(userSession.demand);
    sheet.getRange(row, 5).setValue(getYYYYmmddHHMMSS());
  }
}

/**
 * Get last money in data sheet
 * @param sheet data sheet
 */
function getLastMoneyData(sheet: any): string {
  const lastRow = sheet.getLastRow();
  const sheetData = sheet.getDataRange().getValues();

  return sheetData[lastRow - 1][7];
}

function getYYYYmmdd(): string {
  const today = new Date();
  return (
    today.getFullYear() +
    "/" +
    String(Number(today.getMonth() + 1)) +
    "/" +
    today.getDate()
  );
}

function getYYYYmmddHHMMSS(): string {
  const today = new Date();
  return (
    today.getFullYear() +
    "/" +
    String(Number(today.getMonth() + 1)) +
    "/" +
    today.getDate() +
    " " +
    today.getHours() +
    ":" +
    today.getMinutes() +
    ":" +
    today.getSeconds()
  );
}

/**
 * set input data to data sheet
 * @param sheet data sheet
 * @param userSession session data
 * @param _money money message
 */
function setDataSheet(sheet: any, userSession: USER_SESSION, money: string) {
  const lastRow = sheet.getLastRow();
  const sheetData = sheet.getDataRange().getValues();
  const inputData: string[] = new Array(9);
  let isPlus = false;

  inputData[0] = getYYYYmmdd();
  switch (userSession.type) {
    case "入金":
      inputData[1] = money;
      isPlus = true;
      break;
    case "食費":
      inputData[2] = money;
      break;
    case "電気":
      inputData[3] = money;
      break;
    case "水道":
      inputData[4] = money;
      break;
    case "通信":
      inputData[5] = money;
      break;
    case "その他":
      inputData[6] = money;
      break;
  }

  if (isPlus) {
    inputData[7] = String(Number(sheetData[lastRow - 1][7]) + Number(money));
  } else {
    inputData[7] = String(Number(sheetData[lastRow - 1][7]) - Number(money));
  }

  inputData[8] = userSession.comment;

  sheet.appendRow(inputData);
}

/**
 * Set JOSN data to response header
 * @param responseToken response token
 * @param message response message
 */
function setResponseData(responseToken: string, message: string): void {
  UrlFetchApp.fetch(RESPONSE_URL, {
    headers: {
      "Content-Type": "application/json; charaset=UTF-8",
      Authorization: "Bearer " + ACCESS_TOKEN,
    },
    method: "post",
    payload: JSON.stringify({
      replyToken: responseToken,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    }),
  });
}
