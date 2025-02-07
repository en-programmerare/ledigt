import ICAL from "https://unpkg.com/ical.js/dist/ical.min.js";
const CALENDAR_URL = "https://cloud.timeedit.net/uu/web/wr_student/ri62wQvuw63Z%C3%B6bQ5YF857nbgypZapY%C3%A4%C3%B6rbG%C3%85Y5cQgY47bYwaujaYYbQ%C3%A4r5UwjyeudLpuvwt5QaaZY6wuZYbm0Yurndbxyxnbea86Zj504ZD2960QEEt40F530C2t1A82910DB5054BF00Qd0A9C78.ics";

const rooms = [
    //Hus 10 plan 1
    101168, 101170, 101172, 101174, 101180, 101182, 101192, 101190, 101195, 101121, 101125, 101127,
    101130, 101132, 101136, 101142, 101146, 101150, 101154, 101156, 101258, 101260, 101162, 101166,
    11137, 11134, //Gamla biblioteket
    10134, 10132, //polhem- och hägg
    2001, 2002, 2003, 2004, 2005, //hus 2 entréplan
    4001, 4003, 4004, 4005, 4006, 4007, 4101, //hus 4
    80101, 80109, 80115, 80121, 80127, 80412, //hus 8
    90101, 90102, 90103, 90104, 90106, //hus 9
    100195, //Eva von Bahr
    
];
let schedule = [];
let scheduleExists = false;

onmessage = async (message) => {


    if (message.data[0] === "fetch") {
        console.log("Webworker > fetch");

        try {
            const result = await fetch(CALENDAR_URL);
            console.log("Data hämtad från Timeedit...");

            if (!result.ok) {
                this.postMessage("error");
                return;
            }

            const icalText = await result.text();

            console.log(ICAL.parse(icalText));

            const calendar = new ICAL.Component(ICAL.parse(icalText));
            const events = calendar.getAllSubcomponents("vevent").map(eventComponent => new ICAL.Event(eventComponent));
            console.log("Data processad av ICAL...");
            schedule = events;
            scheduleExists = true;
            postMessage("fetch"); 
        }
        catch (err) {
            postMessage("error");
            return;
        } 
    }

    /*
    FIND kräver följande parametrar:
    "find"
    startTime {string} Starttid på format "hh:mm"
    endTime {string} Sluttid på format "hh:mm"
    */
    if (message.data[0] === "find") {
        console.log("Webworker > find");

        if (!scheduleExists) {
            postMessage("nofetch");
            return;
        }

        try {
            let startTimeString = message.data[1];
            let endTimeString = message.data[2];
            let startTime = parseTime(startTimeString);
            let endTime = parseTime(endTimeString);

            if (startTime.compare(endTime) > 0) {
                postMessage("wrongtimes")
                return;
            }


            let jsNow = new Date();
            let timezoneOffset = jsNow.getTimezoneOffset() / 60;

            let freeMap = {};
            for (let room of rooms) {
                freeMap[room] = true;
            }

            for (let event of schedule) {
                let eventStart = event.startDate.clone().adjust(0, -timezoneOffset, 0, 0);
                let eventEnd = event.endDate.clone().adjust(0, -timezoneOffset, 0, 0);
                let outsideInterval = 
                    eventEnd.compare(startTime) < 0 || eventStart.compare(endTime) > 0;

                if (outsideInterval)
                    continue;

                for (let room of getRoomNumbers(event.location)) {
                    if (freeMap[room] !== undefined) {
                        freeMap[room] = false; 
                    }
                }

            }
            postMessage(["found", freeMap]);
        }
        catch (err) {
            console.log(err);
            postMessage("error");
        }
    }


    if (message.data[0] === "test") {
        postMessage(["found", {
            "2001": false,
            "2002": false,
            "2003": false,
            "2004": false,
            "80101": false,
            "10101": false,
            "2062": false,
            "15162": false
            }
        ]);
    }
}

/**
 * 
 * @param {string} dateString Sträng på formatet "hh:mm"
 * @returns {ICAL.Time} Tid i form av ICAL-datum.
 */
function parseTime(dateString) {
    let jsDate = new Date();
    let year = jsDate.getFullYear();
    let month = jsDate.getMonth() + 1;
    let day = jsDate.getDate();      

    let startHour = Number(dateString.split(":")[0]);
    let startMinute = Number(dateString.split(":")[1]);

    const startDate = new ICAL.Time({
        year: year,
        month: month,
        day: day,
        hour: startHour,
        minute: startMinute
    });
    return startDate;
}

/**
 * @param {string} locationText
 * @returns {number[]}
 */
function getRoomNumbers(locationText) {
    let matches = Array.from(locationText.matchAll(/(?:Plats\: )(\d{4,6})/gm));
    return matches.map(groups => Number(groups[1]));
}

/*
ANMÄRKNING
Schemat hämtar alla händelser i följande salar (utifall att man vill lägga till någon sal):
90106, 90104, 90103, 90102, 90101, 90409, 90403, 90402
80101, 80109, 80115, 80121, 80127, 80412,
10101, 10132, 10134 Siegbahn, Hägg, Polhem
10131, 10133, 10205, 10207, 10208, 10210, 10211, 10212, 10213, 10214, 20215
11137, 11137
4001, 4002, 4003, 4004, 4005, 4006, 4007, 4101, 4102, 4103, 4104
2001, 2002, 2003, 2004, 2005, 2046, 2044, 2043, 2042, 2041, 2040
101190, 101192, 101195, 101121, 101125, 101127, 101130, 101132, 101136, 101142, 101146, 101150,
101154, 101156, 101258, 101260, 101158, 101162, 101166, 101168, 101170, 101172, 101174, 101180, 101182
*/
  