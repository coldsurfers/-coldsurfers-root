import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import client from '../../api/openapi-client';
import {v1QueryKeyFactory} from '../../query-key-factory';

const DEFAULT_SIZE = 20;

const queryFn = async (offset: number, size: number) => {
  const data = await client.GET('/v1/subscribe/concert', {
    params: {
      query: {
        offset: `${offset}`,
        size: `${size}`,
      },
    },
  });
  return data.data;
};

type TQueryData = Awaited<ReturnType<typeof queryFn>>;
type TError = Error;
type TQueryParams = {offset: number; size: number};
type TQueryKey =
  (typeof v1QueryKeyFactory)['concerts']['subscribedList']['queryKey'];
type TPageParam = number;

type Options = Partial<
  UseInfiniteQueryOptions<
    TQueryData,
    TError,
    InfiniteData<TQueryData, TQueryParams>,
    TQueryData,
    TQueryKey,
    TPageParam
  >
>;

const useSubscribedConcertListQuery = (options?: Options) => {
  return useInfiniteQuery({
    ...options,
    initialPageParam: 0,
    queryKey: v1QueryKeyFactory.concerts.subscribedList.queryKey,
    queryFn: async ({pageParam = 0}) => queryFn(pageParam, DEFAULT_SIZE),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) {
        return undefined;
      }
      if (lastPage.length < DEFAULT_SIZE) {
        return undefined;
      }
      return allPages.length * DEFAULT_SIZE;
    },
  });
};

export default useSubscribedConcertListQuery;