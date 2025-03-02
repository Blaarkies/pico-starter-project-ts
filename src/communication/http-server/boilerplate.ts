import { overrideDefaults } from '../../common/function';

export interface HtmlDocumentConfig {
  title: string;
  body: string;
  style: string;
  script: string;
}

export function makeHtmlDocument(argsConfig?: Partial<HtmlDocumentConfig>) {
  let {title, body, script, style} = overrideDefaults<HtmlDocumentConfig>({
    title: '',
    body: '',
    style: '',
    script: '',
  }, argsConfig);

  let htmlDocument = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="description" content="" />
    <link rel="icon" href="favicon.ico">
    <style>${style}</style>
  </head>
  
  <body>
    ${body}
  </body>
  
  <script>
    ${script}
  </script>
</html>
`;

  return htmlDocument;
}