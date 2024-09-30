const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const bodyParser = require("body-parser");
const uuid = require("uuid");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const dbPath = path.join(__dirname, "userDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

// add user_address

app.post("/register", async (request, response) => {
  const { username, street, city, zip_code, state } = request.body;

  const getUserQuery = `select * from users where name = '${username}';`;
  const isUserPresent = await db.get(getUserQuery);
  const { v4: uuidv4 } = uuid;
  let id = uuidv4();

  if (isUserPresent === undefined) {
    //adduser
    const addUserQuery = `
    INSERT INTO users(id,name) 
    VALUES('${id}',
    '${username}');
  `;
    const dbUserResponse = await db.run(addUserQuery);
    //addAddess
    const addAddressQuery = `
    INSERT INTO address(user_id, street, city, state, zip_code)
    VALUES('${id}','${street}','${city}','${state}','${zip_code}');
  `;
    const dbResponse = await db.run(addAddressQuery);
    response.send(dbUserResponse);
    console.log("user Added Successfully");
  } else {
    const lastId = isUserPresent.id;
    const addAddressQuery = `
  INSERT INTO address(user_id, street, city, state, zip_code)
  VALUES('${lastId}','${street}','${city}','${state}','${zip_code}');
  `;
    const dbResponse = await db.run(addAddressQuery);

    response.send(dbResponse);
    console.log("Address Added Successfully");
  }
});

//all users

app.get("/all_users", async (request, response) => {
  const allQuery = `SELECT * FROM users;`;
  const dbRes = await db.all(allQuery);
  response.send(dbRes);
  console.log("All Users");
});

//address

app.get("/all_address", async (request, response) => {
  const addressQuery = `select * from address;`;
  const dbRes = await db.all(addressQuery);
  response.send(dbRes);
  console.log(dbRes);
});

//all_users_address
app.get("/users_with_addresses", async (request, response) => {
  const getUsersWithAddressesQuery = `
    SELECT 
      *
    FROM
      users AS u
    LEFT JOIN 
      address AS a ON u.id = a.user_id;
  `;

  const usersWithAddresses = await db.all(getUsersWithAddressesQuery);
  response.send(usersWithAddresses);
});

// deleteUser
app.delete("/deleteUser/:id", async (request, response) => {
  const { id } = request.params;

  const deleteQuery = `
  delete from users where id = ${id};
  `;

  const dbRes = await db.run(deleteQuery);
  response.send(dbRes);
  console.log("deleted User Successfully");
});

//deleteaddress
app.delete("/deleteAddress/:id", async (request, response) => {
  const { id } = request.params;

  const deleteQuery = `
  delete from address where user_id = '${id}';
  `;

  const dbRes = await db.run(deleteQuery);
  response.send(dbRes);
  console.log("deleted Address Successfully");
});

initializeDBAndServer();
