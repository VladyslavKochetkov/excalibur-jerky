import { type SchemaTypeDefinition } from 'sanity'
import { bannerAnnouncementType } from './bannerAnnouncement'
import { landingType } from './landing'
import { productsType } from './products'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [bannerAnnouncementType, landingType, productsType],
}
