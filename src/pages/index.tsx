import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient';
import { usePostsQuery } from '../generated/graphql';
import { Layout } from '../components/Layout';
import React, { useState } from 'react';
import { Box, Button, Flex, Heading, IconButton, Link, Stack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { UpdootSection } from '../components/UpdootSection';
import { DeleteIcon } from '@chakra-ui/icons';

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string
  })
  const [{ data, fetching }] = usePostsQuery({
    variables
  })

  if (!fetching && !data) {
    return <div>you got query falied for some reason</div>
  }

  return (
    <Layout>
      <br />
      {!data && fetching ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
              <UpdootSection post={p} />
              <Box flex={1}>
                <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                  <Link>
                    <Heading fontSize="xl">{p.title}</Heading>
                  </Link>
                </NextLink>
                <Text>Posted by {p.creator.username}</Text>
                <Flex align="center">
                  <Text flex={1} mt={4}>{p.textSnippet}</Text>
                  <IconButton
                    aria-label="Delete Post"
                    icon={<DeleteIcon />}
                    onClick={() => console.log('saludos')}
                    colorScheme="red"
                  />
                </Flex>
              </Box>
            </Flex>
          )
          )}
        </Stack>
      )}
      { (data && data.posts.hasMore) &&
        <Flex>
          <Button onClick={() => setVariables({
            limit: variables.limit,
            cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
          })} isLoading={fetching} m="auto" my={8}>load more...</Button>
        </Flex>
      }
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)
