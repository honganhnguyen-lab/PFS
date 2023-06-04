"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esSearch = exports.search = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("./utils");
function search(query, opts = {}) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const fullQuery = {
            query: query,
        };
        const bindedEsSearch = esSearch.bind(this);
        return bindedEsSearch(fullQuery, opts);
    });
}
exports.search = search;
function esSearch(query, opts = {}) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const options = this.esOptions();
        const client = this.esClient();
        const { highlight, suggest, aggs, min_score, routing } = opts;
        const body = Object.assign({ highlight, suggest, aggs, min_score }, query);
        const esQuery = {
            body: body,
            routing: routing,
            index: (0, utils_1.getIndexName)(this),
        };
        if (opts.sort) {
            if ((0, utils_1.isString)(opts.sort) || (0, utils_1.isStringArray)(opts.sort)) {
                esQuery.sort = opts.sort;
            }
            else {
                body.sort = opts.sort;
                esQuery.body = body;
            }
        }
        Object.keys(opts).forEach((opt) => {
            if (!opt.match(/(hydrate|sort|aggs|highlight|suggest)/) && opts.hasOwnProperty(opt)) {
                esQuery[opt] = opts[opt];
            }
        });
        const res = yield client.search(esQuery);
        const resp = (0, utils_1.reformatESTotalNumber)(res);
        if (options.alwaysHydrate || opts.hydrate) {
            return (0, utils_1.hydrate)(resp, this, opts);
        }
        else {
            return resp;
        }
    });
}
exports.esSearch = esSearch;
//# sourceMappingURL=search.js.map