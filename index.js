"use strict";
const fs = require("fs");
const path = require("path");
const mjml2html = require("mjml");
const tempWrite = require("temp-write");
const opn = require("opn");

class ServerlessSesMjmlPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      "preview-template": {
        usage: "Preview your html template in a browser",
        options: {
          template: {
            usage:
              "Specify the template you want to preview (e.g. --template myTemplate)",
            shortcut: "t",
            required: true
          }
        },
        lifecycleEvents: ["preview"]
      }
    };

    this.hooks = {
      "preview-template:preview": () => this.buildAndPreview(),
      "before:deploy:deploy": () => this.addResources()
    };
  }

  buildAndPreview() {
    const { location, templates } = this.getConfig();
    const template = templates.find(
      ({ name }) => name === this.options.template
    );
    const { HtmlPart, TextPart } = this.generateParts(location, template);
    const filePath = tempWrite.sync(HtmlPart || TextPart, "template.html");
    this.serverless.cli.log(`Template Created - ${filePath}`);
    opn(filePath);
    return filePath;
  }

  addResources() {
    const config = this.getConfig();
    const resources = this.serverless.service.provider
      .compiledCloudFormationTemplate.Resources;
    Object.assign(resources, this.getTemplateResources(config));
  }

  getConfig() {
    return Object.assign(
      {
        location: "email-templates",
        templates: []
      },
      this.serverless.service.custom.sesTemplates
    );
  }

  getTemplateResources({ location, templates }) {
    return templates.reduce(
      (acc, template) =>
        Object.assign({}, acc, {
          [`SESTemplate${this.getCfnName(name)}`]: {
            Type: "AWS::SES::Template",
            Properties: {
              Template: this.generateParts(location, template)
            }
          }
        }),
      {}
    );
  }

  generateParts(location, { name, subject, mjml, text }) {
    const textString = fs.readFileSync(path.join(location, text), "utf8");
    const mjmlString = fs.readFileSync(path.join(location, mjml), "utf8");
    const htmlString = mjml2html(mjmlString, {
      keepComments: false,
      minify: true
    });

    if (htmlString.errors && htmlString.errors.length) {
      htmlString.errors.forEach(error => {
        this.serverless.cli.log(JSON.stringify(error));
      });
      throw new this.serverless.classes.Error("Cannot process invalid mjml");
    } else {
      return {
        TemplateName: name,
        SubjectPart: subject,
        HtmlPart: htmlString.html,
        TextPart: textString
      };
    }
  }

  getCfnName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "");
  }
}

module.exports = ServerlessSesMjmlPlugin;
