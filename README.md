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
