import {UserRepository} from "../../repositories/UserRepository";
import {User} from "../../models/User";
import {Role} from "../../enums/Role";


describe('A user repository', () => {

    let userRepository: UserRepository;

    beforeEach(() => {
        userRepository = new UserRepository();
    });

    afterAll(() => {
        userRepository.emptyUsers();
    });

    it('should be a proper user repository', function () {
        expect(userRepository).toBeInstanceOf(UserRepository);
    });


    it('should insert a user to the database', async () => {
        const user = new User('test@test.com', 'test_password', new Set<Role>([Role.Regular]));
        await userRepository.insertUser(user);
        const retrievedUser = await userRepository.getUser('test@test.com');
        delete retrievedUser.id;
        expect(retrievedUser).toEqual(user);
    })

    it('should return a user object', async () => {
        const user = await userRepository.getUser('test@test.com');
        expect(user).toBeDefined();
        expect(user).toBeInstanceOf(User);
    });

});
