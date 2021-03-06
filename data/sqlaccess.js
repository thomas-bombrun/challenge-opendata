if(!process.env.POSTGRES_IP) {
	console.error("Please set the environment variable POSTGRES_IP")
	process.exit()
}
if(!process.env.POSTGRES_USER) {
	console.error("Please set the environment variable POSTGRES_USER")
	process.exit()
}
if(!process.env.POSTGRES_PASSWORD) {
	console.error("Please set the environment variable POSTGRES_PASSWORD")
	process.exit()
}
if(!process.env.POSTGRES_IP) {
	console.error("Please set the environment variable POSTGRES_IP")
	process.exit()
}

var pg = require('pg');
var connectionConfig = {
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: 'cod',
	host: process.env.POSTGRES_IP,
	port: 8001
};

var votes = [];
var deputes = [];
var ballots = [];
var failures = [];

exports.addDepute = function(id,prenom,nom,isMale,dateNais,profession,catSocPro,famSocPro) {
	deputes.push([id,
		prenom,
		nom,
		isMale,
		dateNais,
		profession,
		catSocPro,
		famSocPro]);
}

exports.addVote = function(idDepute,idBallot,vote,isNominatif) {
	votes.push([
		idDepute,
		idBallot,
		vote,
		isNominatif
	]);
}

exports.addBallot = function(id,date,isAdopted,name){
	ballots.push([
		id,
		date,
		isAdopted,
		name
	]);
}

function saveInDB(requestString,values) {
	var valuesAdded = 0;
	pg.connect(connectionConfig, function(err, client, done) {
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		values.forEach(function(value){
			client.query(requestString,value, function(err, result) {
				if(err) {
					failures.push(value)
					return console.error('error running query', err);
				}
				valuesAdded=valuesAdded+1;
				if(values.length===valuesAdded) {
					if(failures.length>0) {
						console.log("Insertion failed for those values :")
						console.log(JSON.stringify(failures))
					}
					client.end();
				}
			});
		});
	});
};

exports.saveInDB = saveInDB;

exports.saveDeputes = function() {
	saveInDB("INSERT INTO deputes VALUES ($1,$2,$3,$4,to_date($5,'YYYY-MM-DD'),$6,$7,$8)",deputes);
};

exports.saveVotes = function() {
	saveInDB("INSERT INTO votes VALUES ($1,$2,$3,$4)",votes);
}

exports.saveBallots = function() {
	saveInDB("INSERT INTO ballots VALUES ($1,to_date($2,'YYYY-MM-DD'),$3,$4)",ballots);
}
