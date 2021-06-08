import { Box, Button, Flex, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useMeQuery, useLogoutMutation } from '../generated/graphql';
import { isServer } from '../utils/isServer';
import { Heading } from '@chakra-ui/layout';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({ }) => {
    const [{ data, fetching }] = useMeQuery({
        pause: isServer()
    })
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation()
    let body = null
    //data is loading
    if (fetching) {

        // user is not logged in
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2}>Login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link mr={2}>Register</Link>
                </NextLink>
            </>
        )
        // user logged in
    } else {
        body = (
            <Flex align="center">
                <NextLink href="/create-post">
                    <Button as={Link} mr={3}>create post</Button>
                </NextLink>
                <Box mr={2}>{data.me.username}</Box>
                <Button onClick={() => {
                    logout()
                }} variant="link"
                    isLoading={logoutFetching}
                >Logout</Button>
            </Flex>
        )
    }
    return (
        <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
            <Flex flex={1} m="auto" maxWidth={800} align="center">
                <NextLink href="/">
                    <Link>
                        <Heading>LiReddit</Heading>
                    </Link>
                </NextLink>
            </Flex>
            <Box ml={'auto'}>
                {body}
            </Box>
        </Flex>
    )
}