# Portales de Datos

## Developer Instructions
This app requires NodeJS (>= v6.10).

1. Clone the dev branch of this repo.
```shell
git clone -b dev --single-branch https://github.com/ConocimientoAbierto/dataportals.org.git
```

2. install mongoDB -> [oficial doc installation](https://docs.mongodb.com/manual/installation/)

3. config mongoDB -> [oficial doc config auth](https://docs.mongodb.com/v3.2/tutorial/enable-authentication/)

4. create user for the DB
```shell
#in the mongo shell
use yourDataBaseName
db.createUser({
  user: "yourUser",
  pwd: "yourPass",
  roles: [ role: "readWrite", db: "yourDataBaseName" ]
})
```

5. go to project dir
```shell
cd /path/to/project/dataportals.org
```

6. make config file
```shell
cp ./lib/sampleConfigApp.js ./lib/configAPP.js
```

7. change config file in `lib/configAPP.js` to populate with your dbName, dbUser, dbPass and sessionSecret and mail info for OAuth2.

8. install dependecies:
```shell
npm install
```

9. run the app
```shell
npm start
```

10. app live at `http://localhost:5000`
