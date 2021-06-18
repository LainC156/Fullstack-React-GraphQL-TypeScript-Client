import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import { betterUpdateQuery } from "./betterUpdateQuery";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { pipe, tap } from "wonka";
import Router from "next/router";
import gql from "graphql-tag";
import { isServer } from "./isServer";
//import { simplePagination } from '@urql/exchange-graphcache/extras';
import { DeletePostMutationVariables } from '../generated/graphql';

const errorExchange: Exchange =
  ({ forward }) =>
    (ops$) => {
      return pipe(
        forward(ops$),
        tap(({ error }) => {
          if (error?.message.includes("not authenticated")) {
            Router.replace("/login");
          }
        })
      );
    };

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    console.log("entityKey:", entityKey);
    console.log("fieldName:", fieldName);
    const allFields = cache.inspectFields(entityKey);
    console.log("allFields: ", allFields);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    console.log("fieldinfos: ", fieldInfos);
    const size = fieldInfos.length;
    if (size === 0) {
      console.log("size: ");
      return undefined;
    }
    /// check if data is in cache
    console.log("fieldargs: ", fieldArgs);
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    console.log(fieldInfos[0].arguments);
    console.log("key we created: ", fieldKey);
    const isItInTheCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    );

    console.log("isItInTheCache: ", isItInTheCache);
    info.partial = !isItInTheCache;
    let hasMore = true;
    console.log("info.partial: ", info.partial);
    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, fi.fieldName) as string[];
      const _hasMore = cache.resolve(key, "hasMore");
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      console.log("data: ", data);
      console.log("hasMore: ", hasMore);
      results.push(...data);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

function invalidateAllPosts(cache: Cache) {
  const allFields = cache.inspectFields("Query")
  const fieldInfos = allFields.filter(
    (info) => info.fieldName === "posts"
  )
  fieldInfos.forEach((fi) => {
    cache.invalidate("Query", "posts", fi.arguments || {})
  });
}

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = ''
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie
  }
  return ({
    url: process.env.NEXT_PUBLIC_API_URL as string,
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie ? {
        cookie
      } : undefined
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            deletePost: (_result, args, cache, info) => {
              cache.invalidate({
                __typename: 'Post',
                id: (args as DeletePostMutationVariables).id
              })
            },
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
                { id: postId } as any
              );
              if (data) {
                if (data.voteStatus === value) {
                  console.log('no se puede asignar el mism valor')
                  return;
                }
                console.log('voteStatus: ', data.voteStatus)
                const newPoints = (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
                console.log('points: ', data.points)
                console.log('newPoints: ', newPoints)
                cache.writeFragment(
                  gql`
                  fragment __ on Post {
                    points
                    voteStatus
                  }
                `,
                  { id: postId, points: newPoints, voteStatus: value } as any
                );
              }
            },
            createPost: (_result, args, cache, info) => {
              invalidateAllPosts(cache)
            },
            logout: (_result, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },
            login: (_result, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPosts(cache)
            },
            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  })
};
