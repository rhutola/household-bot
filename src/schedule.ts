// tslint:disable-next-line: max-classes-per-file
class LastMonthData {
  // sheet where household info is recorded
  private dataSheet: any;
  
  constructor() {
    // session data sheet
    this.dataSheet = SpreadsheetApp.openById(SPREAD_SHEET_ID).getSheets()[3];
  }

  getAggregateDateRange(): Array<String> {
    const sheetData = this.dataSheet.getDataRange().getValues();
    const retData: string[] = new Array(2);

    retData[0] = sheetData[0][0];
    retData[1] = sheetData[0][1];

    return retData;
  }

  getAggregateData(): Array<String> {
    const lastRow = this.dataSheet.getLastRow();
    const sheetData = this.dataSheet.getDataRange().getValues();
    const retData: string[] = new Array(7);

    let payment = 0;
    let food = 0;
    let electricity = 0;
    let water = 0;
    let connect = 0;
    let other = 0;

    for (let idx = 2; idx < sheetData.length; idx++) {
      payment = payment + Number(sheetData[idx][1]);
      food = food + Number(sheetData[idx][2]);
      electricity = electricity + Number(sheetData[idx][3]);
      water = water + Number(sheetData[idx][4]);
      connect = connect + Number(sheetData[idx][5]);
      other = other + Number(sheetData[idx][6]);
    }
      
    retData[0] = String(payment);
    retData[1] = String(food);
    retData[2] = String(electricity);
    retData[3] = String(water);
    retData[4] = String(connect);
    retData[5] = String(other);
    retData[6] = sheetData[lastRow - 1][7];

    return retData;
  }

  public getAggregatMessage(): string {
    let data: String[] = this.getAggregateData();
    let date: String[] = this.getAggregateDateRange();

    let msg: string = "先月 （" + date[0] + " ～ " + date[1] + "）の収支集計\n\n" 
                    + "入金額: " + data[0] +"円\n"
                    + "食費: " + data[1] + "円\n"
                    + "電気代: " + data[2] + "円\n"
                    + "水道代: " + data[3] + "円\n"
                    + "通信費: " + data[4] + "円\n"
                    + "雑費・生活用品: " + data[5] + "円\n"
                    + "\n"
                    + "繰り越し: " + data[6] + "円"

    return msg;
  }

  public getExpenditureRateGraph(): any {
    return this.dataSheet.getCharts()[0];
  }
}

function updateRateGrapch(): string {
  const lastMonthData = new LastMonthData();
  const folder = DriveApp.getFolderById(TMP_FOLDER_ID);
  
  let tmpData = folder.getFiles();
  while (tmpData.hasNext()) {
    let file = tmpData.next()
    file.setTrashed(true);
  }

  folder.createFile(lastMonthData.getExpenditureRateGraph().getBlob().getAs("image/jpeg").setName(EXPENDITURE_RATE_GRAPH));

  let grachData = DriveApp.getFilesByName(EXPENDITURE_RATE_GRAPH);
  return grachData.next().getId();
}

function toPushImage(toUserId: string, id: string): void {
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
          type: "image",
          originalContentUrl: "https://drive.google.com/uc?id=" + id,
          previewImageUrl: "https://drive.google.com/uc?id=" + id
        },
      ],
      'notificationDisabled': true, 
    }),
  });
}

function monthly() {
  const lastMonthData = new LastMonthData();
  const userSession = new UserSession('monthly');
  let last_month_aggregate_msg: string = lastMonthData.getAggregatMessage();
  let folder = DriveApp.getFolderById(TMP_FOLDER_ID);
  folder.createFile(lastMonthData.getExpenditureRateGraph());
  let graphId = updateRateGrapch();

  const userIds = userSession.getAllUserIds();
  for (const userId of userIds) {
    toPush(userId, last_month_aggregate_msg);
    toPushImage(userId, graphId);
  }
}