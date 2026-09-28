import { LocalRepository } from "@/lib/data/local-repository";

declare global {
  var nextChapterLocalRepository: LocalRepository | undefined;
}

export const repository = globalThis.nextChapterLocalRepository ?? new LocalRepository();
globalThis.nextChapterLocalRepository = repository;
