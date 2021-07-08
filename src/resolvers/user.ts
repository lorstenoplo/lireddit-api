import { User } from "../entities/User";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import bcrypt from "bcryptjs";
import { getRepository } from "typeorm";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 3) {
      return {
        errors: [
          {
            field: "username",
            message: "Username should more than 3 charecters",
          },
        ],
      };
    }

    if (options.password.length <= 4) {
      return {
        errors: [
          {
            field: "password",
            message: "Password should more than 4 charecters",
          },
        ],
      };
    }

    const hashedPassword = bcrypt.hashSync(options.password, 8);
    let user;

    try {
      user = await User.create({
        username: options.username,
        password: hashedPassword,
      }).save();
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return {
          errors: [
            {
              field: "username",
              message: "Username already taken",
            },
          ],
        };
      } else {
        console.log("error while creating user:", error.message);
        return { user: undefined };
      }
    }

    req.session.userId = user?.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { username: options.username } });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "That username doesn't exist",
          },
        ],
      };
    }
    const valid = await bcrypt.compare(options.password, user.password);

    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Wrong password",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie("qid");
        if (err) {
          console.log("error destroying cookie", err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
