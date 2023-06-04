import { Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel } from './types';
export default class Generator {
    generateMapping(schema: Schema<MongoosasticDocument, MongoosasticModel<MongoosasticDocument>>): Record<string, any>;
    getCleanTree(schema: Schema<MongoosasticDocument, MongoosasticModel<MongoosasticDocument>>): Record<string, any>;
}
