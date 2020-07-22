import request from 'supertest';
import {app} from "../../app";
import {UserRepository} from "../../repositories/UserRepository";
import {User} from "../../models/User";
import {Role} from "../../enums/Role";
import {SignUpRequest} from "../../models/jsonAPI/SignUpRequest";
import {LoginRequest} from "../../models/jsonAPI/LoginRequest";
import {CryptoService} from "../../services/CryptoService";

describe('a users route', () => {

    let userRepository: UserRepository;
    let user: User;

    beforeEach(() => {
        userRepository = new UserRepository();
    });

    beforeAll(async () => {
        userRepository = new UserRepository();
        user = new User('test@test.com', 'Test1234');
        user.roles.add(Role.Regular);
        const userId = await userRepository.insertUser(user);
        user.id = userId;
    });

    afterAll(async () => await userRepository.emptyUsers());

    it('should respond with 200 when checking email validity', (done) => {
        request(app)
            .post('/users/check-email')
            .send({
                email: user.email
            })
            .expect(200)
            .end(error => error ? done.fail(error) : done());

    });

    it('should set valid to false when email is already in use', (done) => {
        request(app)
            .post('/users/check-email')
            .send({
                email: user.email
            })
            .expect({
                valid: false
            })
            .end(error => error ? done.fail(error) : done());
    });

    it('should set valid to true when email is NOT in use', (done) => {
        request(app)
            .post('/users/check-email')
            .send({
                email: 'unique@test.com'
            })
            .expect({
                valid: true
            })
            .end(error => error ? done.fail(error) : done());
    });

    it('should respond with 200 when registering user', (done) => {
        const jsonPayload: SignUpRequest = {
            email: 'test@gmail.com',
            password: 'Test1234'
        }
        request(app)
            .post('/users')
            .send(jsonPayload)
            .expect(201)
            .end((error, res) => {
                if (error) {
                    done.fail(error);
                } else {
                    expect(res.body.success).toBeTrue();
                    expect(res.body.token).toBeDefined();
                    done();
                }
            });
    });

    it('should respond with 400 when email is duplicate', (done) => {
        const jsonPayload: SignUpRequest = {
            email: 'test@gmail.com',
            password: 'Test1234'
        }
        request(app)
            .post('/users')
            .send(jsonPayload)
            .expect(400)
            .end(error => error ? done.fail(error) : done());
    });

    it('should respond with 400 when email is not an actual email address', (done) => {
        const jsonPayload: SignUpRequest = {
            email: 'test',
            password: 'Test1234'
        }
        request(app)
            .post('/users')
            .send(jsonPayload)
            .expect(400)
            .end(error => error ? done.fail(error) : done());
    });

    it('should return status code 200 when logging in a user', (done) => {
        const jsonPayload: LoginRequest = {
            email: 'test@gmail.com',
            password: 'Test1234'
        }
        request(app)
            .post('/users/login')
            .send(jsonPayload)
            .expect(200)
            .end(error => error ? done.fail(error) : done());
    });

    it('should send back jwt when logging in a user', (done) => {
        const jsonPayload: LoginRequest = {
            email: 'test@gmail.com',
            password: 'Test1234'
        }
        request(app)
            .post('/users/login')
            .send(jsonPayload)
            .end((error, res) => {
                if (error) {
                    done.fail(error);
                } else {
                    expect(res.body.token).toBeDefined();
                    done();
                }
            });
    });

    it('should send back a json with the property success set to true', (done) => {
        const jsonPayload: LoginRequest = {
            email: 'test@gmail.com',
            password: 'Test1234'
        }
        request(app)
            .post('/users/login')
            .send(jsonPayload)
            .end((error, res) => {
                if (error) {
                    done.fail(error);
                } else {
                    expect(res.body.success).toBeTruthy();
                    done();
                }
            });
    });

    it('should login a user and send back a valid jwt', (done) => {
        const jsonPayload: LoginRequest = {
            email: 'test@gmail.com',
            password: 'Test1234'
        }
        request(app)
            .post('/users/login')
            .send(jsonPayload)
            .end((error, res) => {
                if (error) {
                    done.fail(error);
                } else {
                    let cryptoService = new CryptoService();
                    expect(cryptoService.verifyJwt(res.body.token)).toBeDefined();
                    done();
                }
            });
    });

    it('should send back a json with the property success set to false', (done) => {
        const jsonPayLoad: LoginRequest = {
            email: 'wrong@test.com',
            password: 'wrong-password'
        };
        request(app)
            .post('/users/login')
            .send(jsonPayLoad)
            .expect({success: false})
            .end(error => error ? done.fail(error) : done());
    });

});
