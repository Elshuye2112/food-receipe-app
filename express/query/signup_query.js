const signup_HASURA_OPERATION = `
mutation signup($fname:String!,$lname:String!,$password:String! , $email:String!) {
  insert_users_one(object: {fname: $fname, lname: $lname, password: $password, email: $email}) {
    id
    email
    fname
    lname
    password
      }
}
`;

module.exports = signup_HASURA_OPERATION;
