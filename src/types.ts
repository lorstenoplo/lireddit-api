import { Response } from "express";
import { createUserLoader } from "./utils/createUserLoader";
import { createVoteStatusLoader } from "./utils/createVoteStatusLoader";

export type MyContext = {
  req: any;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createVoteStatusLoader>;
};
