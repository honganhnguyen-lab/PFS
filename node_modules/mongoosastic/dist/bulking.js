"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flush = exports.bulkIndex = exports.bulkDelete = exports.bulkAdd = void 0;
const tslib_1 = require("tslib");
let bulkBuffer = [];
let bulkTimeout;
function clearBulkTimeout() {
    clearTimeout(bulkTimeout);
    bulkTimeout = undefined;
}
function bulkAdd(opts) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const instruction = [
            {
                index: {
                    _index: opts.index,
                    _id: opts.id,
                },
            },
            opts.body,
        ];
        yield bulkIndex(opts.model, instruction, opts.bulk);
    });
}
exports.bulkAdd = bulkAdd;
function bulkDelete(opts) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const instruction = [
            {
                delete: {
                    _index: opts.index,
                    _id: opts.id,
                },
            },
        ];
        yield bulkIndex(opts.model, instruction, opts.bulk);
    });
}
exports.bulkDelete = bulkDelete;
function bulkIndex(model, instruction, bulk) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        bulkBuffer = bulkBuffer.concat(instruction);
        if (bulkBuffer.length >= bulk.size) {
            yield model.flush();
            clearBulkTimeout();
        }
        else if (bulkTimeout === undefined) {
            bulkTimeout = setTimeout(() => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
                yield model.flush();
                clearBulkTimeout();
            }), bulk.delay);
        }
    });
}
exports.bulkIndex = bulkIndex;
function flush() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        this.esClient()
            .bulk({
            body: bulkBuffer,
        })
            .then((res) => {
            if (res.body.items && res.body.items.length) {
                for (let i = 0; i < res.body.items.length; i++) {
                    const info = res.body.items[i];
                    if (info && info.index && info.index.error) {
                        this.bulkError().emit('error', null, info.index);
                    }
                }
            }
        })
            .catch((error) => this.bulkError().emit('error', error, null));
        bulkBuffer = [];
    });
}
exports.flush = flush;
//# sourceMappingURL=bulking.js.map