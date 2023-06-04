"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esCount = exports.refresh = exports.esTruncate = exports.synchronize = exports.createMapping = void 0;
const tslib_1 = require("tslib");
const events_1 = require("events");
const hooks_1 = require("./hooks");
const mapping_1 = (0, tslib_1.__importDefault)(require("./mapping"));
const utils_1 = require("./utils");
function createMapping(body) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const options = this.esOptions();
        const client = this.esClient();
        const indexName = (0, utils_1.getIndexName)(this);
        const generator = new mapping_1.default();
        const completeMapping = generator.generateMapping(this.schema);
        completeMapping.properties = (0, utils_1.filterMappingFromMixed)(completeMapping.properties);
        const properties = options.properties;
        if (properties) {
            Object.keys(properties).map((key) => {
                completeMapping.properties[key] = properties[key];
            });
        }
        const exists = yield client.indices.exists({
            index: indexName,
        });
        if (exists.body) {
            yield client.indices.putMapping({
                index: indexName,
                body: completeMapping,
            });
            return completeMapping;
        }
        yield client.indices.create({
            index: indexName,
            body: Object.assign({ mappings: completeMapping }, body),
        });
        return completeMapping;
    });
}
exports.createMapping = createMapping;
function synchronize(query = {}, inOpts = {}) {
    const options = this.esOptions();
    const em = new events_1.EventEmitter();
    let counter = 0;
    const bulkOptions = options.bulk;
    options.bulk = {
        delay: (options.bulk && options.bulk.delay) || 1000,
        size: (options.bulk && options.bulk.size) || 1000,
        batch: (options.bulk && options.bulk.batch) || 50,
    };
    const saveOnSynchronize = inOpts.saveOnSynchronize !== undefined ? inOpts.saveOnSynchronize : options.saveOnSynchronize;
    const stream = this.find(query).batchSize(options.bulk.batch).cursor();
    stream.on('data', (doc) => {
        stream.pause();
        counter++;
        function onIndex(indexErr, inDoc) {
            counter--;
            if (indexErr) {
                em.emit('error', indexErr);
            }
            else {
                em.emit('data', null, inDoc);
            }
            stream.resume();
        }
        doc.on('es-indexed', onIndex);
        doc.on('es-filtered', onIndex);
        if (saveOnSynchronize) {
            doc.save((err) => {
                if (err) {
                    counter--;
                    em.emit('error', err);
                    return stream.resume();
                }
            });
        }
        else {
            (0, hooks_1.postSave)(doc);
        }
    });
    stream.on('close', () => {
        const closeInterval = setInterval(() => {
            if (counter === 0) {
                clearInterval(closeInterval);
                em.emit('close');
                options.bulk = bulkOptions;
            }
        }, 1000);
    });
    stream.on('error', (err) => {
        em.emit('error', err);
    });
    return em;
}
exports.synchronize = synchronize;
function esTruncate() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const client = this.esClient();
        const indexName = (0, utils_1.getIndexName)(this);
        const settings = yield client.indices.getSettings({
            index: indexName
        });
        const body = settings.body[indexName];
        delete body.settings.index.creation_date;
        delete body.settings.index.provided_name;
        delete body.settings.index.uuid;
        delete body.settings.index.version;
        yield client.indices.delete({
            index: indexName
        });
        yield this.createMapping(body);
    });
}
exports.esTruncate = esTruncate;
function refresh() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        return this.esClient().indices.refresh({
            index: (0, utils_1.getIndexName)(this),
        });
    });
}
exports.refresh = refresh;
function esCount(query) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        if (query === undefined) {
            query = {
                match_all: {},
            };
        }
        const esQuery = {
            body: {
                query: query,
            },
            index: (0, utils_1.getIndexName)(this),
        };
        return this.esClient().count(esQuery);
    });
}
exports.esCount = esCount;
//# sourceMappingURL=statics.js.map