'use client';

import Link from 'next/link';
import styled from 'styled-components';

/*
* styled components
* This has FOUC (Flash of Unstyled Content) i.e. the content gets visible without style for flickering of seconds.
* To avoid FOUC with styled-components in Next.js, use CSS Modules, global CSS or SSR.
*/
const StyledNav = styled.nav`
  padding: 1rem;
  border-bottom: 1px solid #ccc;
`;

const StyledLink = styled(Link)`
  margin-right: 1rem;
`;

const StyledMain = styled.main`
  padding: 1rem;
`;

/*
* component
*/
export default function PokerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <StyledNav>
        <StyledLink href="/poker">Poker</StyledLink>
        <StyledLink href="/poker/about-us">About-Poker</StyledLink>
        <StyledLink href="/poker/connect-us">Connect-Poker</StyledLink>
      </StyledNav>

      <StyledMain>{children}</StyledMain>
    </div>
  );
}
