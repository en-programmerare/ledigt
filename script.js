const TEST = false;
let worker = new Worker("worker.js", {type: "module"});
let schedule = [];
let firstLoad = true;

const names = {
    10134: "Polhemsalen",
    10132: "Häggsalen",
    10101: "Siegbahnsalen",
    100195: "Eva von Bahr",
    101195: "Heinz-Otto Kreiss",
    101121: "Sonja Lyttkens",
    101136: "Evelyn Sokolowski"
};
const nicknames = {
    10134: "Polhem",
    10132: "Hägg",
    10101: "Sigge",
    100195: "Eva",
    101195: "Heinz",
    101121: "Sonja",
    101136: "Evelyn"
}
setStandardTimes();

id("starttid").addEventListener("change", findFreeRooms);
id("sluttid").addEventListener("change", findFreeRooms);
id("close").addEventListener("click", closeDialog);

worker.onmessage = (message) => {
    console.log("Resultat", message.data);
    if (message.data === "error") {
        error();
        return;
    }
    if (message.data === "wrongtimes") {
        id("skummaTider").style.display = "inline";
        id("laddar").style.display = "none";
        return;
    }
    if (message.data === "fetch") {
        findFreeRooms();
    }
    if (Array.isArray(message.data)) {
        if (message.data[0] === "found") {
            present(message.data[1]);
        }
    }
};

function findFreeRooms() {
    id("fel").style.display = "none";
    id("skummaTider").style.display = "none";
    id("upptaget").style.display = "none";
    const start = id("starttid").value;
    const end = id("sluttid").value;
    worker.postMessage(["find", start, end]);
}



worker.onerror = (err) => console.log(err);

id("laddar").style.display = "block";



if (TEST)
    worker.postMessage(["test"]);
else
    worker.postMessage(["fetch"]);


function error() {
    document.querySelector("#fel").style.display = "block";
    document.querySelector("#laddar").style.display = "none";
    id("upptaget").style.display = "none";
}

function id(id) {
    return document.getElementById(id);
}

/**
 * @param {number[]} result 
 */
function present(freeMap) {
    id("resultat").replaceChildren();

    let i = 0;
    for (let room in freeMap) {
        if (!freeMap[room])
            continue; //rummet är ej ledigt.
        let li = document.createElement("div");
        li.classList.add("room");
        if (firstLoad) {
            li.classList.add("animated");
            li.style.animationDelay = String(i * 10) + "ms";
        }

        li.innerHTML = nicknames[room] ?? room;
        li.onclick = () => infoOfRoom(room);
        id("resultat").appendChild(li);
        i++;
    }
    id("laddar").style.display = "none";
    firstLoad = false;

    if (i == 0) { //inga rum lediga
        id("upptaget").style.display = "block";
        firstLoad = true; //spela animationen om du hittar lediga rum
    }
}

function setStandardTimes() {
    let now = new Date();
    let hourString = now.toTimeString().match(/\d\d/);
    id("starttid").value = hourString + ":15";
    let hour = Number(hourString);
    if (hour < 12)
        id("sluttid").value = "12:00";
    else if (hour < 13)
        id("sluttid").value = "13:14";
    else if (hour < 15)
        id("sluttid").value = "15:00";
    else if (hour < 22)
        id("sluttid").value = "22:00";
    else
        id("sluttid").value = "23:59";
}

function infoOfRoom(number) {
    let title = String(number);
    if (names[number] !== undefined)
        title = names[number] + ", " + title;
    id("detailedRoomName").innerHTML = title;
    id("mazemapIframe").src = "https://use.mazemap.com/embed.html?v=1&campusid=49&campuses=uu&sharepoitype=identifier&sharepoi=%C3%85ngstr%C3%B6m-" + number;
    id("roomInfoDialog").open = true;
}
function closeDialog() {
    id("roomInfoDialog").open = false;
}