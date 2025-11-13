import type { BannerAnnouncement } from '../../../sanity.types'
import { client } from './client'

export async function getActiveBannerAnnouncements(): Promise<BannerAnnouncement[]> {
  const query = `*[_type == "bannerAnnouncement" && isActive == true] | order(order asc) {
    _id,
    text,
    isActive,
    order
  }`

  const announcements = await client.fetch<BannerAnnouncement[]>(query, {}, {
    next: {
      revalidate: 60, // Revalidate every 60 seconds
      tags: ['bannerAnnouncements']
    }
  })

  return announcements
}
