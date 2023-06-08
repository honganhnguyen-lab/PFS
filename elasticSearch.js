const { Client } = require("@elastic/elasticsearch");
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const esClient = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID,
  },
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD,
    },
  maxRetries: 5,

});

esClient.ping()
  .then(response => console.log("You are connected to Elasticsearch!"))
  .catch(error => console.error("Elasticsearch is not connected."))


module.exports = esClient;