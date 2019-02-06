const { GraphQLJSON } = require("gatsby/graphql");
const unified = require("unified");
const parse = require("rehype-parse");
const visit = require(`unist-util-visit`);
const { fluid } = require(`gatsby-plugin-sharp`);

exports.setFieldsOnGraphQLNodeType = ({
  type,
  getNodeAndSavePathDependency,
  reporter,
  getNodes,
  cache
}) => {
  if (type.name !== `wordpress__PAGE` && type.name !== `wordpress__POST`) {
    // we don't want extend anything but wordpress page and posts types
    return {};
  }

  return {
    htmlAst: {
      type: GraphQLJSON,
      resolve: async (postOrPage, _, context) => {
        const inputAST = unified()
          .use(parse)
          .parse(postOrPage.content);

        // we have html AST, but there is some things to clean up, because it added `body` element
        // and this should be partial html, so when we visit this AST we make sure to find body and replace
        // it with `div` that will serve as top level node
        let resultAST = inputAST;
        // we will track generating images here
        const promises = [];

        const mediaNodes = getNodes().filter(
          node => node.internal.type === `wordpress__wp_media`
        );

        visit(inputAST, `element`, htmlNode => {
          if (htmlNode.tagName === "body") {
            // this will be Root element we will return
            resultAST = {
              tagName: "div",
              type: "element",
              children: htmlNode.children
            };
            return null;
          } else if (htmlNode.tagName === "img") {
            let mediaNode = null;
            // hacky - use fact that wordpress uses `wp-image-${ID}` classes for inline images
            htmlNode.properties.className.some(c => {
              if (c.indexOf("wp-image-") === 0) {
                mediaNode = mediaNodes.find(
                  // intentionall == because string vs number and wordpress ¯\_(ツ)_/¯
                  node => node.wordpress_id == c.replace("wp-image-", "")
                );
              }
            });

            // try to find by src if search by class didn't work
            if (!mediaNode && htmlNode.properties.src) {
              mediaNode = mediaNodes.find(
                node => node.source_url == htmlNode.properties.src
              );
            }

            // if we found media node for that image
            if (mediaNode) {
              // make sure we add dependency on that media node for current query
              const file = getNodeAndSavePathDependency(
                mediaNode.localFile___NODE,
                context.path
              );

              // TO-DO revisit this later to make it configurable
              const args = {
                quality: 85,
                maxWidth: 1200
              };

              promises.push(
                fluid({
                  file,
                  args,
                  reporter,
                  cache
                }).then(fluidResults => {
                  // overwrite html img element with custom element that we will later rehype:
                  htmlNode.tagName = "image-to-rehype";
                  htmlNode.properties = {
                    base64: fluidResults.base64,
                    src: fluidResults.src,
                    sizes: fluidResults.size,
                    srcSet: fluidResults.srcSet,
                    aspectRatio: fluidResults.aspectRatio
                  };
                })
              );
            }
            return null;
          }
        });

        // wait for image processing to finish
        await Promise.all(promises);

        // return our customly wrapped content with div
        return resultAST;
      }
    }
  };

  // by default return empty object
  return {};
};
