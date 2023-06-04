import { BulkIndexOptions, BulkInstruction, BulkOptions, BulkUnIndexOptions, MongoosasticDocument, MongoosasticModel } from './types';
export declare function bulkAdd(opts: BulkIndexOptions): Promise<void>;
export declare function bulkDelete(opts: BulkUnIndexOptions): Promise<void>;
export declare function bulkIndex(model: MongoosasticModel<MongoosasticDocument>, instruction: BulkInstruction[], bulk: BulkOptions): Promise<void>;
export declare function flush(this: MongoosasticModel<MongoosasticDocument>): Promise<void>;
