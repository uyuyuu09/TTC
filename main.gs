function find_value_Row(sheet, value, col) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][col - 1] == value) {
            return i + 1;
        }
    };
    return 0;
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
                    if(all_absence[i][0] === arguments[1]) {
                      absence_list.push([all_absence[i][1], all_absence[i][2], all_absence[i][3]])
                    }
                };
                for(let j = 0; j < schedule_list.length; j++) {
                    if(schedule_list[j][0] === arguments[1]) {
                      schedule_list[j].push(absence_list)
                      schedule_detail = schedule_list[j]
                    }
                };
                return {
                            "detail": schedule_detail, 
                            "status": "200 ok"
                        }
            } catch(e) {
                return {
                            "detail": undefined, 
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
    switch (arguments[0]) {
        case "add_member_list":
            [
              new_member_number,
              new_member_identification_number,
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
              new_member_identification_number,
              new_member_permission,
              new_member_name,
              new_member_email
            ]);
            master_data.getDataRange().setNumberFormat('@');
            sortSheetData("master", "A2:E", 0, Number);
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
    }
}

function dailyFunctions() {
    sortSheetData("master", "A2:E", 0, Number);
    setFormat("schedule", "A2:F", "@");
    return;
}

function test() {
    // getRange(行番号, 列番号, 行数, 列数)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const master_data = ss.getSheetByName("master");
    const schedule_sheet = ss.getSheetByName("schedule");
    const absenece_sheet = ss.getSheetByName("absence");
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
