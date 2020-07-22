import {UserRepository} from "../../repositories/UserRepository";
import {app} from "../../app";
import request from "supertest";
import {User} from "../../models/User";
import {Role} from "../../enums/Role";
import {CryptoService} from "../../services/CryptoService";
import {MongoDBConnector} from "../../repositories/MongoDBConnector";
import {ObjectId} from 'mongodb';
import {SecretRepository} from "../../repositories/SecretRepository";
import {Secret} from "../../models/Secret";

describe('secrets route', () => {

    let userRepository: UserRepository;
    let user: User;
    let jwt: string;
    let secretId: string;

    beforeAll(async () => {
       userRepository = new UserRepository();
       user = new User('test@test.com', 'Test1234');
       user.roles.add(Role.Regular);
       user.id = await userRepository.insertUser(user);
       const cryptoService = new CryptoService();
       jwt = cryptoService.signJsonWebToken(user.id!);
    });

    beforeEach(() => {
        userRepository = new UserRepository();
    });

    afterAll(async () => await userRepository.emptyUsers());

    it('should respond with http status code 201 when sending a secret to the server', (done) => {
        const secretJson = {
            name: 'test-name',
            username: 'test-username',
            password: 'test-password'
        }
        request(app)
            .post('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .send(secretJson)
            .expect(201)
            .end(error => error ? done.fail(error) : done());
    });

    it('should insert a secret when the secret is sent to the server', (done) => {
        const secretJson = {
            name: 'test-name-2',
            username: 'test-username-2',
            password: 'test-password-2'
        }
        request(app)
            .post('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .send(secretJson)
            .expect(201)
            .end(error => {
                if (error) {
                    done.fail(error);
                } else {
                    const collection = MongoDBConnector.applicationWideDb.collection('users');
                    const userWithSecrets = collection.findOne({ _id: user.id }).then(userWithSecrets => {
                        userWithSecrets.secrets.forEach((user: any) => delete user._id);
                        expect(userWithSecrets.secrets).toContain(secretJson);
                        done();
                    });
                }
            });
    });

    it('should respond with status code 400 when an invalid secret is sent to server', (done) => {
        const secretJson = {
            name: '',
            username: 'test',
            password: 'test'
        }
        request(app)
            .post('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .send(secretJson)
            .expect(400)
            .end(error => error ? done.fail(error) : done());
    });

    it('should only insert a secret to the database, when user is authorized', (done) => {
        const secretJson = {
            name: 'test-name',
            username: 'test-username',
            password: 'test-password'
        }
        request(app)
            .post('/secrets')
            .set('Authorization', 'Bearer ' + jwt + 'invalid')
            .send(secretJson)
            .expect(401)
            .end(error => error ? done.fail(error) : done());
    });

    it('should respond with 200 when a delete request is sent to the server', (done) => {
        const collection = MongoDBConnector.applicationWideDb.collection('users');
        collection.findOne({ _id: user.id }).then(user => {
            const secretId = user.secrets[0]._id;
            request(app)
                .delete(`/secrets/${secretId}`)
                .set('Authorization', 'Bearer ' + jwt)
                .expect(200)
                .end(error => error ? done.fail(error) : done());
        });
    });

    it('should respond with 500 when a delete request is sent to the server', (done) => {
        const collection = MongoDBConnector.applicationWideDb.collection('users');
        collection.findOne({ _id: user.id }).then(user => {
            const secretId = new ObjectId().toHexString();
            request(app)
                .delete(`/secrets/${secretId}`)
                .set('Authorization', 'Bearer ' + jwt)
                .expect(500)
                .end(error => error ? done.fail(error) : done());
        });
    });

    it('should respond with 500 when a delete request is sent to the server with a different user than the secret\'s owner', (done) => {
        const secretId = new ObjectId().toHexString();
        const newUser = new User('jltest@test.com', 'Test1234');
        newUser.roles.add(Role.Regular);
        userRepository.insertUser(newUser).then(userId => {
            const cryptoService = new CryptoService();
            const newJwt = cryptoService.signJsonWebToken(userId);
            request(app)
                .delete(`/secrets/${secretId}`)
                .set('Authorization', 'Bearer ' + newJwt)
                .expect(500)
                .end(error => error ? done.fail(error) : done());
        });
    });

    it('should respond with 200 when sending a GET request to th server in order to retrieve a secret', (done) => {
        const collection = MongoDBConnector.applicationWideDb.collection('users');
        collection.findOne({ _id: user.id }).then(user => {
            const secretId = user.secrets[0]._id;
            request(app)
                .get(`/secrets/${secretId}`)
                .set('Authorization', 'Bearer ' + jwt)
                .expect(200)
                .end(error => error ? done.fail(error) : done());
        });
    });

    it('should get back the right secret when sending a GET request to the server in order to retrieve a secret', (done) => {
        const collection = MongoDBConnector.applicationWideDb.collection('users');
        collection.findOne({ _id: user.id }).then(user => {
            const secretId = user.secrets[0]._id;
            request(app)
                .get(`/secrets/${secretId}`)
                .set('Authorization', 'Bearer ' + jwt)
                .end((error, res) => {
                    if (error) {
                        done.fail(error);
                    } else {
                        delete res.body.id;
                        expect(res.body).toEqual({
                            name: 'test-name-2',
                            username: 'test-username-2',
                            password: 'test-password-2'
                        });
                        done();
                    }
                });
        });
    });

    it('shouldn\'t be able to to retrieve someone else\'s secret when sending a GET request to the server to retrieve a secret', (done) => {
        const aNewUser = new User('rand@gmail.com', 'Test1234');
        aNewUser.roles.add(Role.Regular);
        userRepository.insertUser(aNewUser).then(userId => aNewUser.id = userId)
            .then(() => {
                const secretRepository = new SecretRepository();
                const sc = new Secret('rand', 'rand-username', 'rand-password');
                return secretRepository.insertSecret(sc, user.id!)
            })
            .then(secretObj => {
                const cryptoService = new CryptoService();
                secretId = secretObj._id.toHexString();
                request(app)
                    .get(`/secrets/${secretObj._id}`)
                    .set('Authorization', 'Bearer ' + cryptoService.signJsonWebToken(aNewUser.id!))
                    .expect(500)
                    .end(error => error ? done.fail(error) : done());
            });
    });

    it('should respond with 200 when a PUT request is sent to the server to /secrets', (done) => {
        const reqJson = {
            name: 'updated name',
            username: 'updated username',
            password: 'updated password',
            _id: secretId
        }
        request(app)
            .put('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .send(reqJson)
            .expect(200)
            .end(error => error ? done.fail(error) : done());
    });

    it('should respond with 500 when a PUT request with an invalid secret id is sent to the server to /secrets', (done) => {
        const reqJson = {
            name: 'updated name',
            username: 'updated username',
            password: 'updated password',
            _id: new ObjectId()
        }
        request(app)
            .put('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .send(reqJson)
            .expect(500)
            .end(error => error ? done.fail(error) : done());
    });

    it('should respond with 400 when an invalid secretJson is sent to the server with a PUT request', (done) => {
        const reqJson = {
            name: '',
            username: 'updated username',
            password: 'updated password',
            _id: secretId
        }
        request(app)
            .put('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .send(reqJson)
            .expect(400)
            .end(error => error ? done.fail(error) : done());
    });

    it('should respond with 500 after trying to update a secret while the specified secret id is belonging to another user', (done) => {
        const reqJson = {
            name: 'updated name',
            username: 'updated username',
            password: 'updated password',
            _id: secretId
        }
        const newUser = new User('justtesting@test.com', 'Test1234');
        newUser.roles.add(Role.Regular);
        userRepository.insertUser(newUser).then(newUserId => {
            const cryptoService = new CryptoService();
            const newJwt = cryptoService.signJsonWebToken(newUserId);
            request(app)
                .put('/secrets')
                .set('Authorization', 'Bearer ' + newJwt)
                .send(reqJson)
                .expect(500)
                .end(error => error ? done.fail(error) : done());
        });
    });

    it('should respond with 200 when requesting secret id\'s and names', (done) => {
        request(app)
            .get('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .expect(200)
            .end(error => error ? done.fail(error) : done());
    });

    it('should only retrieve id\'s and names when sending a get request to /secrets ', (done) => {
        request(app)
            .get('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .end((error, res) => {
                if (error) {
                    done.fail(error);
                } else {
                    const secret = res.body[0];
                    expect(secret._id).toBeDefined();
                    expect(secret.name).toBeDefined();
                    expect(secret.username).toBeUndefined();
                    expect(secret.password).toBeUndefined();
                    done();
                }
            });
    });

    it('should retrieve the right secrets when a GET request is sen to /secrets ', (done) => {
        request(app)
            .get('/secrets')
            .set('Authorization', 'Bearer ' + jwt)
            .end((error, res) => {
                if (error) {
                    done.fail(error);
                } else {
                    const secret = res.body[1];
                    expect(secret._id).toEqual(secretId);
                    done();
                }
            });
    });
});
