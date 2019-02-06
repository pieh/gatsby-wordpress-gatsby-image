import React from "react";
import Image from "gatsby-image";
import rehypeReact from "rehype-react";

const RehypedImage = props => <Image fluid={props} />;

const renderAst = new rehypeReact({
  createElement: React.createElement,
  components: {
    "image-to-rehype": RehypedImage
  }
}).Compiler;

const hasASTContent = ast => ast.children.length > 0;

export default ({ ast }) => (hasASTContent(ast) ? renderAst(ast) : null);
export { hasASTContent };
