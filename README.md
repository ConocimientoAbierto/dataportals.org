# Portales de Datos

## Developer Instructions
This app requires NodeJS (>= v4.7).

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

7. change config file in `lib/configAPP.js` to populate with your dbName, dbUser, dbPass and sessionSecret.

8. install dependecies:
```shell
npm install
```

9. run the app
```shell
npm start
```

10. app live at `http://localhost:5000`


---


Code for running DataPortals.org.

[The original plans for DataCatalogs.org - Feb 2013](https://docs.google.com/a/okfn.org/document/d/1MP1eaxUPir9msLt4rRwYqdupE3-qeLZAqFXRiXuvwkA/edit).
Other ideas may be listed as Issues in this repository.
Conversations with the Open Knowledge community are held in the [discussion forum](https://discuss.okfn.org/c/open-knowledge-labs/dataportals).  

You can contribute additions or corrections to the data portal list by suggesting changes to the [data.csv](https://github.com/okfn/dataportals.org/blob/master/data/portals.csv) file. See the [datapackage.json](https://github.com/okfn/dataportals.org/blob/master/data/datapackage.json) for the meaning of each column.

## Developer Instructions

This app requires NodeJS (>= v0.8).

1. Clone this repo: https://github.com/okfn/dataportals.org
2. Install the dependencies:

        npm install .
3. Try it out locally:

        node app.js

   Then point your browser at http://localhost:5000/


## Deployment

We deploy by default to Heroku.

Follow these instructions (with obvious modifications):
https://github.com/okfn/datasets.okfnlabs.org#deployment-to-heroku
