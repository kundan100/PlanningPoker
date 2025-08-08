'use client'; // The 'use client'; directive is required because styled-components is a client-side library, and this file uses React Client Components.

import Image from "next/image";
import styles from "./page.module.css";
import styled from 'styled-components';

const Title = styled.h1`
  font-size: 2rem;
  color: #0070f3;
  text-align: center;
  margin-top: 2rem;
`;

export default function Home() {
  return <h1>Dashboard</h1>;
}
