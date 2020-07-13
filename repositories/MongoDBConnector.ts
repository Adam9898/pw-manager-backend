import {Db, MongoClient} from "mongodb";
import chalk from "chalk";

/**
 * Creates a MongoDB connections. It functions as a wrapper around MongoClient.
 */
export class MongoDBConnector {

    private readonly uri: string;
    private readonly mongoClient: MongoClient;
    private _db: Db | undefined;
    private static _applicationWideDb: Db;


    constructor(user: string, password: string, host: string, port: number, private databaseName: string) {
        this.uri = `mongodb://${user}:${password}@${host}:${port}`;
        this.mongoClient = new MongoClient(this.uri, {useUnifiedTopology: true});
    }

    get db(): Db | undefined {
        return this._db;
    }

    static get applicationWideDb(): Db {
        return this._applicationWideDb;
    }

    /**
     *  Tries to connect to a mongoDB server, and logs some information about the process to the console.
     *  The only parameter is a boolean value, if not provided, it defaults to false. When set to true, a static field
     *  containing the database instance will be available. If the static field is already set by another instance,
     *  it will be replaced.
     *  @param makeDatabaseStatic
     */
    async connect(makeDatabaseStatic = false) {
        try {
            await this.mongoClient.connect()
                .then().catch().finally();
        }
         catch (e) {
            console.error(chalk.red('Failed to establish connection to database. Error: ' + e));
        } finally {
            if (this.mongoClient.isConnected()) {
                this.initializeDatabaseInstance(makeDatabaseStatic);
                console.log(chalk.green('Successfully connected to database.'));
            }
        }
    }

    private initializeDatabaseInstance(makeDatabaseStatic: boolean) {
        this._db = this.mongoClient.db(this.databaseName);
        if (makeDatabaseStatic) {
            MongoDBConnector._applicationWideDb = this.mongoClient.db(this.databaseName);
        }
    }
}
