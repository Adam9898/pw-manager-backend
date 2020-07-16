import {UserRepository} from "../../repositories/UserRepository";
import {SecretRepository} from "../../repositories/SecretRepository";
import {Secret} from "../../models/Secret";
import {User} from "../../models/User";
import {Role} from "../../enums/Role";
import {MongoDBConnector} from "../../repositories/MongoDBConnector";

describe('a secret repository', () => {

    let secretRepository: SecretRepository;
    let user: User;
    let secretHolder: any;

    afterAll(async () => {
        const userRepository = new UserRepository();
        await userRepository.emptyUsers();
    });

    beforeAll(async () => {
        const userRepository = new UserRepository();
        user = new User('test@test.com', 'test', new Set<Role>([Role.Regular]));
        await userRepository.insertUser(user);
        user = await userRepository.getUser('test@test.com');
    });

    beforeEach(() => {
        secretRepository = new SecretRepository();
    })

    it('should insert a secret', async () => {
        const secret = new Secret('test-name', 'test-username', 'test-password');
        secretHolder = await secretRepository.insertSecret(secret, user.id!);
        const retrievedUser = await MongoDBConnector.applicationWideDb.collection('users')
            .findOne({email: 'test@test.com'});
        delete retrievedUser.secrets[0]._id;
        expect(retrievedUser.secrets[0]).toEqual(JSON.parse(JSON.stringify(secret)));
    });

    it('should retrieve a secret', async () => {
        const retrievedSecret = await secretRepository.getSecret(secretHolder._id, user.id!);
        const secret = new Secret('test-name', 'test-username', 'test-password');
        delete retrievedSecret.id;
        delete secret.id;
        expect(retrievedSecret).toEqual(secret);
    });

    it('should insert another secret and retrieve it by id', async () => {
        const secret2 = new Secret('test2', 'test-user2', 'test-password2');
        secretHolder = await secretRepository.insertSecret(secret2, user.id!);
        const retrievedSecret = await secretRepository.getSecret(secretHolder._id, user.id!);
        delete secret2.id;
        delete retrievedSecret.id;
        expect(retrievedSecret).toEqual(secret2);
    });

    it('should retrieve the secrets names and ids tied to a user', async () => {
        const secrets = await secretRepository.getSecretsNamesAndIds(user.id!);
        expect(secrets[0].name).toBe('test-name');
        expect(secrets[1]._id).toEqual(secretHolder._id);
    })

    it('should delete the specified secret', async () => {
        let testBool = true;
        await secretRepository.deleteSecret(user.id!, secretHolder._id);
       try {
           await secretRepository.getSecret(secretHolder._id, user.id!,);
       } catch (e) {
           testBool = false;
       }
       expect(testBool).toBeFalse();
    });

    it('should not have deleted the other secret', async () => {
        const result = await secretRepository.getSecretsNamesAndIds(user.id!);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should update the specified secret', async () => {
        const aNewSecret = new Secret('test', 'test-user', 'test-pass')
        const currentSecretHolder = await secretRepository.insertSecret(aNewSecret, user.id!);
        const secretToUpdate = new Secret('name-updated', 'username-updated',
            'password-updated', currentSecretHolder._id.toHexString());
        await secretRepository.updateSecret(user.id!, secretToUpdate);
        const retrievedSecret = await secretRepository.getSecretsNamesAndIds(user.id!);
        expect(retrievedSecret[1].name).toEqual(secretToUpdate.name);
    });

});
