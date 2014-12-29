mongo -u root -p (password) --authenticationDatabase admin # mi collego a mongo come admin



mongo -u paesidisandalmazzo -p yEuUpWC8QEkx --host 144.76.103.88 --port 27017 --authenticationDatabase paesidisandalmazzo
mongo -u root -p 3d4c5052 --host 144.76.103.88 --port 27017 --authenticationDatabase admin
mongo -u root -p 3d4c5052 --host 144.76.103.88 --port 27017 --authenticationDatabase admin --eval "show dbs"



mongorestore -h 127.0.0.1 --port 3001 -d meteor dump/paesidisandalmazzo

mongodump -h 144.76.103.88 --port 27017 -u paesidisandalmazzo -p yEuUpWC8QEkx -d paesidisandalmazzo

mongorestore -h 144.76.103.88 --port 27017 -u paesidisandalmazzo -p yEuUpWC8QEkx -d paesidisandalmazzo meteor


db.createUser({ 
	user: "paesidisandalmazzo",
  	pwd: "yEuUpWC8QEkx",
  	roles: [
    	{ role: "readWrite", db: "paesidisandalmazzo" }
  	],
})

db.createUser({ 
	user: "prova",
  	pwd: "prova",
  	roles: [
    	{ role: "readWrite", db: "cazzarola" }
  	],
})



export MONGO_URL='mongodb://paesidisandalmazzo:yEuUpWC8QEkx@localhost:27017/paesidisandalmazzo'
export ROOT_URL='http://www.paesidisandalmazzotest.it'
export PORT=7000




//node js mongodb driver:

var mongoUrl = 'mongodb://' + configuration.mongodb.rootUser + ':' + configuration.mongodb.rootPass + '@' + configuration.mongodb.serverAddress + ':' + configuration.mongodb.port + '/' + configuration.mongodb.rootAuthDb;

MongoClient.connect(mongoUrl, function (err, db) {
    if (err) throw err;

    console.log(clc.greenBright("Succesfully connected to remote mongo server"));

    db = new Db(configuration.mongodb.dbName, new Server('localhost', configuration.mongodb.port));
});

Db.connect(mongoUrl, function(err, db) {
    if (err) throw err;

    db.addUser('prova', 'pass', {roles: ['readWrite']}, function(err, result) {
        console.log(result);
    });

    db.removeUser('prova', function(err, result) {
        console.log(result);

        db.close();
    });
});

var db = new Db(configuration.mongodb.dbName, mongoUrl, {w: 'majority', readPrefernece: 'PRIMARY'});

db.addUser('prova', 'pass', function(err, result) {
    console.log(result);
});