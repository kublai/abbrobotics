import { Database } from "bun:sqlite";

const maxMeasurement = 1000; //millimeters??
const maxTolerance = 5; //will be used as a percentage
const db = new Database("./abbrobotics.db");
// create tables they dont exists yet
const q1= db.query(`
CREATE TABLE IF NOT EXISTS parts (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
    );
`);
q1.run();
const q2 = db.query(`
CREATE TABLE IF NOT EXISTS features (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    part_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    CONSTRAINT features_FK FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
`);
q2.run();
const q3 = db.query(`
CREATE TABLE IF NOT EXISTS controls (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    feature_id INTEGER NOT NULL,
    control text NOT NULL,
    measurement NUMERIC NOT NULL,
    tolerance NUMERIC NOT NULL,
    deviation NUMERIC DEFAULT (0) NOT NULL,
    CONSTRAINT controls_FK FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
`);
q3.run()

const query = db.query("select * from features;");
const features = query.all(); // => { message: "Hello world" }
const controlItems = ['X', 'Y', 'Z','Length','Diameter', 'Area', 'X2', 'Y2', 'Z2','Length2','Diameter2', 'Area2', 'Dummy1', 'Perimeter1',"Depth1", "Depth2", "Thickness1", "Thickness2"];

//clean controls table
const sqlCleanControl = `DELETE FROM controls`;
const queryCreateControl = db.query(sqlCleanControl);
queryCreateControl.run();

//generate new data
features.forEach((feature) =>{
    controlItems.forEach((controlLabel) =>{
        let m = (Math.random() * maxMeasurement) + 100 ; //a minimun value for the measurement 
        let t = (Math.random() * maxTolerance); + 0.01 ;
        m = Math.round(m*100)/100;
        t = Math.round(t*100)/100;
        const sqlGenControl = `INSERT INTO controls (feature_id, control, measurement, tolerance) VALUES (${feature.id},'${controlLabel}', ${m}, ${t});`;
        const queryCreateControl = db.query(sqlGenControl);
        queryCreateControl.run();
        console.log(sqlGenControl);
    });
});

