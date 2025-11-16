import { type SchemaTypeDefinition } from 'sanity'
import { aboutUsType } from './aboutUs'
import { bannerAnnouncementType } from './bannerAnnouncement'
import { contactUsType } from './contactUs'
import { landingType } from './landing'
import { productsType } from './products'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [aboutUsType, bannerAnnouncementType, contactUsType, landingType, productsType],
}
