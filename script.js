let worker = new Worker("worker.js", {type: "module"});
let schedule = [];

const nicknames = {
    10134: "Polhemsalen",
    10132: "Häggsalen",
    10101: "Siegbahnsalen",
    100195: "Eva von Bahr",
    101195: "Heinz-Otto Kreiss",
    101121: "Sonja Lyttkens",
    101136: "Evelyn Sokolowski"
};
setStandardTimes();

id("starttid").addEventListener("change", findFreeRooms);
id("sluttid").addEventListener("change", findFreeRooms);

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
    id("laddar").style.display = "block";
    id("fel").style.display = "none";
    id("skummaTider").style.display = "none";
    const start = id("starttid").value;
    const end = id("sluttid").value;
    worker.postMessage(["find", start, end]);
}



worker.onerror = (err) => console.log(err);

id("laddar").style.display = "block";
worker.postMessage(["fetch"]);


function error() {
    document.querySelector("#fel").style.display = "block";
    document.querySelector("#laddar").style.display = "none";
}

function id(id) {
    return document.getElementById(id);
}

/**
 * @param {number[]} result 
 */
function present(freeMap) {
    id("resultat").replaceChildren();

    for (let room in freeMap) {
        if (!freeMap[room])
            continue; //rummet är ej ledigt.
        let li = document.createElement("li");
        li.innerHTML = room + " " + (nicknames[room] ?? "");
        id("resultat").appendChild(li);
    }
    id("laddar").style.display = "none";
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