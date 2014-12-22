MeteorDeploy
============

Node script to deploy meteor application to custom server.
It creates meteor package, upload it to your server, unpack, install and launch application with node.js forever.

###**Prerequisites:**
This script is designed for a server that runs apache; should not be difficult to adapt it for nginx, since there are differences only if you use the option (not implemented yet) to create virtual host file and restart web server on deploy (if your domain does not exists yet on your server)
- node.js with forever should be installed on your server
- this script uses ssh connection so you need appropriate credentials
- your ssh user should be able to use sudo

##**Usage:**
- fill configuration.json with necessary data
- put all this files into a subfolder in meteor app folder (start this folder's name with a "." to let meteor ignore it during building process)
- run ```node deploy.js from within this repository's folder```


##**configuration.json**

- **vHost** object contains informations about apache configuration (used to deploy app to a domain that does not exist yet on your server):
    - **apache24**: set to true if your server uses apache 2.4 (that needs .conf suffix in virtual host file); set to false if you are using apache 2.2 or older
    - **baseFile**: is the local file used to build the virtual host for your meteor app; it contains ```<<<placeholders>>>``` that will substituted with necessary data by the script; you can edit this file if you need to; it is not needed to edit this line of configuration.json if you don't move the file away from assets folder
    - **destDir**: is the folder on your server where the virtual host file should be saved (depends by server's configuration)

- **mongodb** object contains parameters to connect to your remote mongo db for your app
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
- **appName**: your application name
- **port**: the port that your application will use on your sever
- **foreverProcessName**: the process name that will be used by forever to launch the application
- **sshUser**: username for ssh connection to your server
- **sshAddress**: your server ip for ssh connection
- **sshPass**: password for your ssh user
- **localProcessMemoFile**: this script creates an index file of all deployed processes and respectives used ports; this is the path where this file should be saved locally

###**Roadmap:**
Right now this script only deploy your meteor app to the server; soon db data transfer to the server and viceversa and virtual host creation will be implemented


###**ChangeLog:**
- 22/12/2014 added memo file function