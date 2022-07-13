import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  findOneByOrFail: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token-baby'),
  verity: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // Mock Repository === fake implementation
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        { provide: JwtService, useValue: mockJwtService() },
        { provide: MailService, useValue: mockMailService() },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: '',
      password: '',
      role: 0,
    };
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '1234@google.com',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({ ok: false, error: 'user exists.' });
    });
    it('should create new user', async () => {
      usersRepository.findOne.mockReturnValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationRepository.save.mockResolvedValue({
        code: 'code',
      });

      const result = await service.createAccount(createAccountArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );

      expect(result).toMatchObject({ ok: true });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "couldn' create account" });
    });
  });
  describe('login', () => {
    const loginArgs = {
      email: 'sfdsf',
      password: 'sdkfj',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: false,
        error: 'user not found',
      });
    });

    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'wrong password',
      });
    });

    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({
        ok: true,
        token: expect.any(String),
      });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: expect.any(Object),
      });
    });
  });
  describe('findById', () => {
    const findByIdArgs = {
      id: 1,
    };
    it('should fail when user not found', async () => {
      usersRepository.findOneByOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });
    it('should find user', async () => {
      usersRepository.findOneByOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({
        ok: true,
        user: findByIdArgs,
      });
    });
  });
  describe('editProfile', () => {
    it('should fail when user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.editProfile(1, {
        email: 'dsf',
        password: 'dsf',
      });
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });
    it('should change email success', async () => {
      const editProfileArgs = {
        userId: 1,
        input: {
          email: 'dsf@dkf.com',
        },
      };
      const oldUser = {
        email: 'sdkfj@ldsf.com',
        verified: true,
      };

      const newVerification = {
        code: 'code',
      };
      const newUser = {
        email: editProfileArgs.input.email,
        verified: false,
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      verificationRepository.create.mockReturnValue(newVerification);
      verificationRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });
      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
        expect.any(String),
      );
    });
    it('should change password success', async () => {
      const editProfileArgs = {
        userId: 1,
        input: {
          password: 'newpassword',
        },
      };
      const oldUser = {
        password: 'sajd',
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(oldUser);
      expect(result).toEqual({
        ok: true,
      });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: 'sdf' });
      expect(result).toEqual({
        ok: false,
        error: 'Could not update profile.',
      });
    });
  });
  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerification = {
        id: 1,
        user: {
          verified: false,
        },
      };
      verificationRepository.findOne.mockResolvedValue(mockedVerification);
      const result = await service.verifyEmail('code');
      expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });
      expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );
      expect(result).toEqual({
        ok: true,
      });
    });
    it('should fail on verification not found', async () => {
      verificationRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('code');
      expect(result).toEqual({
        ok: false,
        error: 'verification not found',
      });
    });
    it('should fail on exception', async () => {
      verificationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('code');
      expect(result).toEqual({
        ok: false,
        error: expect.any(Object),
      });
    });
  });
});
