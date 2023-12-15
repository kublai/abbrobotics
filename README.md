We need a server that simulates a stream of data (metrology data) using in-factory hardware (modest hardware) 

In order to create this software 2 options (maybe more) are available out of the box, the first one is socket.io a well know platform to create websocket connections, from my experience I can tell that this library works well even in a raspberry PI, so the hardware specifications are minimal. As a second option we can use uWebsockets.js an optimized websocket server that can execute in modest hardware (100k requests/second in a respberry Pi)

### Dev. Environment.
Two servers will be created, one for the user interface and other to create a websocket connections with the first one in order to send the simulated data.
![[system_design.png]]
Bun. a complete toolkit for building, running, testing javascript and typescript. uses ES modules. Bun for our use case is a drop in replacement for NodeJS, the most relevant aspect here is it's speed, in average, Bun 1.0 is  4 times faster than NodeJS 20.x
Bun even when it's not 100% compatible with Nodejs, by design, is faster and uses less resources, as we are using bun from the start no retro compatibility is required.

Nice thing: Bun supports CommonJS and Modules, no additional config required
Websockets support: this one for this project maybe the most relevant factor to choose Bun, we can use http connections and ws connections just adding an event handler for websockets inside our http server

Bun installation
``` bash
curl -fsSL https://bun.sh/install | bash
```

Bun installation path: ~/.bun/bin/bun. (version 1.0.17)

### Server Stress test
In I7 dual core (macbook pro early 2015), executing 5 clients at the same time, the load on the CPU remains constant at 3% approx. for each client process.

For this test the server has been configured to send data (a random number) every 20 ms.

![screenshot](./images/cpu-test1.png)

Interesting fact: Clients executed form the console were running at 2.7 to 3.1%, one client running inside postman were consuming 40.5%.

The server process: 2.3%

The test was sustained for 20 mins, no incidents or drop connections were registered.

The same test but execute at 5ms of interval showed an increment of 2% in CPU consumption in average for all the clients and the Websocket server at the beginning but after some time (1 min approx) the consumption was stabilised  at 1.3 to 1.6 for the shell clients and 4.6 for the Websocket server.

![[cpu-test2.png]]

Finally:
The websocket server in idle state consumes 2.1 - 2.6% CPU and approx. 20Mb of RAM.


### Data storage 
The task proposal indicates a data structure based in 3 levels, Parts, Features and Controls
As this system is not been created for production a small store system will be enough.  The data structure can be stored in a static JS object or in tables inside a database. For simplicity during the development process SQLite was selected  due its native support in Bun.

``` bash
brew install sqlite
```

Creating the database:
```bash
sqlite3 abbrobotics.db
```

tables: parts -> features -> controls
```sql
CREATE TABLE IF NOT EXISTS parts (
id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS features (
id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
part_id INTEGER NOT NULL,
name TEXT NOT NULL,
CONSTRAINT features_FK FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS controls (
id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
feature_id INTEGER NOT NULL,
control text NOT NULL,
measurement NUMERIC NOT NULL,
tolerance NUMERIC NOT NULL,
deviation NUMERIC DEFAULT (0) NOT NULL,
CONSTRAINT controls_FK FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

All  tables were created directly created in SQL in  DBeaver, no ORM was used. For a real product, some kind of abstraction layer to track the structure changes would be a good idea.

The data for the two first tables were inserted manually, for the third table a shell command for data insertion was created. (genControls.js)

# User Interface
The UI has been created in classical React (Node LTS Version 20.10)

```bash
npx create-react-app abbui
```

As our backend server is running in the port 3000, our front-end app has been configured to attend in port 3001

### UX/UI Considerations
As the system appears to be used in a work factory environment the main focus of the UI has been the clarity and distribution of the information based on the design require by the specifications. The system has been designed to support XL-With (1280px) out of the box, but can be shirked to 1024px (LG-Width) to support older displays. if a lower resolution display is used, a scroll will appear.

A small input section in the UI has been added to display different part numbers if needed.

Just for aesthetics a centered body container is used, other option (maybe a good one for industrial applications would be to display the information on a  top-left schema)

A grid distribution it's used with 3 types of slots, one 2x2 on el left, one 2x1 on the right and the rest, slots 1x1. The number of slots depends on the number of features that are hydrated from the server, the first 2 will go to the big and medium slots, the 3rd feature and the all the others will be distributed in 1x1 slots from left to right, if new rows are required will be created automatically.

### Simulated Measurements
The data created for this task uses 3 main values
1) measurement: a value that can be between 1 and 1000 
1) tolerance: a decimal number (2 decimal digits) between 0.01 and 5
These 2 values are created when the genControls.js script is executed.
genControls.js should be executed only once before starting the node web server.
3) deviation: This value will be simulated on each cycle of the server creating values between -0.399 and 0.399. This value will be treated as a deviation percentage respect the ideal value. This number was selected because in the task definition measurements with deviations until 30%(+- tolerance) are considered acceptable. using 40% as limit  we can expect that in average 1 of every 4 values will be outside the accepted tolerance. (red icon)

There is no definition for the Green segment, we will consider that measurements below 10% are ok. (green icon) 

### About the Errors
Due the ranges defined to generate de data, it's normal to have almost green all the time if the error simulated is below 5% then a lot of controls will be OK,
If the error simulated goes to is low which is normal as we can see in this image
![[ui-green.png.png]]

with an error margin in 9% we start getting warnings for some features:
![[ui-green-yellow.png.png]]

### Why js and ts files?
As I was reading the docs for Bun, I found that this transpiler can work with native js but with ts also, so I tested this last option in the backend server  (index.ts)

## The web consumer interface
For this part of the assignement I used a classical React installation with node (version 20.10)


