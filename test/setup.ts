import 'reflect-metadata';
import 'jest';

type MockDecorator = () => jest.Mock;

interface MockedTypeORM {
  Entity: MockDecorator;
  Column: MockDecorator;
  PrimaryGeneratedColumn: MockDecorator;
  CreateDateColumn: MockDecorator;
  UpdateDateColumn: MockDecorator;
  OneToOne: MockDecorator;
  JoinColumn: MockDecorator;
  ManyToOne: MockDecorator;
  OneToMany: MockDecorator;
  ManyToMany: MockDecorator;
  JoinTable: MockDecorator;
  Index: MockDecorator;
  Unique: MockDecorator;
  [key: string]: any;
}

jest.mock('typeorm', (): MockedTypeORM => {
  const actual = jest.requireActual<typeof import('typeorm')>('typeorm');
  return {
    ...actual,
    Entity: (): jest.Mock => jest.fn(),
    Column: (): jest.Mock => jest.fn(),
    PrimaryGeneratedColumn: (): jest.Mock => jest.fn(),
    CreateDateColumn: (): jest.Mock => jest.fn(),
    UpdateDateColumn: (): jest.Mock => jest.fn(),
    OneToOne: (): jest.Mock => jest.fn(),
    JoinColumn: (): jest.Mock => jest.fn(),
    ManyToOne: (): jest.Mock => jest.fn(),
    OneToMany: (): jest.Mock => jest.fn(),
    ManyToMany: (): jest.Mock => jest.fn(),
    JoinTable: (): jest.Mock => jest.fn(),
    Index: (): jest.Mock => jest.fn(),
    Unique: (): jest.Mock => jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});
