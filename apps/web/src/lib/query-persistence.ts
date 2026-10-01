import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Query } from "@tanstack/react-query";
import { createStore, del, get, set } from "idb-keyval";

// Kept below the ~24.8 day setTimeout limit, otherwise restored queries are collected at once.
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 20;

const PERSISTED_ROOTS = new Set(["works", "chapters", "thesaurus"]);

const store = createStore("writea", "query-cache");

export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get<string>(key, store).then((value) => value ?? null),
    setItem: (key, value) => set(key, value, store),
    removeItem: (key) => del(key, store),
  },
  key: "writea-queries",
  throttleTime: 1000,
});

export const shouldPersistQuery = (query: Query) =>
  query.state.data !== undefined && PERSISTED_ROOTS.has(String(query.queryKey[0]));
