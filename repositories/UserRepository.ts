import {MongoDBConnector} from "./MongoDBConnector";
import {User} from "../models/User";
import {Role} from "../enums/Role";
import mongo from "mongodb";

export class UserRepository {

    private readonly collection = MongoDBConnector.applicationWideDb.collection('users');

    async getUser(email: string) {
        const result = await this.collection.findOne({email}, {projection: {secrets: 0}});
        const user = new User(result.email, result.password)
        user.id = result._id;
        user.roles = new Set<Role>(result.roles);
        return user;
    }

    async getUserById(userId: string) {
        const result = await this.collection.findOne({ '_id': new mongo.ObjectId(userId) }, {projection: {secrets: 0}});
        const user = new User(result.email, result.password)
        user.id = result._id;
        user.roles = new Set<Role>(result.roles);
        return user;
    }

    async insertUser(userToInsert: User) {
        const userObj = {
            email: userToInsert.email,
            password: userToInsert.password,
            roles: [...userToInsert.roles],
            secrets: []
        }
        const result = await this.collection.insertOne(userObj);
        return result.insertedId;
    }

    async emptyUsers() {
        await this.collection.deleteMany({});
    }

}
