// Definition type
type VALIDATION_RESULT = {
  result: boolean;
  message: string;
};

/**
 * User session Info
 * session info  is listed in spread sheet.
 */
class UserSession {
  // user id
  public id: string;
  // description line
  public sheetRow: number;
  // input type
  public type: string;
  // input comment
  public comment: string;
  // Expected value
  public demand: string;
  // access time
  public accessTime: string;
  // sheet where session info is recorded
  private sessionSheet: any;

  /**
   * Constructor
   * @param id user id
   */
  constructor(id: string) {
    // session info
    this.id = id;
    this.sheetRow = 0;
    this.type = "";
    this.comment = "";
    this.demand = "";
    this.accessTime = getYYYYmmddHHMMSS();

    // session data sheet
    this.sessionSheet = SpreadsheetApp.openById(SPREAD_SHEET_ID).getSheets()[1];

    this.__readSheetData(id);
  }

  /**
   * Initialize input info
   */
  public initialize(): void {
    this.type = "";
    this.comment = "";
    this.demand = "";
  }

  /**
   * Write session info to reacord sheet
   */
  public setSessionToSheet(): void {
    // Add if sheetRow is 0, update otherwise
    if (this.sheetRow === 0) {
      this.sessionSheet.appendRow([
        this.id,
        this.type,
        this.comment,
        this.demand,
        this.accessTime,
      ]);
    } else {
      this.sessionSheet.getRange(this.sheetRow, 1).setValue(this.id);
      this.sessionSheet.getRange(this.sheetRow, 2).setValue(this.type);
      this.sessionSheet.getRange(this.sheetRow, 3).setValue(this.comment);
      this.sessionSheet.getRange(this.sheetRow, 4).setValue(this.demand);
      this.sessionSheet
        .getRange(this.sheetRow, 5)
        .setValue(getYYYYmmddHHMMSS());
    }
  }

  /**
   * Get user session info in Sheet
   */
  public getAllUserIds(): string[] {
    const sheetData = this.sessionSheet.getDataRange().getValues();
    const userIds: string[] = [];
    for (let idx = 1; idx < sheetData.length; idx++) {
      userIds.push(sheetData[idx][0]);
    }
    return userIds;
  }

  /**
   * Read session info in record sheet
   * @param id user id
   */
  private __readSheetData(id: string): void {
    const sheetData = this.sessionSheet.getDataRange().getValues();
    // Search in the sheet
    for (let idx = 0; idx < sheetData.length; idx++) {
      if (sheetData[idx][0] === id) {
        this.sheetRow = idx + 1;
        this.type = sheetData[idx][1];
        this.comment = sheetData[idx][2];
        this.demand = sheetData[idx][3];
        this.accessTime = sheetData[idx][4];
        break;
      }
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
class Household {
  // sheet where household info is recorded
  private dataSheet: any;

  constructor() {
    // session data sheet
    this.dataSheet = SpreadsheetApp.openById(SPREAD_SHEET_ID).getSheets()[0];
  }

  /**
   * Get last money in sheet
   */
  public getLastMoneyData(): string {
    const lastRow = this.dataSheet.getLastRow();

    return this.dataSheet.getDataRange().getValues()[lastRow - 1][7];
  }

  /**
   * Set input data to sheet
   * @param userSession session info
   * @param money input money info
   */
  public setDataSheet(userSession: UserSession, money: string): void {
    // define
    const lastRow = this.dataSheet.getLastRow();
    const sheetData = this.dataSheet.getDataRange().getValues();
    const inputData: string[] = new Array(9);
    let isPlus = false;
    let moneyRow: number = 0;

    // Select the description line
    switch (userSession.type) {
      case TYPE_PEYMENT:
        moneyRow = 1;
        isPlus = true;
        break;
      case TYPE_FOOD:
        moneyRow = 2;
        break;
      case TYPE_ELECTRICITY:
        moneyRow = 3;
        break;
      case TYPE_WATER:
        moneyRow = 4;
        break;
      case TYPE_CONNECT:
        moneyRow = 5;
        break;
      case TYPE_OTHER:
      default:
        moneyRow = 6;
        break;
    }

    // Data set
    inputData[0] = getYYYYmmdd();
    inputData[moneyRow] = money;
    inputData[7] = isPlus
      ? String(Number(sheetData[lastRow - 1][7]) + Number(money))
      : String(Number(sheetData[lastRow - 1][7]) - Number(money));
    inputData[8] = userSession.comment;

    this.dataSheet.appendRow(inputData);
  }
}

// tslint:disable-next-line: max-classes-per-file
class CustomLog {
  // sheet where log info is recorded
  private logSheet: any;

  constructor() {
    // session data sheet
    this.logSheet = SpreadsheetApp.openById(SPREAD_SHEET_ID).getSheets()[2];
  }

  /**
   * output to sheet
   * @param userId user id
   * @param message log message
   * @param type log type
   */
  public outLog(userId: string, message: string, type: string = "info"): void {
    this.logSheet.appendRow([getYYYYmmddHHMMSS(), userId, type, message]);
  }

  /**
   * output error log to sheet
   * @param message log message
   */
  public errorLog(message): void {
    this.outLog("", message, "error");
  }
}

// Common function
/**
 * Get an YYYY/mm/dd format date
 */
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

/**
 * Get an YYYY/mm/dd HH:MM:SS format date
 */
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
 * Get push message
 * @param type data type
 * @param respMes response message
 * @param money money
 */
function getPushMessage(type: string, respMes: string, money: string): string {
  return (
    "残金に変動がありました。\n\n" +
    type +
    "によって" +
    money +
    "円の変更\n" +
    respMes
  );
}

/**
 * format request message
 * @param message request message
 * @param demand foremat type
 */
function formatMessage(message: string, demand: string): string {
  let resultMessage: string = "";
  switch (demand) {
    case DEMAND_MONEY:
      resultMessage = getWordInString(message);
      resultMessage = getNoSignString(resultMessage);
      break;
    case DEMAND_TYPE:
      resultMessage = getWordInString(message);
      break;
    case DEMAND_COMMENT:
    default:
      resultMessage = message;
      break;
  }
  return resultMessage;
}

/**
 * Get word before line break or space
 * @param message target message
 */
function getWordInString(message: string): string {
  let word: string = "";

  word = message.match(/\n+/) ? message.split(/\n+/)[0] : message;
  word = word.match(/\s+/) ? word.split(/\s+/)[0] : word;

  return word;
}

/**
 * Remove the sign
 * @param message text message
 */
function getNoSignString(message: string): string {
  return message.replace(/,|\\/, "");
}

/**
 * Validation
 * @param message validate message
 * @param demand validate type
 */
function validate(message: string, demand: string): VALIDATION_RESULT {
  const validationResult: VALIDATION_RESULT = {
    result: true,
    message: "",
  };

  switch (demand) {
    case DEMAND_MONEY:
      if (!checkMoneyMessage(message)) {
        validationResult.result = false;
        validationResult.message = MSG_NUM_MONEY;
      }
      break;
    case DEMAND_COMMENT:
      break;
    case DEMAND_TYPE:
    default:
      if (!checkTypeMessage(message)) {
        validationResult.result = false;
        validationResult.message = MSG_SELECT_TYPE;
      }
      break;
  }

  return validationResult;
}

/**
 * check message for money
 * @param message text
 */
function checkMoneyMessage(message: string): boolean {
  const numRegex = new RegExp(/^[0-9]+(\.[0-9]+)?$/);
  return numRegex.test(message);
}

/**
 * check message for type
 * @param message text
 */
function checkTypeMessage(message: string): boolean {
  const typeArr = [
    TYPE_ELECTRICITY,
    TYPE_WATER,
    TYPE_CONNECT,
    TYPE_FOOD,
    TYPE_OTHER,
    TYPE_PEYMENT,
    TYPE_NOW,
  ];

  return typeArr.includes(message);
}

/**
 * fetch to response url
 * @param responseToken reply token in request data
 * @param message response message
 */
function toResponse(responseToken: string, message: string): void {
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

/**
 * fetch to push url
 * @param toUserId destination UserID
 * @param message push message
 */
function toPush(toUserId: string, message: string): void {
  UrlFetchApp.fetch(PUSH_URL, {
    headers: {
      "Content-Type": "application/json; charaset=UTF-8",
      Authorization: "Bearer " + ACCESS_TOKEN,
    },
    method: "post",
    payload: JSON.stringify({
      to: toUserId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    }),
  });
}

// Main
/**
 * post action
 * @param entry entry data
 */
function doPost(entry) {
  const request = JSON.parse(entry.postData.contents).events[0];

  // response token is not defined.
  if (typeof request.replyToken === "undefined") {
    return;
  }

  // Get reply token
  const replyToken = request.replyToken;

  // Message type is not 'text'
  if (request.message.type !== "text") {
    toResponse(replyToken, MSG_INCOMPATIBLE_TYPE);
    return ContentService.createTextOutput(
      JSON.stringify({ content: "POST OK" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Trim and get text message
  let message = request.message.text.trim();

  // create instance
  const userSession = new UserSession(request.source.userId);
  const household = new Household();
  const customLog = new CustomLog();

  try {
    // Session clear command
    if (message === TYPE_CLEAR) {
      userSession.initialize();
      userSession.setSessionToSheet();

      customLog.outLog(userSession.id, "CLEAR-INFO");
      toResponse(replyToken, MSG_SESSION_CLEAR);
      return ContentService.createTextOutput(
        JSON.stringify({ content: "POST OK" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validation
    message = formatMessage(message, userSession.demand);
    const result = validate(message, userSession.demand);
    if (!result.result) {
      customLog.outLog(userSession.id, "Validation error");
      toResponse(replyToken, result.message);
      return ContentService.createTextOutput(
        JSON.stringify({ content: "POST OK" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Switch to do
    let responseMessage: string = "";
    switch (userSession.demand) {
      case DEMAND_MONEY:
        customLog.outLog(userSession.id, "Input Money:" + message);
        household.setDataSheet(userSession, message);
        responseMessage = "残金: " + household.getLastMoneyData() + "円";

        // Noticicat other user
        const userIds = userSession.getAllUserIds();
        const mes = getPushMessage(userSession.type, responseMessage, message);
        for (const userId of userIds) {
          if (userId !== userSession.id) {
            toPush(userId, mes);
          }
        }

        userSession.initialize();
        break;
      case DEMAND_COMMENT:
        customLog.outLog(userSession.id, "Input Comment:" + message);
        responseMessage = MSG_INPUT_MONEY;
        userSession.comment = message;
        userSession.demand = DEMAND_MONEY;
        break;
      case DEMAND_TYPE:
      default:
        customLog.outLog(userSession.id, "Input Type:" + message);
        if (message === TYPE_NOW) {
          responseMessage = "現在: " + household.getLastMoneyData() + "円";
          userSession.demand = DEMAND_TYPE;
        } else if (
          message === TYPE_ELECTRICITY ||
          message === TYPE_WATER ||
          message === TYPE_CONNECT
        ) {
          responseMessage = MSG_INPUT_MONEY;
          userSession.type = message;
          userSession.demand = DEMAND_MONEY;
        } else {
          responseMessage = MSG_INPUT_COMMENT;
          userSession.type = message;
          userSession.demand = DEMAND_COMMENT;
        }
        break;
    }

    // update session
    userSession.setSessionToSheet();

    // response
    toResponse(replyToken, responseMessage);

    return ContentService.createTextOutput(
      JSON.stringify({ content: "POST OK" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (exeption) {
    customLog.errorLog(exeption);
  }
}
