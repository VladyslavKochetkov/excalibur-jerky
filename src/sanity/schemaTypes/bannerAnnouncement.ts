import { defineType } from "sanity";

export const bannerAnnouncementType = defineType({
  name: "bannerAnnouncement",
  title: "Banner Announcement",
  type: "document",
  fields: [
    {
      name: "text",
      title: "Announcement Text",
      type: "string",
      validation: (Rule) => Rule.required().max(150),
      description:
        "Plain text announcement that will be displayed in the header banner",
    },
    {
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Toggle to show/hide this announcement",
    },
    {
      name: "order",
      title: "Display Order",
      type: "number",
      initialValue: 0,
      description:
        "Order in which announcements are displayed (lower numbers first)",
    },
  ],
  preview: {
    select: {
      title: "text",
      isActive: "isActive",
      order: "order",
    },
    prepare({ title, isActive, order }) {
      return {
        title: title,
        subtitle: `${isActive ? "✓ Active" : "✗ Inactive"} | Order: ${order}`,
      };
    },
  },
});
