import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singleton landing page
      S.listItem()
        .title('Landing Page')
        .child(
          S.document()
            .schemaType('landing')
            .documentId('landing')
        ),
      // Singleton about us page
      S.listItem()
        .title('About Us Page')
        .child(
          S.document()
            .schemaType('aboutUs')
            .documentId('aboutUs')
        ),
      // Divider
      S.divider(),
      // Rest of the document types
      ...S.documentTypeListItems().filter(
        (item) => !['landing', 'aboutUs'].includes(item.getId() ?? '')
      ),
    ])
