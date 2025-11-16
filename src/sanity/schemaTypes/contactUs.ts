import { defineType } from "sanity";

export const contactUsType = defineType({
  name: "contactUs",
  title: "Contact Us Page",
  type: "document",
  // Singleton document - only one contact us page exists
  fields: [
    {
      name: "pageTitle",
      title: "Page Title",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
      description: "Main heading at the top of the page",
      initialValue: "Contact Us",
    },
    {
      name: "pageSubtitle",
      title: "Page Subtitle",
      type: "string",
      validation: (Rule) => Rule.max(200),
      description: "Optional subtitle below the main heading",
    },
    {
      name: "content",
      title: "Page Content",
      type: "array",
      of: [
        {
          type: "block",
          options: {
            spellCheck: true,
          }
        }
      ],
      validation: (Rule) => Rule.required(),
      description: "Main content for the Contact Us page (supports rich text)",
    },
  ],
  preview: {
    select: {
      title: "pageTitle",
      subtitle: "pageSubtitle",
    },
    prepare({ title, subtitle }) {
      return {
        title: "Contact Us Page",
        subtitle: title || subtitle,
      };
    },
  },
});
