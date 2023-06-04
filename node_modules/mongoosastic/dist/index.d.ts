import { Schema } from 'mongoose';
import { MongoosasticDocument, MongoosasticModel, Options } from './types';
declare function mongoosastic(schema: Schema<MongoosasticDocument, MongoosasticModel<MongoosasticDocument>>, options?: Options): void;
export = mongoosastic;
