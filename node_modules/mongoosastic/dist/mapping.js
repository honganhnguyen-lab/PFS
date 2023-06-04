"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function getTypeFromPaths(paths, field) {
    let type = false;
    if (paths[field] && paths[field].options.type === Date) {
        return 'date';
    }
    if (paths[field] && paths[field].options.type === Boolean) {
        return 'boolean';
    }
    if (paths[field]) {
        type = paths[field].instance ? paths[field].instance.toLowerCase() : 'object';
    }
    return type;
}
function getMapping(cleanTree, inPrefix) {
    const mapping = {};
    let value;
    let field;
    let prop;
    const implicitFields = [];
    let hasEsIndex = false;
    const prefix = inPrefix !== '' ? `${inPrefix}.` : inPrefix;
    for (field in cleanTree) {
        if (!cleanTree.hasOwnProperty(field)) {
            continue;
        }
        value = cleanTree[field];
        mapping[field] = {};
        mapping[field].type = value.type;
        if (value.es_indexed) {
            hasEsIndex = true;
        }
        else if (value.type) {
            implicitFields.push(field);
        }
        if (typeof value === 'object' && !value.type) {
            mapping[field].type = 'object';
            mapping[field].properties = getMapping(value, prefix + field);
        }
        if (value.type === 'objectid') {
            if (value.ref && value.es_schema) {
                mapping[field].type = 'object';
                mapping[field].properties = getMapping(value, prefix + field);
                continue;
            }
            mapping[field].type = 'string';
        }
        if (value.type === 'number' && value.es_type === undefined) {
            mapping[field].type = 'long';
            continue;
        }
        for (prop in value) {
            if (value.hasOwnProperty(prop) && prop.indexOf('es_') === 0 && prop !== 'es_indexed') {
                mapping[field][prop.replace(/^es_/, '')] = value[prop];
            }
        }
        if (mapping[field].type === undefined) {
            delete mapping[field];
        }
        if (mapping[field] && mapping[field].type === 'string') {
            const textType = {
                type: 'text',
                fields: {
                    keyword: {
                        type: 'keyword',
                        ignore_above: 256,
                    },
                },
            };
            mapping[field] = Object.assign(mapping[field], textType);
        }
    }
    if (hasEsIndex) {
        implicitFields.forEach((implicitField) => {
            delete mapping[implicitField];
        });
    }
    return mapping;
}
function getCleanTree(tree, paths, inPrefix, isRoot = false) {
    const cleanTree = {};
    let type;
    let value;
    let field;
    let prop;
    let treeNode;
    let subTree;
    let key;
    let geoFound = false;
    const prefix = inPrefix !== '' ? `${inPrefix}.` : inPrefix;
    tree = (0, lodash_1.cloneDeep)(tree);
    paths = (0, lodash_1.cloneDeep)(paths);
    for (field in tree) {
        if (prefix === '' && field === '_id' && isRoot) {
            continue;
        }
        type = getTypeFromPaths(paths, prefix + field);
        value = tree[field];
        if (value.es_indexed === false) {
            continue;
        }
        if (type) {
            if (value[0] || type === 'embedded') {
                nestedSchema(paths, field, cleanTree, value, prefix);
            }
            else if (value.type && Array.isArray(value.type)) {
                nestedSchema(paths, field, cleanTree, value, prefix);
                for (prop in value) {
                    if (value.hasOwnProperty(prop) && prop.indexOf('es_') === 0) {
                        cleanTree[field][prop] = value[prop];
                    }
                }
            }
            else if (paths[field] &&
                paths[field].options.es_schema &&
                paths[field].options.es_schema.tree &&
                paths[field].options.es_schema.paths) {
                subTree = paths[field].options.es_schema.tree;
                if (paths[field].options.es_select) {
                    for (treeNode in subTree) {
                        if (!subTree.hasOwnProperty(treeNode)) {
                            continue;
                        }
                        if (paths[field].options.es_select.split(' ').indexOf(treeNode) === -1) {
                            delete subTree[treeNode];
                        }
                    }
                }
                cleanTree[field] = getCleanTree(subTree, paths[field].options.es_schema.paths, '');
            }
            else if (value === String ||
                value === Object ||
                value === Date ||
                value === Number ||
                value === Boolean ||
                value === Array) {
                cleanTree[field] = {};
                cleanTree[field].type = type;
            }
            else {
                cleanTree[field] = {};
                for (key in value) {
                    if (value.hasOwnProperty(key)) {
                        cleanTree[field][key] = value[key];
                    }
                }
                cleanTree[field].type = type;
            }
        }
        else {
            if (typeof value === 'object') {
                for (key in value) {
                    if (value.hasOwnProperty(key) && /^geo_/.test(key)) {
                        cleanTree[field] = value[key];
                        geoFound = true;
                    }
                }
                if (geoFound) {
                    continue;
                }
            }
            if (typeof value === 'object' && value.getters && value.setters && value.options) {
                continue;
            }
            if (typeof value === 'object') {
                cleanTree[field] = getCleanTree(value, paths, prefix + field);
            }
        }
    }
    return cleanTree;
}
function nestedSchema(paths, field, cleanTree, value, prefix) {
    let treeNode;
    let subTree;
    if (paths[prefix + field] &&
        paths[prefix + field].schema &&
        paths[prefix + field].schema.tree &&
        paths[prefix + field].schema.paths) {
        cleanTree[field] = getCleanTree(paths[prefix + field].schema.tree, paths[prefix + field].schema.paths, '');
    }
    else if (paths[prefix + field] &&
        Array.isArray(paths[prefix + field].options.type) &&
        paths[prefix + field].options.type[0].es_schema &&
        paths[prefix + field].options.type[0].es_schema.tree &&
        paths[prefix + field].options.type[0].es_schema.paths) {
        subTree = paths[field].options.type[0].es_schema.tree;
        if (paths[field].options.type[0].es_select) {
            for (treeNode in subTree) {
                if (!subTree.hasOwnProperty(treeNode)) {
                    continue;
                }
                if (paths[field].options.type[0].es_select.split(' ').indexOf(treeNode) === -1) {
                    delete subTree[treeNode];
                }
            }
        }
        cleanTree[field] = getCleanTree(subTree, paths[prefix + field].options.type[0].es_schema.paths, '');
    }
    else if (paths[prefix + field] && paths[prefix + field].caster && paths[prefix + field].caster.instance) {
        if (typeof value[0] === 'object') {
            cleanTree[field] = value[0];
        }
        else if (typeof value === 'object') {
            cleanTree[field] = value;
        }
        else {
            cleanTree[field] = {};
        }
        cleanTree[field].type = paths[prefix + field].caster.instance.toLowerCase();
    }
    else if (!paths[field] && prefix) {
        if (paths[prefix + field] && paths[prefix + field].caster && paths[prefix + field].caster.instance) {
            cleanTree[field] = {
                type: paths[prefix + field].caster.instance.toLowerCase(),
            };
        }
    }
    else {
        cleanTree[field] = {
            type: 'object',
        };
    }
}
class Generator {
    generateMapping(schema) {
        const cleanTree = getCleanTree(schema['tree'], schema.paths, '', true);
        delete cleanTree[schema.get('versionKey')];
        const mapping = getMapping(cleanTree, '');
        return { properties: mapping };
    }
    getCleanTree(schema) {
        return getCleanTree(schema['tree'], schema.paths, '', true);
    }
}
exports.default = Generator;
//# sourceMappingURL=mapping.js.map