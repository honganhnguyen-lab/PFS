"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRemove = exports.postSave = void 0;
const tslib_1 = require("tslib");
function postSave(doc) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        if (!doc) {
            return;
        }
        const options = doc.esOptions();
        const filter = options && options.filter;
        function onIndex(err, res) {
            if (!filter || !filter(doc)) {
                doc.emit('es-indexed', err, res);
            }
            else {
                doc.emit('es-filtered', err, res);
            }
        }
        const populate = options && options.populate;
        if (doc) {
            if (populate && populate.length) {
                const popDoc = yield doc.populate(populate);
                popDoc
                    .index()
                    .then((res) => onIndex(null, res))
                    .catch((err) => onIndex(err, null));
            }
            else {
                doc
                    .index()
                    .then((res) => onIndex(null, res))
                    .catch((err) => onIndex(err, null));
            }
        }
    });
}
exports.postSave = postSave;
function postRemove(doc) {
    if (!doc) {
        return;
    }
    doc.unIndex();
}
exports.postRemove = postRemove;
//# sourceMappingURL=hooks.js.map