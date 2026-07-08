import { Helmet } from 'react-helmet-async'
import { useTranslation } from '../context/LanguageContext'

export default function SEO({ titleEn, titleAr, descEn, descAr, path, ogImage, schema }) {
  const { lang } = useTranslation()
  const siteName = lang === 'ar' ? 'سيت أب ستوديو' : 'Setup Studio'
  const defaultTitle = lang === 'ar' ? 'سيت أب ستوديو — استوديو إنتاج متكامل في الإسكندرية' : 'Setup Studio — Premium Production Studio in Alexandria'
  const defaultDesc = lang === 'ar'
    ? 'استوديو إنتاج متكامل في الإسكندرية يقدم مساحات حصرية للتصوير الفوتوغرافي وصناعة الأفلام والبودكاست والإنتاج الإبداعي.'
    : 'Full-service production studio in Alexandria offering exclusive spaces for photography, filmmaking, podcasting, and creative productions.'
  const title = lang === 'ar' ? titleAr : titleEn
  const desc = lang === 'ar' ? descAr : descEn
  const fullTitle = title ? `${title} | ${siteName}` : defaultTitle
  const fullDesc = desc || defaultDesc
  const og = ogImage || '/images/logo.jpg'
  const url = `https://setup-studios.com${path || ''}`
  const enUrl = url
  const arUrl = url

  return (
    <Helmet>
      <html lang={lang === 'ar' ? 'ar' : 'en'} />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:image" content={og} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={og} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hreflang="en" href={enUrl} />
      <link rel="alternate" hreflang="ar" href={arUrl} />
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  )
}
