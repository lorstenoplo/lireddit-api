import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

export const createVoteStatusLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      const updootIdsToUpdoots: Record<string, Updoot> = {};
      updoots.forEach((updoot) => {
        updootIdsToUpdoots[`${updoot.userId}|${updoot.postId}`] = updoot;
      });

      return keys.map(
        (key) => updootIdsToUpdoots[`${key.userId}|${key.postId}`]
      );
    }
  );
