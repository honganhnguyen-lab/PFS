"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrate = exports.reformatESTotalNumber = exports.deleteById = exports.serialize = exports.filterMappingFromMixed = exports.getIndexName = exports.isStringArray = exports.isString = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
function isString(subject) {
    return typeof subject === 'string';
}
exports.isString = isString;
function isStringArray(arr) {
    return arr.filter && arr.length === arr.filter((item) => typeof item === 'string').length;
}
exports.isStringArray = isStringArray;
function getIndexName(doc) {
    const options = doc.esOptions();
    const indexName = options && options.index;
    if (!indexName) {
        return doc.collection.name;
    }
    else {
        return indexName;
    }
}
exports.getIndexName = getIndexName;
function filterMappingFromMixed(props) {
    const filteredMapping = {};
    Object.keys(props).map((key) => {
        const field = props[key];
        if (field.type !== 'mixed') {
            filteredMapping[key] = field;
            if (field.properties) {
                filteredMapping[key].properties = filterMappingFromMixed(field.properties);
                if ((0, lodash_1.isEmpty)(filteredMapping[key].properties)) {
                    delete filteredMapping[key].properties;
                }
            }
        }
    });
    return filteredMapping;
}
exports.filterMappingFromMixed = filterMappingFromMixed;
function serialize(model, mapping) {
    let name;
    function _serializeObject(object, mappingData) {
        var _a;
        const serialized = {};
        let field;
        let val;
        for (field in mappingData.properties) {
            if ((_a = mappingData.properties) === null || _a === void 0 ? void 0 : _a.hasOwnProperty(field)) {
                val = serialize.call(object, object[field], mappingData.properties[field]);
                if (val !== undefined) {
                    serialized[field] = val;
                }
            }
        }
        return serialized;
    }
    if (mapping.properties && model) {
        if (Array.isArray(model)) {
            return model.map((object) => _serializeObject(object, mapping));
        }
        return _serializeObject(model, mapping);
    }
    const outModel = mapping.cast ? mapping.cast(model) : model;
    if (typeof outModel === 'object' && outModel !== null) {
        name = outModel.constructor.name;
        if (name === 'ObjectID') {
            return outModel.toString();
        }
        if (name === 'Date') {
            return new Date(outModel).toJSON();
        }
    }
    return outModel;
}
exports.serialize = serialize;
function deleteById(document, opt) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        yield opt.client
            .delete({
            index: opt.index,
            id: opt.id,
        }, {})
            .then((res) => document.emit('es-removed', null, res))
            .catch((error) => document.emit('es-removed', error, null));
    });
}
exports.deleteById = deleteById;
function reformatESTotalNumber(res) {
    Object.assign(res.body.hits, {
        total: res.body.hits.total.value,
        extTotal: res.body.hits.total,
    });
    return res;
}
exports.reformatESTotalNumber = reformatESTotalNumber;
function hydrate(res, model, opts) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const options = model.esOptions();
        const clonedRes = res;
        const results = clonedRes.body.hits;
        const resultsMap = {};
        const ids = results.hits.map((result, idx) => {
            resultsMap[result._id] = idx;
            return result._id;
        });
        const query = model.find({
            _id: {
                $in: ids,
            },
        });
        const hydrateOptions = opts.hydrateOptions
            ? opts.hydrateOptions
            : options.hydrateOptions
                ? options.hydrateOptions
                : {};
        query.setOptions(hydrateOptions);
        const docs = yield query.exec();
        let hits;
        const docsMap = {};
        if (!docs || docs.length === 0) {
            results.hits = [];
            results.hydrated = [];
            clonedRes.body.hits = results;
            return clonedRes;
        }
        if (hydrateOptions && hydrateOptions.sort) {
            hits = docs;
        }
        else {
            docs.forEach((doc) => {
                docsMap[doc._id] = doc;
            });
            hits = results.hits.map((result) => docsMap[result._id]);
        }
        if (opts.highlight || opts.hydrateWithESResults) {
            hits.forEach((doc) => {
                const idx = resultsMap[doc._id];
                if (opts.highlight) {
                    doc._highlight = results.hits[idx].highlight;
                }
                if (opts.hydrateWithESResults) {
                    doc._esResult = results.hits[idx];
                    if (!opts.hydrateWithESResults.source) {
                        delete doc._esResult._source;
                    }
                }
            });
        }
        results.hits = [];
        results.hydrated = hits;
        clonedRes.body.hits = results;
        return clonedRes;
    });
}
exports.hydrate = hydrate;
//# sourceMappingURL=utils.js.map