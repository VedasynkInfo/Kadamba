import { WebsiteSettings } from '../models/WebsiteSettings';
import { GalleryItem } from '../models/GalleryItem';

/**
 * One-off content repair for the live development database.
 *
 * The values below are the studio's published Kurnool details (found via the
 * public business listing) plus the corrected opening hours. Social profiles
 * are cleared until the studio supplies verified handles; the UI hides the row
 * rather than linking to a platform home page.
 */
const SITE_UPDATE = {
  phoneDisplay: '+91 90540 69489',
  phoneTel: '+919054069489',
  phoneAltDisplay: '',
  phoneAltTel: '',
  email: 'hello@kadambastudio.com',
  addressLines: [
    "Kadamba's Designer Studio",
    'First Floor, H.No. 40/808 B1, near Gulp',
    'Sreenivas Nagar, Prakash Nagar',
    'Kurnool, Andhra Pradesh 518004',
  ],
  landmark: 'Near Gulp, Sreenivas Nagar',
  locality: 'Prakash Nagar',
  city: 'Kurnool',
  state: 'Andhra Pradesh',
  pincode: '518004',
  hours: [
    { day: 'Monday – Saturday', time: '10:00 AM – 7:00 PM' },
    { day: 'Sunday', time: 'By appointment' },
  ],
  whatsappNumber: '919054069489',
  whatsappPrefill:
    "Hi Kadamba's Designer Studio — I'd like to enquire about bridal / traditional wear.",
  mapEmbedUrl: 'https://maps.google.com/maps?q=15.83866%2C78.038834&z=17&output=embed',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=15.83866%2C78.038834',
  social: [],
  socialNamed: {
    instagram: '',
    facebook: '',
    youtube: '',
    whatsappLink: '',
    googleBusiness: '',
  },
};

async function main() {
  const { connectDB, disconnectDB } = await import('../config/database');
  await connectDB();

  const settings = await WebsiteSettings.findOneAndUpdate(
    { key: 'site' },
    { $set: SITE_UPDATE },
    { new: true, upsert: false },
  );
  if (!settings) {
    console.warn('No website settings document found; run seed:cms first.');
  } else {
    console.log('Updated website settings: phone, address, map, hours, social.');
  }

  const gallery = await GalleryItem.updateOne(
    { $or: [{ slug: 'w' }, { title: 'uhi' }] },
    { $set: { published: false } },
  );
  console.log(`Unpublished ${gallery.modifiedCount} test gallery item.`);

  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
