import {User} from "../../models/User";
import {UserRepository} from "../../repositories/UserRepository";
import {Role} from "../../enums/Role";
import mongo from "mongodb";
import {CryptoService} from "../../services/CryptoService";
import {app} from "../../app";
import request from 'supertest';
import {NotificationData} from "../../models/jsonAPI/NotificationData";

describe('a notifications route', () => {

    let userRepository: UserRepository;
    let cryptoService: CryptoService;
    let testUser: User;
    let jwt: string;


    beforeAll(async () => {
        userRepository = new UserRepository();
        cryptoService = new CryptoService();
        testUser = new User('test@test.com', 'Test1234');
        testUser.roles.add(Role.Regular);
        testUser.roles.add(Role.Admin);
        const userId: mongo.ObjectId = await userRepository.insertUser(testUser);
        testUser.id = userId.toHexString();
        jwt = cryptoService.signJsonWebToken(testUser.id);
    });

    afterAll(async () => {
        await userRepository.emptyUsers();
    });

    it('should respond with status 200 when a post request is sent to notifications/send', (done) => {
        const notificationToSend: NotificationData = {
            title: 'test',
            description: 'test-description'
        }
        request(app)
            .post('/notifications/send')
            .send(notificationToSend)
            .set('Authorization', 'Bearer ' + jwt)
            .expect(200)
            .end(error => error ? done.fail(error) : done());
    });

    it('should respond with status 400 when an invalid notification json payload sent to notifications/send', (done) => {
        const notificationToSend: NotificationData = {
            title: '', //invalid because validation will fail when title is empty
            description: 'test-description'
        }
        request(app)
            .post('/notifications/send')
            .send(notificationToSend)
            .set('Authorization', 'Bearer ' + jwt)
            .expect(400)
            .end(error => error ? done.fail(error) : done());
    });


});
