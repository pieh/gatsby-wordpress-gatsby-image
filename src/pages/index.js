import React from "react";
import { Link, graphql } from "gatsby";

import Layout from "../components/layout";
import Image from "../components/image";
import SEO from "../components/seo";

import AstRenderer from "../utils/render-ast";

export const IndexPage = ({ data }) =>
  console.log(data) || (
    <Layout>
      <SEO title="Home" keywords={[`gatsby`, `application`, `react`]} />
      <h1>Hi people</h1>
      <p>Welcome to your new Gatsby site.</p>
      <p>Now go build something great.</p>
      <div style={{ maxWidth: `300px`, marginBottom: `1.45rem` }}>
        <Image />
      </div>
      <Link to="/page-2/">Go to page 2</Link>
      <AstRenderer ast={data.wordpressPage.htmlAst} />
    </Layout>
  );

export default IndexPage;

export const query = graphql`
  {
    wordpressPage(slug: { eq: "sample-page" }) {
      content
      htmlAst
      title
    }
  }
`;
