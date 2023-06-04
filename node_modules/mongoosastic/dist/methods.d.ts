import { ApiResponse } from '@elastic/elasticsearch';
import { IndexMethodOptions, MongoosasticDocument } from './types';
export declare function index(this: MongoosasticDocument, inOpts?: IndexMethodOptions): Promise<MongoosasticDocument | ApiResponse>;
export declare function unIndex(this: MongoosasticDocument): Promise<MongoosasticDocument>;
