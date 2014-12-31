MeteorDeploy
============

```npm install -g meteor-deploy-ssh```

##**NOTICE:**
This script needs the latest version from master-branch of ssh2 npm module by mscdex (thanks to him for his work);
the current ssh2 module (0.3.6) does not include the latest changes; for convenience I've included the needed files for ssh2 module in subfolder /lib/ssh2-master;

the first time that you will use deploy, the script will overwrite ssh2 module fils in meteor-deploy-ssh/node_modules folder with the latest version automatically;
since the operation (copy files and delete lib/ssh2-master subfolder after that) needs root privileges, the first time you will use this script you will be prompted for sudo password two times for this two operations;

##**TODO:**
- mongodb dump and restore option
- autofind application name

Node script to deploy meteor application to custom server.
It creates meteor package, upload it to your server, unpack, install and launch application with node.js forever.

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

##**OTHER COMMAND LINE OPTIONS:**
```deploy -init ```           will initialize your current folder with .deploy folder; after this you need to update .deploy/configuration.json with correct parameters

```deploy -newdb on **deployPosition**```        will create a new mongodb user on your server for the app; the option "on" is needed only if -newdb is used without "to" option (only mongodb user creation without deploy)

```deploy to **deployPosition** -vhost```        will create the virtualhost file for apache, upload it to the server together with the meteor package, enable the new site and restart apache before deploy. Useful if your server is not yet setted up for the new website that will serve the meteor app;
**Important:** wrong parameters or connection problems can make apache restart failure; so be sure to be able to connect by ssh, eventually delete the new vhost file and restart apache manually;

##**EXAMPLES**
deploy app on "production" (production should be a object with all parameters setted up in .deploy/configuration.json);

```deploy to production```

create mongo db user and deploy on "production" (if you don't have a mongodb database & user already configured for the app on your server)

```deploy to production -newdb```

create mongo db user, virtual host file and deploy enabling new website on apache

```deploy to production -vhost -newdb```

create mongo db user without deploy

```deploy -newdb on production```


##**configuration.json**

in this file there are:
- a **local** object containing configuration for local meteor app (only mongodb port for now; not used yet, will be used to restore locally db dumps)
- N **"deployPosition"** objects, each of them with the following fields:

(after you run ```deploy -init```, look you can copy and paste "production" object in .deploy/configuration.json in order to set up ad many deploy environments as you need)


[the vHost parameters are optionals: they are needed only if you will use vhost option]
- **vHost** object contains informations about apache configuration (used to deploy app to a domain that does not exist yet on your server):
    - **apache24**: set to true if your server uses apache 2.4 (that needs .conf suffix in virtual host file); set to false if you are using apache 2.2 or older
    - **baseFile**: is the local file used to build the virtual host for your meteor app; it contains ```<<<placeholders>>>``` that will be substituted with necessary data by the script; you can edit this file if you need to; it is not needed to edit this line of configuration.json if you don't move the file away from assets folder
    - **destDir**: is the folder on your server where the virtual host file should be saved (depends by server's configuration)

- **mongodb** object contains parameters to connect to your remote mongo db for your app
    [the first three parameters are optionals: are needed only if you need to create a new user for mongodb on your server]
    - **rootUser**: the username of an admin user in mongodb (should be able to create users)
    - **rootPass**: the password of mongo admin user
    - **rootAuthDb**: the name of the db where admin user belongs to

    - **user**: remote mongodb username
    - **password**: remote mongodb password
    - **serverAddress**: the ip of the server where mongo is running (for now it is supported only the same server where app is unpacked)
    - **port**: port used by mongodb on your server (default 27017)
    - **dbName**: the name of the db that should be used by the app

- **distDir**: local folder used to save the meteor package; you don't need to change this; the meteor package is not deleted after deploy, so if you need it you can find it in this folder
- **webDirectory**: remote folder where your app should be unpacked on your server
- **appName**: your application name (**important:** this is the name choosen when the application has been created with meteor; you cannot use another name here)
- **port**: the port that your application will use on your sever
- **foreverProcessName**: the process name that will be used by forever to launch the application
- **sshUser**: username for ssh connection to your server
- **sshAddress**: your server ip for ssh connection
- **sshPass**: password for your ssh user
- **localProcessMemoFile**: this script creates an index file of all deployed processes and respectives used ports; this is the path where this file should be saved locally

###**Roadmap:**
Right now this script only deploy your meteor app to the server; soon db data transfer to the server and viceversa and virtual host creation will be implemented


###**ChangeLog:**
- 31/12/2014
    - automatic ssh2 files update from mscdex/ssh2 master-branch
    - better error management

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