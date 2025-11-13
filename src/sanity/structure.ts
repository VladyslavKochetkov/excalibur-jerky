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
      // Divider
      S.divider(),
      // Rest of the document types
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== 'landing'
      ),
    ])
