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
import { config } from "dotenv";

const main = async () => {
  config();
  // console.log(process.env.DB_HOSTNAME);
  await createConnection({
    type: "mysql",
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    port: 3306,
    logging: true,
    synchronize: true,
    entities: [Post, User, Updoot],
    username: "root",
    password: process.env.DB_PASSWORD,
  });

  // await Post.delete({});

  const app = express();

  app.set("trust proxy",1)

  var options = {
    host: process.env.DB_HOSTNAME,
    port: 3306,
    database: process.env.DB_NAME,
    expiration: Infinity,
    username: "root",
    password: process.env.DB_PASSWORD,
  };

  const sessionStore = new MySQLStore(options);

  app.use(
    cors({
      origin: process.env.ORIGIN,
      credentials: true,
    })
  );
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      name: "qid",
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 2,
        httpOnly: true,
        secure: __prod__, // cookie only works in prod
        sameSite: "lax", // csrf
        domain: ".lireddit.social",
        path:"/"
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

  app.listen(4000, "0.0.0.0");
};

main().catch((err) => {
  console.error(err);
});
