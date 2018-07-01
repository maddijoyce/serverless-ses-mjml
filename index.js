"use strict";
const fs = require("fs");
const path = require("path");
const mjml = require("mjml");
const tempWrite = require("temp-write");
const opn = require("opn");

class ServerlessSESTemplatesPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;

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
      "preview-template:preview": this.buildAndPreview(),
      "before:deploy:deploy": this.addResources()
    };
  }

  buildAndPreview() {
    const { location, templates } = this.getConfig();
    const template = templates.find(({ name }) => name === this.options.name);
    const { HtmlPart, TextPart } = this.generateParts(location, template);

    const filePath = tempWrite(HtmlPart || TextPart, "template.html");
    opn(filePath);
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
    const htmlString = mjml(mjmlString);
    return {
      TemplateName: name,
      SubjectPart: subject,
      HtmlPart: htmlString,
      TextPart: textString
    };
  }

  getCfnName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "");
  }
}

module.exports = ServerlessSESTemplatesPlugin;
