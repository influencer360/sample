import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Post {
  id: number;
  name: string;
}

type PostsResponse = Post[];

export const coreApi = createApi({
  reducerPath: "coreApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["socialUsers"],
  endpoints: (build) => ({
    getSocialUsers: build.query<any, void>({
      query: () => "socialUsers",
      providesTags:["socialUsers"]
    }),
    addSocialUser: build.mutation<Post, Partial<Post>>({
      query(body) {
        return {
          url: `posts`,
          method: "POST",
          body
        };
      },
      invalidatesTags: ["socialUsers"]
    })
  })
});

export const {useGetSocialUsersQuery,useAddSocialUserMutation} = coreApi;