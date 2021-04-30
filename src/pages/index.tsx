import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient';
import { usePostsQuery } from '../generated/graphql';
import { Layout } from '../components/Layout';
import React from 'react';
import { Link } from '@chakra-ui/react';
import NextLink from 'next/link';

const Index = () => {
  const [{ data }] = usePostsQuery({
    variables: {
      limit: 10
    }
  })
  return (
    <Layout>
      <NextLink href="/create-post">
        <Link>create post</Link>
      </NextLink>
      <div>
        hello world
      </div>
      <br />
      {!data ?
        (<div>loading</div>) :
        data.posts.map(p => <div key={p.id}>{p.title}</div>)
      }
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)