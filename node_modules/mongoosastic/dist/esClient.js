"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEsClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
function createEsClient(options) {
    if (options.clientOptions) {
        return new elasticsearch_1.Client(options.clientOptions);
    }
    else {
        return new elasticsearch_1.Client({ node: 'http://localhost:9200' });
    }
}
exports.createEsClient = createEsClient;
//# sourceMappingURL=esClient.js.map