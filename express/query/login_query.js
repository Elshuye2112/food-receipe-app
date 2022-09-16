// Login Query
const LOGIN_HASURA_OPERATION = `
query login($email: String!){
  users(where: {email: {_eq: $email}}){
	id
  email
  password
  fname
  lname
  }
}

`;

module.exports = LOGIN_HASURA_OPERATION;
