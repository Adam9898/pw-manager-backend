import {MongoDBConnector} from "./MongoDBConnector";
import {Secret} from "../models/Secret";
import mongo from 'mongodb';

export class SecretRepository {

    private readonly collection = MongoDBConnector.applicationWideDb.collection('users');

    /**
     *  The secret id is basically an array index. Therefore it always starts at 0. The algorithm will fetch the specific
     *  secret that is tied to a user. Therefore you need to provide a user id.
     */
    async getSecret(secretId: string, userId: string) {
        const retrievedSecret = await this.collection.findOne({ _id: userId });
        const secrets: any[]  = retrievedSecret.secrets;
        const foundSecret = secrets.find(secret => secret._id.equals(secretId));
        if (!foundSecret) {
            throw new Error('secret not found');
        }
        return new Secret(foundSecret.name, foundSecret.username,
            foundSecret.password, foundSecret._id);
    }

    /**
     * This asynchronous method actually updates the specified document of the users collection by pushing a secret to
     * the user's secrets array.
     */
    async insertSecret(secretToInsert: Secret, userId: string) {
        const secretObj = {
            _id: new mongo.ObjectID(),
            name: secretToInsert.name,
            username: secretToInsert.username,
            password: secretToInsert.password
        }
        await this.collection.updateOne({_id: userId }, { $push: { secrets: secretObj } });
        return secretObj;
    }

    /**
     *  Returns the name and id and for all the secrets tied to a specific user. This is mainly for listing the saved
     *  secrets in the password manager.
     */
    async getSecretsNamesAndIds(userId: string) {
        const results = await this.collection
            .findOne({_id: userId}, { projection: {secrets: 1, "secrets._id": 1, "secrets.name": 1 } });
        return results.secrets;
    }

    /**
     * Removes a secret from the secrets array of the specified user
     */
    async deleteSecret(userId: string, secretId: string) {
        await this.collection.updateOne({ _id: userId }, { $pull: { secrets: { _id: secretId } }});
    }

    async updateSecret(userId: string, secret: Secret) {
        await this.collection.updateOne({ _id: userId, "secrets._id": new mongo.ObjectId(secret.id) }, { $set: {
                "secrets.$.name": secret.name,
                "secrets.$.username": secret.username,
                "secrets.$.password": secret.password
            } });
    }

}
