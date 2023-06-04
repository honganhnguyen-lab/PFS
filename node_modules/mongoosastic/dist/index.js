"use strict";
const tslib_1 = require("tslib");
const events_1 = (0, tslib_1.__importDefault)(require("events"));
const bulking_1 = require("./bulking");
const esClient_1 = require("./esClient");
const hooks_1 = require("./hooks");
const mapping_1 = (0, tslib_1.__importDefault)(require("./mapping"));
const methods_1 = require("./methods");
const search_1 = require("./search");
const statics_1 = require("./statics");
const defaultOptions = {
    indexAutomatically: true,
    saveOnSynchronize: true,
};
function mongoosastic(schema, options = {}) {
    options = Object.assign(Object.assign({}, defaultOptions), options);
    const client = options.esClient ? options.esClient : (0, esClient_1.createEsClient)(options);
    const generator = new mapping_1.default();
    schema.method('esOptions', () => {
        return options;
    });
    schema.static('esOptions', () => {
        return options;
    });
    schema.method('esClient', () => {
        return client;
    });
    schema.static('esClient', () => {
        return client;
    });
    schema.method('index', methods_1.index);
    schema.method('unIndex', methods_1.unIndex);
    schema.static('synchronize', statics_1.synchronize);
    schema.static('esTruncate', statics_1.esTruncate);
    schema.static('search', search_1.search);
    schema.static('esSearch', search_1.esSearch);
    schema.static('createMapping', statics_1.createMapping);
    schema.static('getMapping', () => {
        return generator.generateMapping(schema);
    });
    schema.static('getCleanTree', () => {
        return generator.getCleanTree(schema);
    });
    schema.static('esCount', statics_1.esCount);
    schema.static('refresh', statics_1.refresh);
    schema.static('flush', bulking_1.flush);
    const bulkErrEm = new events_1.default.EventEmitter();
    schema.static('bulkError', () => {
        return bulkErrEm;
    });
    if (options.indexAutomatically) {
        schema.post('save', hooks_1.postSave);
        schema.post('insertMany', (docs) => docs.forEach((doc) => (0, hooks_1.postSave)(doc)));
        schema.post('findOneAndUpdate', hooks_1.postSave);
        schema.post('remove', hooks_1.postRemove);
        schema.post(['findOneAndDelete', 'findOneAndRemove'], hooks_1.postRemove);
    }
}
module.exports = mongoosastic;
//# sourceMappingURL=index.js.map