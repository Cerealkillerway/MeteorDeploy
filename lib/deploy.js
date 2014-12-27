#!/usr/bin/env node
//require system modules
var exec = require('child_process').exec;
var fs = require('fs');

//require additional modules
var Connection = require('ssh2');
var clc = require('cli-color');
var execSync = require('exec-sync');
var client = require('scp2');
var readJsonSync = require('read-json-sync');
var uploadBar = require('progress-bar').create(process.stdout, 51);
var mkdirp = require('mkdirp');





//create virtual host file, move it to apache's directory, enable it and restart apache
function createVhost() {
	fs.readFile(configuration.vHost.baseFile, function(err, data) {
    	if(err) throw err;

    	console.log(clc.blueBright('reading virtual host source file'));

    	var lines = data.toString().split("\n");

        for(i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('<<<domainName>>>') >= 0) {
                lines[i] = lines[i].replace('<<<domainName>>>', configuration.vHost.domainName);
            }
            if (lines[i].indexOf('<<<port>>>') >= 0) {
                lines[i] = lines[i].replace('<<<port>>>', configuration.port);
            }
        }
        lines = lines.join("\n");

        var hostFileName;
        if (configuration.vHost.apache24) hostFileName = configuration.vHost.domainName + '.conf';
        else hostFileName = configuration.vHost.domainName;

        fs.writeFile("assets/" + hostFileName, lines, function(err) {
            if(err) throw err;

            console.log(clc.blueBright('virtual host file created succesfully'));

            return hostFileName;

        });

    });
}

//creates or updates memo files
function localMemoFiles() {
	var firstLine = false;
	var data = "";
	var update = false;

	console.log(clc.blueBright('reading memo file informations...'));
	//check if it's gonna writing the firs line of the file
	if (fs.existsSync(configuration.localProcessMemoFile)) {
    	var lines = fs.readFileSync(configuration.localProcessMemoFile);

    	lines = lines.toString().split("\n");
    	if (lines.length === 0) firstLine = true;

    	//check if current app is already in memo file
    	for(i = 0; i < lines.length; i++) {
    		if (lines[i].indexOf(configuration.foreverProcessName) >= 0) {
    			console.log(clc.yellowBright("this app is already in memo file"));

    			//check if port has changed
    			var oldPort = lines[i].substring(lines[i].indexOf(':') + 2, lines[i].length);

    			if (oldPort != configuration.port) {
    				console.log(clc.blueBright("the app is now running on a different port -> update memo file"));

    				lines[i] = lines[i].substring(0, lines[i].indexOf(':') + 2) + configuration.port + '\n';

    				update = true;
    			}
    			else return;
    		}
    	}

    	if (update) {
    		lines = lines.join("\n");

			fs.writeFile(configuration.localProcessMemoFile, lines, function(err) {
	            if(err) throw err;

	            console.log(clc.greenBright('local memo file line of this app has been updated'));

	            return configuration.localProcessMemoFile;

	        });
	        return;
		}
	}
	else firstLine = true;


	//if this is the first line creates the header
	if (firstLine) {
		data = 'APPLICATION NAME:';
		while (data.length < 53) {
			data = data + " ";
		}
		data = data + "PORT:\n";
		data = data + '-----------------------------------------------------------------------\n';
	}

	console.log(clc.greenBright('done\n'));


	console.log(clc.blueBright('updating memo file...'));

	var processName = configuration.foreverProcessName;

	while (processName.length < 50) {
		processName = processName + " ";
	}

	data = data + processName + " - port: " + configuration.port + '\n';

	fs.appendFile(configuration.localProcessMemoFile, data, function(err) {
        if(err) throw err;

        console.log(clc.greenBright('local memo file updated'));
    });
}

//creates new mongo db and user for the app
function createMongoDb() {
	// not yet implemented
}

function untarArchive(ssh) {

	console.log(clc.blueBright("extracting remote archive"));

	ssh.exec('cd /home/' + configuration.sshUser + '/' + configuration.appName + ' && tar -zxvf archive.tar.gz && rm archive.tar.gz', function(err, stream) {
		if (err) throw err;

		stream.on('exit', function(code, signal) {

			console.log(clc.yellowBright('exit code: ' + code));

			if (code !== 0) {
				operationError();
				return false;
			}

			console.log(clc.greenBright('remote archive extracted correctly\n'));

			remoteOperations(ssh);
		});
	});
}

function remoteOperations(ssh) {

	//move app in website folder removing previous content
	console.log(clc.blueBright("cleaning website folder and moving app in it"));

	ssh.exec('sudo rm -Rf ' + configuration.webDirectory + '/* && sudo mv /home/' + configuration.sshUser + '/' + configuration.appName + '/dist/' + configuration.appName + '.tar.gz ' + configuration.webDirectory, { pty: true }, function(err, stream) {
		if (err) throw err;

		stream.on('data', function(data) {
	      	stream.write(configuration.sshPass + '\n');
	    })
		.on('exit', function(code, signal) {

			console.log(clc.yellowBright('exit code: ' + code));

			if (code !== 0) {
				operationError();
				return false;
			}

			console.log(clc.greenBright('application moved correctly to website folder\n'));
			console.log(clc.blueBright('cleaning up home and unpacking app'));

			//clean up home folder and unpack tar.gz package in website folder
			ssh.exec('rm -Rf /home/' + configuration.sshUser + '/' + configuration.appName + ' && cd ' + configuration.webDirectory + ' && sudo tar -zxvf ' + configuration.appName + '.tar.gz', { pty: true }, function(err, stream) {
				if (err) throw err;

				stream.on('data', function(data) {
			      	stream.write(configuration.sshPass + '\n');
			    })
				.on('exit', function(code, signal) {

					console.log(clc.yellowBright('exit code: ' + code));

					if (code !== 0) {
						operationError();
						return false;
					}

					console.log(clc.greenBright('application unpacked\n'));
					console.log(clc.blueBright('remove app tar file...'));

					//remove package, move unpacked app in first level and run npm install
					ssh.exec('cd ' + configuration.webDirectory + ' && sudo rm -f ' + configuration.appName + '.tar.gz', { pty: true }, function(err, stream) {
						if (err) throw err;

						stream.on('data', function(data) {
					      	stream.write(configuration.sshPass + '\n');
					    })
					    .on('exit', function(code, signal) {

					    	console.log(clc.yellowBright('exit code: ' + code));

					    	if (code !== 0) {
								operationError();
								return false;
							}

							console.log(clc.greenBright('tar file removed\n'));
							console.log(clc.blueBright('moving bundle content to website root folder...'));

					    	ssh.exec('cd ' + configuration.webDirectory + ' && sudo mv bundle/* .', { pty: true }, function(err, stream) {
					    		if (err) throw err;

					    		stream.on('data', function(data) {
					    			stream.write(configuration.sshPass + '\n');
					    		})
					    		.on('exit', function(code, signal) {
					    			console.log(clc.yellowBright('exit code: ' + code));

					    			if (code !== 0) {
										operationError();
										return false;
									}

									console.log(clc.greenBright('meteor package extracted\n'));
									console.log(clc.blueBright('removing bundle folder...'));

									ssh.exec('cd ' + configuration.webDirectory + ' && sudo rm -Rf bundle', { pty: true }, function(err, stream) {
										if (err) throw err;

										stream.on('data', function(data) {
											stream.write(configuration.sshPass + '\n');
										})
										.on('exit', function(code, signal) {
											console.log(clc.yellowBright('exit code: ' + code));

											if (code !== 0) {
												operationError();
												return false;
											}

											console.log(clc.greenBright('bundle folder removed correctly\n'));
											console.log(clc.blueBright('renaming main file...'));

											ssh.exec('cd ' + configuration.webDirectory + ' && sudo mv main.js ' + configuration.foreverProcessName, { pty: true }, function(err, stream) {
												if (err) throw err;

												stream.on('data', function(data) {
													stream.write(configuration.sshPass + '\n');
												})
												.on('exit', function(code, signal) {
													console.log(clc.yellowBright('exit code: ' + code));

													if (code !== 0) {
														operationError();
														return false;
													}

													console.log(clc.greenBright('main file renamed correctly\n'));
													console.log(clc.blueBright('installing npm modules...'));

													ssh.exec('cd ' + configuration.webDirectory + '/programs/server && sudo npm install', { pty: true }, function(err, stream) {
														stream.on('data', function(data) {
													      	stream.write(configuration.sshPass + '\n');
													    })
													    .on('exit', function(code, signal) {
													    	console.log(clc.yellowBright('exit code: ' + code));
															console.log(clc.greenBright('npm modules installed\n'));

															getForeverId(ssh);
													    });
													});
												});
											});
										});
									});
					    		});
					    	});					    	
					    });
					});
				});
			});		
		});
	});
}

function getForeverId(ssh) {
	console.log(clc.blueBright("stopping previous forever process if exists"));

	var result;
	ssh.exec('forever list | grep ' + configuration.foreverProcessName + ' | cut -c24-27', function(err, stream) {
		if (err) throw err;

		stream.on('data', function(data) {
	      	result = data.length;
	    })
		.on('exit', function(code, signal) {

			if (result) {
				ssh.exec("uid=$(forever list | grep " + configuration.foreverProcessName + " | cut -c24-27) && forever stop $uid", function(err, stream) {
					stream.on('data', function(data) {
						console.log('STDOUT: ' + data);
					})
					.on('exit', function(code, signal) {
						console.log(clc.yellowBright('exit code: ' + code));

						if (code !== 0) {
							operationError();
							return false;
						}

						console.log(clc.greenBright("Previous forever process stopped correctly\n"));
						startForever(ssh);
					});
				});
			}
			else {
				console.log(clc.greenBright("This app has no forever processes running -> go on\n"));
				startForever(ssh);
			}

		});
	});
}

function startForever(ssh) {
	console.log(clc.blueBright("exporting variables and starting forever...\n"));

	//export mongodb variables
	ssh.exec("cd " + configuration.webDirectory + " && export MONGO_URL='mongodb://" + configuration.mongodb.user + ":" + configuration.mongodb.password + "@localhost:" + configuration.mongodb.port + "/" + configuration.mongodb.dbName + "' && export ROOT_URL='http://" + configuration.vHost.domainName + "'" + " && export PORT=" + configuration.port + " && forever start " + configuration.foreverProcessName, function(err, stream) {
		stream.on('data', function(data) {
			console.log('STDOUT: ' + data);
		})
		.on('exit', function(code, signal) {
			console.log(clc.yellowBright('exit code: ' + code));
			
			if (code === 0) {
				console.log(clc.greenBright('YOUR APP IS RUNNING ON ' + configuration.vHost.domainName));
				console.log(clc.greenBright('--- No way as a way, no limit as a limit... ---\n\n'));
			}
			else console.log(clc.redBright("SOMETHING WAS WRONG...\nA velociraptor is always faster than you...\n\n"));

			//clean up operations
			cleanUp();

			//end ssh connection
			ssh.end();
				
		});
	});
}

function cleanUp() {
	execSync('rm ./.deploy/archive.tar.gz');

	localMemoFiles();
}

function operationError() {
	console.log(clc.redBright("ERROR: something wrong while perorming task..."));
	process.exit(1);
}

//initialize current directory
function init() {
	console.log(clc.blueBright("Initializing folder..."));

	mkdirp('./.deploy', function(err) {
	    if (err) throw err;

	    exec("cp -a " + __dirname + "/../assets/. ./.deploy/assets/", function(error, stdout, stderr) {
		    if (error) throw error;

		    exec("cp " + __dirname + "/configuration.json ./.deploy/configuration.json", function(error, stdout, stderr) {
		    	if (error) throw error;

		    	mkdirp('./.deploy/dist', function(err) {
		    		if (err) throw err;

		    		mkdirp('./.deploy/dump', function(err) {
		    			if (err) throw err;

		    			console.log(clc.yellowBright("exit code 0"));
		    			console.log(clc.greenBright("folder initialized\nnow run deploy\n"));
		    			process.exit(0);
		    		});
		    	});
		    });
	    });
	});
}

function deploy() {
	console.log(clc.magentaBright("\n\n--> Starting deploy of meteor application: ") + clc.yellowBright(configuration.appName));
	console.log(clc.magentaBright("-----------------------------------------------------------------"));
	console.log(clc.magentaBright("CK Meteor deploy starting up... -->\n"));

	//create meteor package
	console.log(clc.yellowBright("creating meteor package..."));
	execSync("meteor build .deploy/dist");

	//tar needed files
	console.log(clc.blueBright("everything packed, go for the rest..."));

	if (argv.h) {
		var hostFileName = createVhost();
		execSync('cd ./.deploy/ && tar -zcvf archive.tar.gz assets/' + configuration.hostFileName + ' dist/' + configuration.appName + '.tar.gz');
	}
	else execSync('cd ./.deploy/ && tar -zcvf archive.tar.gz dist/' + configuration.appName + '.tar.gz');

	//send created tar over ssh to remote server
	var ssh = new Connection();

	ssh.on('ready', function() {

		console.log(clc.greenBright('succesfully connected via ssh to remote server\n'));
		console.log(clc.blueBright('creating remote folder in home directory...'));

		ssh.exec('cd /home/' + configuration.sshUser + ' && mkdir -p ' + configuration.appName, function(err, stream) {
			if (err) throw err;

			stream.on('exit', function(code, signal) {
				console.log(clc.yellowBright('exit code: ' + code));

				if (code !== 0) {
					operationError();
					return false;
				}

				console.log(clc.greenBright('remote temp folder for the package created\n'));
				console.log(clc.blueBright('sending remote script to server...\n'));

				//transfer tar.gz package to server
				client.scp('.deploy/archive.tar.gz', {
				    host: configuration.sshAddress,
				    username: configuration.sshUser,
				    password: configuration.sshPass,
				    path: '/home/' + configuration.sshUser + '/' + configuration.appName + '/'
				}, function(err) {
					if (err) console.log(err);

				  	else {
				  		console.log('\n\n');
				  		console.log(clc.greenBright('archive transferred correctly\n'));

				  		untarArchive(ssh);
				  	}
				});

				client.on('transfer', function(buffer, uploaded, total) {
					var percent = uploaded / total;

					if (percent === 0.99) percent = 1.0;
					uploadBar.update(percent);
				});
			});
		});

	}).connect({
		host: configuration.sshAddress,
		port: 22,
		username: configuration.sshUser,
		password: configuration.sshPass
	});
}





//MAIN FLOW
var argv = require('minimist')(process.argv.slice(2));

if (argv.i) {
	init();
}
else {
	if (!fs.existsSync('./.deploy')) {
	    console.log(clc.redBright("this folder is not initialized;\nyou need to run ") + clc.yellowBright("deploy -i\n"));
	    process.exit(1);
	}
	else {
		//read configuration object
		var configuration = readJsonSync('./.deploy/configuration.json');

		deploy();
	}
}