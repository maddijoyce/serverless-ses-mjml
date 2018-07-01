<h1 align="center">
  Serverless-SES-MJML
</h1>
<h4 align="center"><a href="https://serverless.com" target="_blank">Serverless</a> plugin that allows you to build responsive email templates in mjml.</h4>
<br>

## Installation

Install the plugin via <a href="https://yarnpkg.com/lang/en/docs/install/">Yarn</a> (recommended)

```
yarn add serverless-ses-mjml
```

or via <a href="https://docs.npmjs.com/cli/install">NPM</a>

```
npm install serverless-ses-mjml
```

### Configuring the plugin

Add `serverless-ses-mjml` to the plugins section of `serverless.yml`

```
plugins:
   - serverless-ses-mjml
```

Add the following example config to the custom section of `serverless.yml`

```yaml
custom:
  sesTemplates:
    location: # defaults to email-templates
    templates:
      - name: # template name
        subject: # subject line
        mjml: # mjml file name
        text: # text file name
```

## Usage

### `serverless deploy```

This command will deploy all SES template resources in the same CloudFormation template used by the other serverless resources.

## Credits

Thanks to <a target="_blank" href="https://github.com/sid88in/serverless-appsync-plugin">sid88in</a> and everyone else who built the serverless-appsync-plugin. Your code was consulted often while I made this one. Cheers!
