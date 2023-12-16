import { ServerWebSocket } from "bun";
import { Database } from "bun:sqlite";

interface control {
    id: number,
    feature_id: number,
    control: string,
    measurement: number,
    tolerance: number
}

interface feature {
    id: number,
    part_id: number,
    name: string,
    controls: any
}

interface part {
    id: number,
    name: string,
}

const dataInterval = 5000;
let partNumber = 1; //default part to show the data associated.
let timerId:any;
let counter:number=0;
//websocket server
const server = Bun.serve({
    port: 3000,
    fetch(request, server) {
        // upgrade the request to a WebSocket
        const success = server.upgrade(request);
        if (success) {
            return; // do not return a Response
        }
      return new Response("Upgrade failed :(", { status: 500 });
    },
    certFile: process.env.SSL_CERT,
    keyFile:  process.env.SSL_KEY,
    websocket: {
        open(ws){//when a connection is opened the client starts to receive the data
            console.log("connection opened from " + ws.remoteAddress);
            timerId = setInterval(gendataCallBack, dataInterval, ws);
        },
        close(ws){
            clearInterval(timerId);
            console.log("connection closed in " + ws.remoteAddress);
        },
        message(ws, message) {// the incomming messages are used to select the part number
            const response = `{"part" : "${message}"}`; //send a json response with the new part selected
            console.log(response);
            partNumber = parseInt(message.toString());
            ws.send(response); // echo back the message
          },
    },

});
console.log(`Listening on https://localhost:${server.port} ...`);

//utilities
function gendataCallBack(wsConn:any){
    let response:any = {};
    if (Math.abs(partNumber) > 2){
        response.part = partNumber;
        response.part_name = "Not registered in DB";
        console.log("sending " + counter++);
        wsConn.send(`${JSON.stringify(response)}`);
    } else {
        const db = new Database("./abbrobotics.db");
        // get the part
        const query = db.query(`SELECT id, name FROM parts WHERE id=${partNumber};`);
        const partData: part = query.get() as part; //{"name":"Door"}
        // get the list of features for the part
        const query2 = db.query(`SELECT id, name FROM features WHERE part_id=${partNumber};`);
        const featuresData = query2.all(); //
        //features.push(featuresData);
        featuresData.forEach( (featureItem)=>{
            let auxFeature = featureItem as feature;
            simulateMeasurements(db);
            const query3 = db.query(`SELECT id, feature_id, control,measurement, tolerance, deviation FROM controls WHERE feature_id=${auxFeature.id};`);
            const controls = query3.all(); //
            auxFeature.controls = controls;
        });
        response.part = partData.id;
        response.part_name = partData.name;
        response.features = featuresData;
        console.log("sending " + counter++);
        wsConn.send(`${JSON.stringify(response)}`);
    }
}
function simulateMeasurements(db: Database){
    // update without where to generate simulated data for all rows.
    const newMeasurementsQuery = db.query("UPDATE controls SET deviation =  (((random() % 90)+0.0)/1000);"); //values from -39 to 39 as possible
    newMeasurementsQuery.run();
}


