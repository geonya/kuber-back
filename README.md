# The Backend of Kuber

### 0.6 Backend setup

```
npm i -g @nestjs/cli
nest new kuber-back
```

- using npm

### 0.7 Intro

- NestJS + GraphQL

### 1.0 Apollo Server

https://docs.nestjs.com/graphql/quick-start

```
npm i @nestjs/graphql @nestjs/apollo graphql apollo-server-express
```

- AppModule 에 GraphQL 추가

```ts
 imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
  ],
```

```ts
@Resolver()
export class RestaurantResolver {
  @Query(() => Boolean)
  isPizzaGood() {
    return true;
  }
}
```

- 자동으로 schema.gql 파일이 만들어진다
- autoSchemaFile:true 로 설정하면 파일이 만들어지는대신 메모리에 저장됨
- 타입스크립트식 표현을 이용해서 graphql 스키마를 손쉽게 쓸 수 있는 것

- Args 등을 class 로 정리하여 모듈화하기 위해 DTO 방식을 이용한다.

- class validator 와 class transform

```
npm i class-validator class-transformer
```

```js
app.useGlobalPipes(new ValidationPipe());
```

```ts
@ArgsType()
export class CreateRestaurantDto {
  @Field((type) => String)
  @IsString()
  @Length(2, 10)
  name: string;

  @Field((type) => Boolean)
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String)
  @IsString()
  address: string;

  @Field((type) => String)
  @IsString()
  ownerName: string;
}
```

- 데코레이터들을 중첩하여 필드마다 검증이 가능하다.

### 2.0 TypeORM

- postgres setup
  - brew intstall postgres
  - brew install --cask postico

TypeORM is an ORM that can run in NodeJS, Browser, Cordova, PhoneGap, Ionic, React Native, NativeScript, Expo, and Electron platforms and can be used with TypeScript and JavaScript (ES5, ES6, ES7, ES8). Its goal is to always support the latest JavaScript features and provide additional features that help you to develop any kind of application that uses databases - from small applications with a few tables to large scale enterprise applications with multiple databases.

- ORM을 쓰면 SQL 문을 쓰는 대신에 코드를 써서 상호작용할 수 있음
- Typescript 코드를 작성하면 TypeORM이 데이터베이스와 통신함

- NestJS Database Setup
- https://docs.nestjs.com/techniques/database

```
npm install --save @nestjs/typeorm typeorm mysql2
```

- import `TypeOrmModule`
- data source options : https://typeorm.io/data-source

```ts
TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'geony',
      password: '1234',
      database: 'kuber',
      logging: true,
      synchronize: true,
    }),
```

### 2.4 ConfigService

https://docs.nestjs.com/techniques/configuration

- dotenv 와 같은 방식
- module 중에서 가장 top-level 에서 사용해야함

```
npm i cross-env
```

```
   "start:dev": "cross-env ENV=dev && nest start --watch",

```

- cross-env 를 이용해 개발 환경 모드를 설정할 수 있음

### 2.5 Configuring ConfigService

- 배포시 env 파일 모두 무시하기

```
ignoreEnvFile: process.env.NODE_ENV === 'prod',
```

- env 파일에 정의하기
- pakage.json script 파일에 cross-env NODE_ENV 설정하기
- app.module.ts 에 ConfigModule 에 옵션에서 NODE_ENV 조건에 따라 각각의 .env.dev 혹은 .env.test 등에 env 파일을 설정할 수 있음

### 2.6 Validating ConfigService

- https://www.npmjs.com/package/joi
- JavaScript용 가장 강력한 스키마 설명 언어 및 데이터 유효성 검사기.

```
npm i joi && npm i -D @types/joi

import * as Joi from "joi"
```

- 환경변수의 유효성을 검사할 수 있음

```js
    validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
```
