// Define token or url
const ACCESS_TOKEN =
  "";
const SPREAD_SHEET_ID = "";
const TMP_FOLDER_ID ="";
const RESPONSE_URL = "";
const PUSH_URL = "";

// Define file name
const EXPENDITURE_RATE_GRAPH = "Monthly_Spending_Ratio.jpeg"

// Define message type
const TYPE_ELECTRICITY: string = "電気";
const TYPE_WATER: string = "水道";
const TYPE_CONNECT: string = "通信";
const TYPE_FOOD: string = "食費";
const TYPE_OTHER: string = "その他";
const TYPE_PEYMENT: string = "入金";
const TYPE_NOW: string = "現在";
const TYPE_CLEAR: string = "入力情報-CLEAR";

// Define demand type
const DEMAND_MONEY: string = "money";
const DEMAND_COMMENT: string = "comment";
const DEMAND_TYPE: string = "type";

// Definition message
const MSG_SESSION_CLEAR: string = "入力情報をクリアしました。";
const MSG_INCOMPATIBLE_TYPE: string = "テキストで送信してください。";
const MSG_INPUT_MONEY: string = "金額を入力してください。";
const MSG_NUM_MONEY: string = "金額は数値で入力してください。";
const MSG_INPUT_COMMENT: string = "詳細を入力してください。";
const MSG_SELECT_TYPE: string =
  "以下のいずれかを入力してください。\n" +
  TYPE_ELECTRICITY +
  "\n" +
  TYPE_WATER +
  "\n" +
  TYPE_CONNECT +
  "\n" +
  TYPE_FOOD +
  "\n" +
  TYPE_OTHER +
  "\n" +
  TYPE_NOW;