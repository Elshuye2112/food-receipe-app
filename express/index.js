const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const signup_query = require("./query/signup_query");
const login_query = require("./query/login_query");
require("dotenv").config();

const app = express();

app.use(express.json());
// app.use(helmet());

app.get("/", (req, res) => {
  res.send("Server running ... ");
});

// signup query execute
const signup_execute = async (variables) => {
  const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
    method: "POST",
    headers: { "x-hasura-admin-secret": "myadminsecretkey" },
    body: JSON.stringify({
      query: signup_query,
      variables,
    }),
  });
  const data = await fetchResponse.json();
  console.log("DEBUG: ", data);
  return data;
};

// login query execute
const login_execute = async (variables) => {
  const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
    method: "POST",
    headers: { "x-hasura-admin-secret": "myadminsecretkey" },
    body: JSON.stringify({
      query: login_query,
      variables,
    }),
  });
  const data = await fetchResponse.json();
  console.log("DEBUG: ", data);
  return data;
};

// Sign Up Request Handler
app.post("/signup", async (req, res) => {
  // get request input
  const { fname, lname, email } = req.body.input;

  // run some business logic
  const password = await bcrypt.hash(req.body.input.password, 10);
  // execute the Hasura operation
  const { data, errors } = await signup_execute({
    fname,
    lname,
    password,
    email,
  });
  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json(errors[0]);
  }


  const usertokenContents = {
    sub: data.insert_users_one.id,
    name: fname,
    iat: Date.now() / 1000,
    iss: "https://myapp.com/",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["admin", "anonymous", "user"],
      "x-hasura-user-id": data.insert_users_one.id,
      "x-hasura-default-role": "user",
      "x-hasura-role": "user",
    },
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  };

  const token = jwt.sign(
usertokenContents,
    process.env.HASURA_JWT_SECRET_KEY || "z8pXvFrDjGWb3mRSJBAp9ZljHRnMofLF"
  );
  console.log(data.insert_users_one.role);
  console.log(token);
  // success
  return res.json({
    ...data.insert_users_one,
    token: token,
  });
});

// Login Request Handler
app.post("/Login", async (req, res) => {
  // get request input
  const { email, password } = req.body.input;

  const { data, errors } = await login_execute({ email });
  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json(errors[0]);
  }
  if (data.users.length === 0) {
    return res.status(400).json({
      message: "Invalid Password or email or , Please try again.",
    });
  }

  const validPassword = await bcrypt.compare(
    password,
    data.users[0].password
  );
  if (!validPassword)
    return res
      .status(400)
      .json({ message: "Invalid email or Password." });
  console.log("The password is " + validPassword);

  // token claim for customer
  const customertokenContents = {
    sub: data.users[0].id,
    name: data.users[0].fname,
    iat: Date.now() / 1000,
    iss: "https://myapp.com/",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["user", "anonymous", "admin"],
      "x-hasura-user-id": data.users[0].id,
      "x-hasura-default-role": "user",
      "x-hasura-role": "user",
    },
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  };

  // token claim for delivery_person
  const delivery_persontokenContents = {
    sub: data.users[0].id,
    name: data.users[0].fname,
    iat: Date.now() / 1000,
    iss: "https://myapp.com/",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["customer", "anonymous", "delivery_person"],
      "x-hasura-user-id": data.users[0].id,
      "x-hasura-default-role": "delivery_person",
      "x-hasura-role": "delivery_person",
    },
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  };

  const token = jwt.sign(
    data.users[0].role == "delivery_person"
      ? delivery_persontokenContents
      : customertokenContents,
    process.env.HASURA_JWT_SECRET_KEY || "z8pXvFrDjGWb3mRSJBAp9ZljHRnMofLF"
  );

  console.log("......................");
  console.log(token);
  console.log("......................");

  // success
  return res.json({
    ...data.users[0],
    token: token,
  });
});

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});