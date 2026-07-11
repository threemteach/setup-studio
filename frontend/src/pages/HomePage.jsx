import SEO from "../components/SEO"
import Hero from "../components/sections/Hero"
import Slider from "../components/sections/Slider"
import Spaces from "../components/sections/Spaces"
import AboutSetup from "../components/sections/AboutSetup"
import OurProcess from "../components/sections/OurProcess"
import PlansAndContact from "../components/sections/PlansAndContact"
import CtaBanner from "../components/sections/CtaBanner"

export default function HomePage() {
  return (
    <>
      <SEO
        descEn="Setup Studio — Premium production studio in Alexandria offering photography, videography, podcasting, and creative spaces for rent."
        descAr="سيت أب ستوديو — استوديو إنتاج متميز في الإسكندرية يقدم مساحات للتصوير الفوتوغرافي وصناعة الفيديو والبودكاست والإنتاج الإبداعي للإيجار."
        path="/"
        schema={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Setup Studio",
          alternateName: "سيت أب ستوديو",
          description: "Premium production studio in Alexandria offering exclusive spaces for photography, filmmaking, podcasting, and creative productions.",
          url: "https://setup-studios.com",
          image: "https://setup-studios.com/images/logo.jpg",
          address: { "@type": "PostalAddress", addressLocality: "Alexandria", addressCountry: "EG" }
        }}
      />
      <Hero />
      <Slider />
      <Spaces />
      <AboutSetup />
      <OurProcess />
      <CtaBanner />
      <PlansAndContact />
    </>
  )
}
