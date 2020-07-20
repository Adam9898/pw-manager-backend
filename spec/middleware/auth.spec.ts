import {UserRepository} from "../../repositories/UserRepository";
import {User} from "../../models/User";
import {Role} from "../../enums/Role";
import mongo from "mongodb";
import {CryptoService} from "../../services/CryptoService";
import {authGuard, jwtRefresher, roleGuard} from "../../middleware/auth";
import {mockRequest, mockResponse} from "mock-req-res";
import createSpy = jasmine.createSpy;

describe('an auth middleware group', () => {

    let userRepository: UserRepository;
    let cryptoService: CryptoService;
    let testUser: User;
    let jwt: string;

    beforeEach(async () => {
        userRepository = new UserRepository();
        cryptoService = new CryptoService();
        const user = new User('test@gmail.com', 'Test1234');
        user.roles.add(Role.Regular);
        const userId = await userRepository.insertUser(user);
        user.id =  (userId as mongo.ObjectId).toHexString();
        testUser = user;
        jwt = cryptoService.signJsonWebToken(userId);
    })

    afterEach(async () => {
        await userRepository.emptyUsers();
    })

    function createModifiedMockRequest() {
        return mockRequest({
            header(headerName: string) { return this.headers[headerName.toLowerCase()]; }
        });
    }

    it('should have set a refresh token after authGuard() is called', async () => {
        const request = createModifiedMockRequest();
        request.headers.authorization = jwt;
        const response = mockResponse();
        const spy = spyOn(response, 'set')
        await authGuard(request, response, () => {});
        expect(spy).toHaveBeenCalledWith('pw-manager-refresh-token', jwt);
    });

    it('should have user property on the request object after authGuard() is called', async () => {
        const request = createModifiedMockRequest();
        const response = mockResponse();
        request.headers.authorization = jwt;
        await authGuard(request, response, () => {});
        expect((request as any).user).toBeDefined();
    });

    it('should have user property on the request object that is an instance of User after authGuard() is called', async () => {
        const request = createModifiedMockRequest();
        const response = mockResponse();
        request.headers.authorization = jwt;
        await authGuard(request, response, () => {});
        expect((request as any).user).toBeInstanceOf(User);
    });

    it('should call next() after authGuard() is called', async () => {
        const request = createModifiedMockRequest();
        const response = mockResponse();
        request.headers.authorization = jwt;
        const nextSpy = createSpy('next');
        await authGuard(request, response, nextSpy);
        expect(nextSpy).toHaveBeenCalled();
    });

    it('should call request.status with status code 401 when authGuard() is called with invalid jwt', async () => {
        const request = createModifiedMockRequest();
        const response = mockResponse();
        request.headers.authorization = 'wrongjwt';
        const spy = spyOn(response, 'status');
        try {
            await authGuard(request, response, () => {
            });
        } catch (e) {
            // will throw an error but we can ignore it, all that matters is that the right method has been called with
            // the proper parameters
        }
        expect(spy).toHaveBeenCalledWith(401);
    });

    it('should call next when jwtRefresher is called', () => {
        const request = createModifiedMockRequest();
        const response = mockResponse();
        const spy = createSpy('next')
        jwtRefresher(request, response, spy);
        expect(spy).toHaveBeenCalled();
    });

    it('should add refreshToken property to the request object when jwtRefresher() is called', () => {
        const request = createModifiedMockRequest();
        const response = mockResponse();
        request.headers.authorization = jwt;
        jwtRefresher(request, response, () => {})
        expect((request as any).refreshToken).toBeDefined();
    });

    it('should add refreshToken property with the right value to the request object when jwtRefresher() is called', () => {
        const request = createModifiedMockRequest();
        const response = mockResponse();
        request.headers.authorization = jwt;
        jwtRefresher(request, response, () => {})
        expect((request as any).refreshToken).toBe(jwt);
    });

    it('should call next when user has the specified role when roleGuard() is called', () => {
        const request = mockRequest();
        const response = mockResponse();
        const testUser = new User('test@test.com', 'test');
        testUser.roles.add(Role.Regular);
        (request as any).user = testUser;
        const spy = createSpy('next');
        roleGuard(Role.Regular, request, response, spy);
        expect(spy).toHaveBeenCalled();
    });

    it('should send back status code 403 when user doesn\'t have the specified role when roleGuard() is called' , () => {
        const request = mockRequest();
        const response = mockResponse();
        const testUser = new User('test@test.com', 'test');
        testUser.roles.add(Role.Regular);
        (request as any).user = testUser;
        const spyRequest = spyOn(response, 'status');
        try {
            roleGuard(Role.Admin, request, response, () => {});
        } catch (e) {
            // TypeError: Cannot read property 'send' of undefined. we can ignore this
        }
        expect(spyRequest).toHaveBeenCalledWith(401);
    });
});
