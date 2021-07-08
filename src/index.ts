import "reflect-metadata";
import { __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
const MySQLStore = require("express-mysql-session")(session);
import cors from "cors";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createVoteStatusLoader } from "./utils/createVoteStatusLoader";

const main = async () => {
  const conn = await createConnection({
    type: "mysql",
    database: "lireddit2",
    username: "root",
    password: "root",
    port: 3306,
    logging: true,
    synchronize: true,
    entities: [Post, User, Updoot],
  });

  // await Post.delete({});

  const app = express();

  var options = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "lireddit2",
    expiration: Infinity,
  };

  const sessionStore = new MySQLStore(options);

  app.use(
    cors({
      origin: "http://localhost:8080",
      credentials: true,
    })
  );
  app.use(
    session({
      store: sessionStore,
      secret: "HbhsdjuynkjJkuih",
      resave: false,
      saveUninitialized: false,
      name: "qid",
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 2,
        httpOnly: true,
        secure: __prod__, // cookie only works in prod
        sameSite: "lax", // csrf
      },
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      userLoader: createUserLoader(),
      updootLoader: createVoteStatusLoader(),
    }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log("server up and running at http://localhost:4000/graphql");
  });
};

main().catch((err) => {
  console.error(err);
});
