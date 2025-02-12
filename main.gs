function find_value_Row(sheet, value, col) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][col - 1] == value) {
            return i + 1;
        }
    };
    return 0;
}

function sortSheetData(sheetName, valueRange, columnNumber, type) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    const range = sheet.getRange(valueRange + sheet.getLastRow());
    const data = range.getValues();
    data.sort(function(a, b) {
        let dateA = type(a[columnNumber]);
        let dateB = type(b[columnNumber]);
        return dateA - dateB;
    });
    range.setValues(data);
    return;
}

function setFormat(sheetName, valueRange, type) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    const range = sheet.getRange(valueRange + sheet.getLastRow());
    range.setNumberFormat(type);
    return;
}

function doGet(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const master_sheet = ss.getSheetByName("master");
    const member_info = master_sheet.getDataRange().getValues().slice(1);
    const user_mail_address = Session.getActiveUser().getEmail();

    let user_data_list = [];
    for (let i = 0; i < member_info.length; i++) {
        if(user_mail_address === member_info[i][4]) {
            user_data_list.push(
                {
                    "user_number": member_info[i][0],
                    "user_permission": member_info[i][2],
                    "user_name": member_info[i][3],
                    "user_email_address": user_mail_address,
                }
            );
        }
    };
    if(user_data_list.length === 0) {
        user_data_list.push(
            {
                "user_number": "9999",
                "user_permission": "none",
                "user_name": "unknown",
                "user_email_address": "none",
            }
        )
    };

    var page = e.pathInfo ? e.pathInfo : "index";
    var temp = (() => {
        try {
            return HtmlService.createTemplateFromFile(page);
        } catch (e) {
            return HtmlService.createTemplateFromFile("error");
        }
    })();

    var parameter = (() => {
        try {
            return e.parameter.page;
        } catch (e) {
            return "dummy";
        }
    });

    temp.page = parameter;
    temp.member_info = user_data_list[0];
    temp.url = ScriptApp.getService().getUrl();
    temp.member_list = getData("member_list");
    let response = temp.evaluate()
                       .setTitle('大宮北高校卓球部')
                       .addMetaTag('viewport', 'width=device-width,initial-scale=1,maximum-scale=1.0');
    return response;
}

function getData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const master_data = ss.getSheetByName("master");
    const schedule_sheet = ss.getSheetByName("schedule");
    const absenece_sheet = ss.getSheetByName("absence");
    switch (arguments[0]) {
        case "member_list":
            try {
                member_list = master_data.getDataRange().getValues().slice(1);
                return {
                            "member": member_list,
                            "status": "200 ok"
                        };
            } catch(e) {
                return {
                            "member": undefined,
                            "status": e.message
                        };
            }
        case "member_from_origin_number":
            try {
                row = find_value_Row(master_data, arguments[1], 2);
                member_info = master_data.getRange("A" + row + ":E" + row).getValues();
                return {
                            "member_info": member_info[0],
                            "status": "200 ok"
                        };
            } catch(e) {
                return {
                            "member_info": undefined,
                            "status": e.message
                        };
            }
        case "schedule_list":
            try {
                schedule_list = schedule_sheet.getDataRange().getValues().slice(1);
                schedule_list.sort(function(a, b) {
                    const a_date = new Date(a[1]);
                    const b_date = new Date(b[1]);
                    return a_date - b_date;
                });
                return {
                          "schedule": schedule_list,
                          "status": "200 ok"
                        }
            } catch(e) {
                return {
                          "schedule": undefined,
                          "status": e.massage
                        }
            }
        case "schedule_detail_from_id":
            try {
                schedule_list = schedule_sheet.getDataRange().getValues().slice(1);
                absence_list = [];
                schedule_detail = [];
                all_absence = absenece_sheet.getDataRange().getValues().slice(1);
                for(let i = 0; i < all_absence.length; i++) {
                    if(all_absence[i][1] === arguments[1]) {
                      absence_list.push([all_absence[i][0], all_absence[i][2], all_absence[i][3], all_absence[i][4]])
                    }
                };
                for(let j = 0; j < schedule_list.length; j++) {
                    if(schedule_list[j][0] === arguments[1]) {
                      schedule_list[j].push(absence_list)
                      schedule_detail = schedule_list[j]
                    }
                };
                return {
                            "schedule_detail": schedule_detail, 
                            "status": "200 ok"
                        }
            } catch(e) {
                return {
                            "schedule_detail": undefined, 
                            "status": e.massage
                        }
            }
    };
}

function sendData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const master_data = ss.getSheetByName("master");
    const schedule_sheet = ss.getSheetByName("schedule");
    const all_schedule_sheet = ss.getSheetByName("all_schedule");
    const absence_sheet = ss.getSheetByName("absence");
    switch (arguments[0]) {
        case "add_member_list":
            [
                new_member_number,
                new_member_origin_number,
                new_member_permission,
                new_member_name,
                new_member_email
            ] = [
                String(arguments[1]),
                String(arguments[2]),
                String(arguments[3]),
                String(arguments[4]),
                String(arguments[5])
            ];
            master_data.appendRow([
                new_member_number,
                new_member_origin_number,
                new_member_permission,
                new_member_name,
                new_member_email
            ]);
            master_data.getDataRange().setNumberFormat('@');
            sortSheetData("master", "A2:E", 0, Number);
            return;
        case "member_update":
            row = find_value_Row(master_data, arguments[2], 2);
            [
                new_member_number,
                new_member_origin_number,
                new_member_permission,
                new_member_name,
                new_member_email
            ] = [
                String(arguments[1]),
                String(arguments[2]),
                String(arguments[3]),
                String(arguments[4]),
                String(arguments[5]),
            ];
            master_data.getRange("A" + row + ":E" + row).setValues([[
                new_member_number,
                new_member_origin_number,
                new_member_permission,
                new_member_name,
                new_member_email
            ]]);
            return;
        case "add_schedule":
            [
                new_schedule_date,
                new_schedule_title,
                new_schedule_start_time,
                new_schedule_end_time,
                new_schedule_memo
            ] = [
                String(arguments[1]),
                String(arguments[2]),
                String(arguments[3]),
                String(arguments[4]),
                String(arguments[5])
            ];
            schedule_id = "S" + String(all_schedule_sheet.getLastRow()).padStart(5, "0");
            all_schedule_sheet.appendRow([
                schedule_id,
                new_schedule_date,
                new_schedule_title,
                master_data.getRange("D" + find_value_Row(master_data, Session.getActiveUser().getEmail(), 5)).getValue(),
            ]);
            schedule_sheet.appendRow([
                schedule_id,
                new_schedule_date,
                new_schedule_title,
                new_schedule_start_time + "~" + new_schedule_end_time,
                new_schedule_memo,
                master_data.getRange("D" + find_value_Row(master_data, Session.getActiveUser().getEmail(), 5)).getValue()
            ]);
            setFormat("all_schedule", "A2:D", "@");
            setFormat("schedule", "A2:F", "@");
            return;
        case "schedule_update":
            row = find_value_Row(schedule_sheet, arguments[1], 1);
            [
                new_schedule_date,
                new_schedule_title,
                new_schedule_start_time,
                new_schedule_end_time,
                new_schedule_memo
            ] = [
                String(arguments[2]),
                String(arguments[3]),
                String(arguments[4]),
                String(arguments[5]),
                String(arguments[6])
            ];
            schedule_sheet.getRange("B" + row + ":E" + row).setValues([[
                new_schedule_date,
                new_schedule_title,
                new_schedule_start_time + "~" + new_schedule_end_time,
                new_schedule_memo
            ]]);
            setFormat("schedule", "A2:F", "@");
            return;
        case "add_new_absence":
            row = find_value_Row(master_data, Session.getActiveUser().getEmail(), 5);
            [
                schedule_id,
                absence_kind,
                absence_reason
            ] = [
                String(arguments[1]),
                String(arguments[2]),
                String(arguments[3])
            ];
            absence_sheet.appendRow([
                "=ROW() - 1",
                schedule_id,
                master_data.getRange("D" + row).getValue(),
                absence_kind,
                absence_reason
            ]);
            setFormat("absence", "A2:E", "@");
            return;
        case "delete_absence":
            row = find_value_Row(master_data, Session.getActiveUser().getEmail(), 5);
            user_name = master_data.getRange("D" + row).getValue();
            absence_list = absence_sheet.getDataRange().getValues();
            delete_target = [];
            for(let i = 0; i < absence_list.length; i++) {
                if(absence_list[i][1] === String(arguments[1]) && absence_list[i][2] === user_name) {
                    delete_target.push(i + 1);
                }
            };
            for(let j = delete_target.length - 1; j >= 0; j--) {
                absence_sheet.deleteRow(delete_target[j])
            };
            return;
    }
}

const webhook_url = "https://chat.googleapis.com/v1/spaces/AAAA44M8_JM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=RxbcqfwK3TAs-Nli8yxlK5aFN98vRlPyFBRqT78IvQQ";

function sendScheduleTommorow() {
    const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("schedule");
    const schedule_list = ss.getDataRange().getValues().slice(1);
    let tommorow = new Date();
    tommorow.setDate(tommorow.getDate() + 1);

    const [
        tommorow_year,
        tommorow_month,
        tommorow_date
    ] = [
        String(tommorow.getFullYear()).padStart(2, "0"),
        String(tommorow.getMonth() + 1).padStart(2, "0"),
        String(tommorow.getDate()).padStart(2, "0")
    ];

    let msg = [];

    for(let i = 0; i < schedule_list.length; i++) {
        if(schedule_list[i][1] === tommorow_year + "-" + tommorow_month + "-" + tommorow_date) {
            let id = schedule_list[i][0];
            let detail_list = getData("schedule_detail_from_id", id);
            let title = detail_list.schedule_detail[2];
            let start_time = detail_list.schedule_detail[3].split("~")[0];
            let end_time = detail_list.schedule_detail[3].split("~")[1];
            let memo = detail_list.schedule_detail[4];
            let absence_list = detail_list.schedule_detail[6];

            let msg = `*【明日の練習について】*\n明日の練習内容についてお知らせします。\n開始: ${start_time}\n終了: ${end_time}\n内容: ${title}\n備考: ${memo}`;
            if(absence_list.length !== 0) {
                msg += `\n\n*【欠席申請者一覧】*\n現段階で申請済みの部員一覧を表示します。\n`
                for(j = 0; j < absence_list.length; j++) {
                    msg += `[申請ID: ${absence_list[j][0]}]\n${absence_list[j][2]}: ${absence_list[j][1]}\n理由: ${absence_list[j][3]}\n\n`
                };
                msg += "まだ申請をしていない人は以下のURLから行ってください。"
            } else {
                msg += "\n\n現段階での欠席申請はありません。";
            }
            let message = {
              'text': msg
            };

            let options = {
              'payload': JSON.stringify(message),
              'method': 'POST',
              'contentType': 'application/json'
            };
            let response = UrlFetchApp.fetch(webhook_url, options);
        }
    }
}

function sendScheduleToday() {
    const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("schedule");
    const schedule_list = ss.getDataRange().getValues().slice(1);
    let today = new Date();

    const [
        today_year,
        today_month,
        today_date
    ] = [
        String(today.getFullYear()).padStart(2, "0"),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ];

    let msg = [];

    for(let i = 0; i < schedule_list.length; i++) {
        if(schedule_list[i][1] === today_year + "-" + today_month + "-" + today_date) {
            let id = schedule_list[i][0];
            let detail_list = getData("schedule_detail_from_id", id);
            let title = detail_list.schedule_detail[2];
            let start_time = detail_list.schedule_detail[3].split("~")[0];
            let end_time = detail_list.schedule_detail[3].split("~")[1];
            let memo = detail_list.schedule_detail[4];
            let absence_list = detail_list.schedule_detail[6];

            let msg = `*【本日の練習について】*\n本日の練習内容についてお知らせします。\n開始: ${start_time}\n終了: ${end_time}\n内容: ${title}\n備考: ${memo}`;
            if(absence_list.length !== 0) {
                msg += `\n\n*【欠席申請者一覧】*\n現段階で申請済みの部員一覧を表示します。\n`
                for(j = 0; j < absence_list.length; j++) {
                    msg += `[申請ID: ${absence_list[j][0]}]\n${absence_list[j][2]}: ${absence_list[j][1]}\n理由: ${absence_list[j][3]}\n\n`
                };
                msg += "まだ申請をしていない人は以下のURLから行ってください。"
            } else {
                msg += "\n\n現段階での欠席申請はありません。";
            }
            let message = {
              'text': msg
            };

            let options = {
              'payload': JSON.stringify(message),
              'method': 'POST',
              'contentType': 'application/json'
            };
            let response = UrlFetchApp.fetch(webhook_url, options);
        }
    }
}

function dailyFunctions() {
    sortSheetData("master", "A2:E", 0, Number);
    setFormat("schedule", "A2:F", "@");
    return;
}

function test() {
    // getRange(行番号, 列番号, 行数, 列数)
    // const ss = SpreadsheetApp.getActiveSpreadsheet();
    // const master_data = ss.getSheetByName("master");
    // const schedule_sheet = ss.getSheetByName("schedule");
    // const absence_sheet = ss.getSheetByName("absence");
  const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("schedule");
  const schedule_list = ss.getDataRange().getValues().slice(1);
  let tommorow_elm = new Date();
  tommorow_elm.setDate(tommorow_elm.getDate() + 1);

  const [
      tommorow_year,
      tommorow_month,
      tommorow_date
  ] = [
      String(tommorow_elm.getFullYear()).padStart(2, "0"),
      String(tommorow_elm.getMonth() + 1).padStart(2, "0"),
      String(tommorow_elm.getDate()).padStart(2, "0")
  ];
  
  const tommorow = (tommorow_year + "-" + tommorow_month + "-" + tommorow_date)

  let msg = [];
  for(let i = 0; i < schedule_list.length; i++) {
      if(schedule_list[i][1].includes(tommorow)) {
          let id = schedule_list[i][0];
          console.log(id)
          let detail_list = getData("schedule_detail_from_id", id);
          let title = detail_list.schedule_detail[2];
          let start_time = detail_list.schedule_detail[3].split("~")[0];
          let end_time = detail_list.schedule_detail[3].split("~")[1];
          let memo = detail_list.schedule_detail[4];
          let absence_list = detail_list.schedule_detail[6];
          msg = [title, start_time, end_time, memo];
      }
  }
  console.log(msg)
}
