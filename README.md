MeteorDeploy
============

```npm install -g meteor-deploy-ssh```

Node script to deploy meteor application to custom server.
It creates meteor package, upload it to your server, unpack, install and launch application with node.js forever.

##**WHAT IT DOES:**
- create meteor package and send it to a server via ssh, extract it in specified website folder, install dependencies from npm, and run application with forever
- optionally creates virtual host file, upload it to the server together with meteor package, move it in apache's folder, enable new website and restart apache
- optionally creates a mongo dump from local or remote mongo db
- optionally restores a mongo dump locally or remotely

###**Prerequisites:**
This script has a virtual host creation option designed for a server that runs apache with reversed proxy; should not be difficult to adapt this option for nginx, (you just need to edit .deploy/assets/vhost.txt file, since the provided one is for apache).

If your server is running apache < 2.4 the ws reverse proxy will not work (your app will fallback to XHR polling).

- node.js with forever should be installed on your server
- this script uses ssh connection so you need appropriate credentials
- your ssh user should be able to use sudo

##**Usage:**
- install as global npm module and run ```deploy -init``` from within your meteor app's folder
- this will create a .deploy folder inside your meteor app's folder; fill the **.deploy/configuration.json** file with the needed informations;
- then run:

```deploy to **deployPosition**``` (from within the meteor app's folder)

##**COMMAND LINE OPTIONS:**
**-init** initializes your current folder with .deploy folder; after this you need to update .deploy/configuration.json with correct parameters

**-newdb on \_deployPosition\_** creates a new mongodb user on your server for the app; the option "on" is needed only if -newdb is used without "to" option (only mongodb user creation without deploy)

**-vhost** manages virtual host file creation, and apache server restart (use this option if the website that will serve the app is not yet setted up on your server).<br/>
*please pay attention*: due to connection problems or wrong parameters, apache restart operation can fail; in this case you need to be able to correct the problem and restart it manually.

**-dump \_deployPosition\_** executes mongodump from specified position (use "local" to backup the db of locally running meteor app)

**-r \_source\_ \_destination\_** restores the specified mongodump (use "local" to restore a dump creted from local meteor app) to the specified destination mongo server.
If the **-r** option is used together with **to** option, the argument of **to** will be used as **_destination_**.

**-nows** disables web-sockets in your app using export DISABLE_WEBSOCKETS=true before launching it (to use if your server is running apach 2.2 with no support for ws reverse proxy; this will avoid the waste of time for ws handshake when not supported)

##**EXAMPLES**

*Assuming production being an object with all parameters setted up in .deploy/configuration.json*

deploy app on "production"

```deploy to production```

create mongo db user and deploy on "production" (if you don't have a mongodb database & user already configured for the app on your server)

```deploy to production -newdb```

create mongo db user, virtual host file and deploy enabling new website on apache

```deploy to production -vhost -newdb```

create mongo db user without deploy

```deploy -newdb on production```

create mongo dump for local database (meteor should be running for this) (mongo restore option coming soon...)

```deploy -dump local```

create mongo dump for remote database

```deploy -dump production```

restore a local dump to production server

```deploy -r local production```

all together (create local dump, create new remote mongo user, restore from local to remote, create virtual host and deploy)

```deploy to production -newdb -vhost -dump local -r local```

##**configuration.json**

in this file there are:
- a **local** object containing configuration for local meteor app
- N **"deployPosition"** objects, each of them with the following fields:

(after you run ```deploy -init```, look you can copy and paste "production" object in .deploy/configuration.json in order to set up as many deploy environments as you need)


[the vHost parameters are optionals: they are needed only if you will use vhost option]
- **vHost** object contains informations about apache configuration (used to deploy app to a domain that does not exist yet on your server):
    - **apache24**: set to true if your server uses apache 2.4 (that needs .conf suffix in virtual host file's name); set to false if you are using apache 2.2 or older
    - **baseFile**: is the local file used to build the virtual host for your meteor app; it contains ```<<<placeholders>>>``` that will be substituted with necessary data by the script; you can edit this file if you need to; it is not needed to edit this line of configuration.json if you don't move the file away from assets folder
    - **destDir**: is the folder on your server where the virtual host file should be saved (depends by server's configuration)

- **mongodb** object contains parameters to connect to your remote mongo db for your app
    [the first three parameters are optionals: are needed only if you need to create a new user for mongodb on your server]
    - **rootUser**: the username of an admin user in mongodb (should be able to create users)
    - **rootPass**: the password of mongo admin user
    - **rootAuthDb**: the name of the db where admin user belongs to

    - **user**: remote mongodb username
    - **password**: remote mongodb password
    - **serverAddress**: the ip of the server where mongo is running
    - **port**: port used by mongodb on your server (default 27017)
    - **dbName**: the name of the db that should be used by the app

- **distDir**: local folder used to save the meteor package; you don't need to change this; the meteor package is not deleted after deploy, so if you need it you can find it in this folder
- **webDirectory**: remote folder where your app should be unpacked on your server
- **port**: the port that your application will use on your sever
- **foreverProcessName**: the process name that will be used by forever to launch the application
- **sshUser**: username for ssh connection to your server
- **sshAddress**: your server ip for ssh connection
- **sshPass**: password for your ssh user
- **localProcessMemoFile**: this script creates an index file of all deployed processes and respectives used ports; this is the path where this file should be saved locally

##**TIPS:**
- if you often deploy new apps to the same server, you should consider to edit the source configuration file, located in module's folder (default is /usr/Local/lib/node_modules/meteor-deploy-ssh/lib/configuration.json); since this is the file copied by "-init" option into ".deploy" folder
- the module use the provided virtual host base file to create virtual host files for your apps; this file is located in module's folder (default is /usr/local/lib/node_modules/meteor-deploy-ssh/assets/vhost.txt); if you have improvements or need an host file with different options, you can edit this; use placeholders ```<<<domainName>>>``` and ```<<<port>>>``` that will be substituted by the script with parameters coming from configuration.json file.

##**NOTICE:**
This script needs the latest version from master-branch of ssh2 npm module by mscdex (thanks to him for his work);
the current ssh2 module on npm (0.3.6) does not include the latest changes; for convenience I've included the needed files for ssh2 module in subfolder /lib/ssh2-master;

the first time that you will use deploy, the script will overwrite ssh2 module files in meteor-deploy-ssh/node_modules folder with the latest version automatically;
since these operations (copy files and delete lib/ssh2-master subfolder after that) needs root privileges, the first time you will use this script you will be prompted for sudo password;

##**Found it useful?**
please consider making a small donation:
[donate](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=igor%2eferrero82%40gmail%2ecom&lc=US&item_name=CK%20web%20design&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)


###**ChangeLog:**
- 21/01/2015 Ver 1.0.9
    - added autofind appName function (no more need to specity it in configuration.json)
    - fixed bug for remote mongorestore

- 05/01/2015 Ver. 1.0.3
    - added "-nows" option

- 03/01/2015 Ver. 1.0.2
    - added port in memo file
    - minor improvements
    - autofind of meteor app's name

- 02/01/2015 Ver. 1.0.0
    - added mongorestore function

- 31/12/2014
    - automatic ssh2 files update from mscdex/ssh2 master-branch
    - better error management
    - added mongo dump option

- 30/12/2014
    - implemented virtual host creation and apache restart
    - better error management
    - corrected bug in ```deploy -init``` option

- 29/12/2014
    - now supporting multi deploy positions
    - implemented remote mongo db user creation

- 26/12/2014 
    - modified to be a global npm module
    - improved memo file function to detect if port for the app has changed

- 22/12/2014 
    - added memo file function
